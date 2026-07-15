"use client";

import { useState, useRef } from "react";
import styles from "./FileUpload.module.css";

const CONSOLE_SCRIPT = `(async () => {
  console.log("Iniciando extração de dados do Instagram...");
  
  const getCookie = (name) => {
    const value = "; " + document.cookie;
    const parts = value.split("; " + name + "=");
    if (parts.length === 2) return parts.pop().split(";").shift();
  };
  
  const userId = getCookie("ds_user_id");
  if (!userId) {
    console.error("Erro: Usuário não identificado. Certifique-se de estar logado no Instagram.");
    alert("Erro: Certifique-se de estar logado na versão Web do Instagram (instagram.com).");
    return;
  }
  
  const csrfToken = getCookie("csrftoken");
  let appId = "936619743392459";
  try {
    const scripts = Array.from(document.querySelectorAll("script"));
    for (const script of scripts) {
      if (script.textContent.includes('appId":')) {
        const match = script.textContent.match(/appId":\\\\s*"(\\\\d+)"/);
        if (match) {
          appId = match[1];
          break;
        }
      }
    }
  } catch(e) {}
  
  const headers = {
    "X-CSRFToken": csrfToken,
    "X-IG-App-ID": appId,
    "X-Requested-With": "XMLHttpRequest"
  };

  const fetchAll = async (endpointType) => {
    let list = [];
    let hasNext = true;
    let maxId = "";
    
    console.log("Buscando lista de " + endpointType + "...");
    
    while (hasNext) {
      const url = "/api/v1/friendships/" + userId + "/" + endpointType + "/?count=200" + (maxId ? "&max_id=" + maxId : "");
      try {
        const response = await fetch(url, { headers });
        if (!response.ok) throw new Error("HTTP error! status: " + response.status);
        const data = await response.json();
        
        const users = data.users || [];
        list = list.concat(users.map(u => ({
          username: u.username,
          profileUrl: "https://www.instagram.com/" + u.username,
          timestamp: Math.floor(Date.now() / 1000)
        })));
        
        console.log("Progresso: " + list.length + " usuários coletados...");
        
        hasNext = data.next_max_id ? true : false;
        maxId = data.next_max_id || "";
        
        if (hasNext) await new Promise(r => setTimeout(r, 1500));
      } catch (err) {
        console.error("Erro ao buscar lote:", err);
        alert("Erro na coleta. Apenas " + list.length + " perfis foram carregados. Tente novamente.");
        hasNext = false;
      }
    }
    
    return list;
  };

  try {
    const following = await fetchAll("following");
    await new Promise(r => setTimeout(r, 2000));
    const followers = await fetchAll("followers");
    
    const downloadJSON = (data, filename) => {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };
    
    const combinedData = { followers, following };
    downloadJSON(combinedData, "instagram_connections.json");
    
    console.log("Coleta concluída com sucesso! O arquivo instagram_connections.json foi baixado.");
    alert("Extração Concluída! O arquivo 'instagram_connections.json' foi baixado com sucesso. Agora faça o upload dele no aplicativo!");
  } catch (e) {
    console.error("Erro geral na extração:", e);
  }
})();`;

export default function FileUpload({ onDataLoaded }) {
  const [activeTab, setActiveTab] = useState("quick");

  // Estados dos arquivos
  const [followers, setFollowers] = useState(null);
  const [following, setFollowing] = useState(null);
  const [followersName, setFollowersName] = useState("");
  const [followingName, setFollowingName] = useState("");

  // Estado para o arquivo combinado
  const [combinedFileName, setCombinedFileName] = useState("");

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const [dragOverFollowers, setDragOverFollowers] = useState(false);
  const [dragOverFollowing, setDragOverFollowing] = useState(false);
  const [dragOverCombined, setDragOverCombined] = useState(false);

  const followersInputRef = useRef(null);
  const followingInputRef = useRef(null);
  const combinedInputRef = useRef(null);

  const parseInstagramJSON = (jsonText, isFollowing) => {
    try {
      const data = JSON.parse(jsonText);
      let rawList = [];

      if (isFollowing) {
        if (data.relationships_following && Array.isArray(data.relationships_following)) {
          rawList = data.relationships_following;
        } else if (Array.isArray(data)) {
          rawList = data;
        } else if (typeof data === "object") {
          const keys = Object.keys(data);
          for (const key of keys) {
            if (Array.isArray(data[key])) {
              rawList = data[key];
              break;
            }
          }
        }
      } else {
        if (Array.isArray(data)) {
          rawList = data;
        } else if (data.relationships_followers && Array.isArray(data.relationships_followers)) {
          rawList = data.relationships_followers;
        } else if (typeof data === "object") {
          const keys = Object.keys(data);
          for (const key of keys) {
            if (Array.isArray(data[key])) {
              rawList = data[key];
              break;
            }
          }
        }
      }

      const parsedList = rawList
        .map((item) => {
          let username = "";
          let profileUrl = "";
          let timestamp = 0;

          if (item.string_list_data && Array.isArray(item.string_list_data) && item.string_list_data.length > 0) {
            const detail = item.string_list_data[0];
            username = detail.value || "";
            profileUrl = detail.href || `https://www.instagram.com/${username}`;
            timestamp = detail.timestamp || 0;
          } else if (item.value) {
            username = item.value;
            profileUrl = item.href || `https://www.instagram.com/${username}`;
            timestamp = item.timestamp || 0;
          } else if (item.username) {
            username = item.username;
            profileUrl = item.profileUrl || `https://www.instagram.com/${username}`;
            timestamp = item.timestamp || 0;
          }

          return { username, profileUrl, timestamp };
        })
        .filter((user) => user.username !== "");

      return parsedList;
    } catch (e) {
      console.error("Falha ao analisar JSON:", e);
      return null;
    }
  };

  const processFile = (file, isFollowing) => {
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      setError("Por favor, selecione apenas arquivos .json.");
      return;
    }

    setError("");
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const parsed = parseInstagramJSON(text, isFollowing);

      if (parsed) {
        if (isFollowing) {
          setFollowing(parsed);
          setFollowingName(file.name);
        } else {
          setFollowers(parsed);
          setFollowersName(file.name);
        }
      } else {
        setError(`Falha ao ler o formato do arquivo ${file.name}. Certifique-se de que é o arquivo correto do Instagram.`);
      }
    };
    reader.readAsText(file);
  };

  const processCombinedFile = (file) => {
    if (!file) return;

    if (!file.name.endsWith(".json")) {
      setError("Por favor, selecione apenas arquivos .json.");
      return;
    }

    setError("");
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (data.followers && data.following && Array.isArray(data.followers) && Array.isArray(data.following)) {
          setFollowers(data.followers);
          setFollowing(data.following);
          setCombinedFileName(file.name);
        } else {
          setError("O arquivo selecionado não possui a estrutura combinada de seguidores e seguindo.");
        }
      } catch (e) {
        setError("Erro ao processar o arquivo JSON combinado. Certifique-se de que o arquivo não está corrompido.");
      }
    };
    reader.readAsText(file);
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(CONSOLE_SCRIPT).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleConfirm = () => {
    if (followers && following) {
      onDataLoaded({ followers, following });
    }
  };

  const isReady = followers !== null && following !== null;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Instagram Unfollow Manager</h1>
      <p className={styles.subtitle}>
        Compare sua lista de conexões de forma 100% segura e offline
      </p>

      {/* Navegação por Abas */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tabBtn} ${activeTab === "quick" ? styles.tabBtnActive : ""}`}
          onClick={() => {
            setActiveTab("quick");
            setError("");
          }}
        >
          Método Rápido (Sem Espera)
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === "official" ? styles.tabBtnActive : ""}`}
          onClick={() => {
            setActiveTab("official");
            setError("");
          }}
        >
          Método Oficial (Meta ZIP)
        </button>
      </div>

      {error && (
        <div style={{ color: "#EF4444", textAlign: "center", marginBottom: "20px", fontWeight: "600" }}>
          {error}
        </div>
      )}

      {/* Conteúdo da Aba Método Rápido (Console) */}
      {activeTab === "quick" && (
        <div className={styles.consoleInstructions}>
          <div className={styles.instructionsCard}>
            <div className={styles.instructionsTitle}>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Como gerar seu arquivo JSON instantaneamente:
            </div>
            <ol className={styles.stepList}>
              <li className={styles.stepItem}>
                <span className={styles.stepNumber}>1</span>
                Acesse o <strong><a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer">Instagram.com</a></strong> no seu computador e faça login.
              </li>
              <li className={styles.stepItem}>
                <span className={styles.stepNumber}>2</span>
                Abra as ferramentas de desenvolvedor do navegador pressionando <strong>F12</strong> (ou botão direito do mouse &gt; Inspecionar) e vá para a aba <strong>Console</strong>.
              </li>
              <li className={styles.stepItem}>
                <span className={styles.stepNumber}>3</span>
                Copie o script abaixo, cole no console do Instagram e aperte <strong>Enter</strong>:
              </li>
            </ol>

            <div className={styles.codeArea}>
              <pre className={styles.codeBlock}><code>{CONSOLE_SCRIPT}</code></pre>
            </div>

            <div className={styles.copyArea}>
              <button
                onClick={handleCopyScript}
                className={`${styles.copyBtn} ${copied ? styles.copyBtnCopied : ""}`}
              >
                {copied ? (
                  <>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Copiado!
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    Copiar Script
                  </>
                )}
              </button>
            </div>

            <li className={styles.stepItem} style={{ listStyle: "none" }}>
              <span className={styles.stepNumber}>4</span>
              O script buscará seus seguidores e seguindo de forma segura. Ao concluir, ele baixará automaticamente o arquivo <strong>instagram_connections.json</strong> no seu computador. Carregue-o abaixo:
            </li>
          </div>

          {/* Zona de Upload Única */}
          <div
            className={`${styles.singleDropzone} ${dragOverCombined ? styles.dropzoneActive : ""} ${isReady ? styles.dropzoneSuccess : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverCombined(true);
            }}
            onDragLeave={() => setDragOverCombined(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverCombined(false);
              const file = e.dataTransfer.files[0];
              processCombinedFile(file);
            }}
            onClick={() => combinedInputRef.current?.click()}
          >
            <input
              type="file"
              ref={combinedInputRef}
              className={styles.fileInput}
              accept=".json"
              onChange={(e) => processCombinedFile(e.target.files[0])}
            />
            <svg
              className={styles.icon}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isReady ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              )}
            </svg>
            <div className={styles.zoneTitle}>
              {isReady ? "Arquivo Conexões Carregado!" : "Upload do arquivo combinado"}
            </div>
            <div className={styles.zoneDesc}>
              {isReady
                ? `${followers.length} seguidores e ${following.length} seguindo encontrados (${combinedFileName})`
                : "Arraste ou clique para carregar o arquivo instagram_connections.json"}
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo da Aba Método Oficial (Meta ZIP) */}
      {activeTab === "official" && (
        <div>
          <div className={styles.uploadGrid}>
            {/* Caixa Seguidores */}
            <div
              className={`${styles.dropzone} ${dragOverFollowers ? styles.dropzoneActive : ""} ${followers ? styles.dropzoneSuccess : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverFollowers(true);
              }}
              onDragLeave={() => setDragOverFollowers(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverFollowers(false);
                const file = e.dataTransfer.files[0];
                processFile(file, false);
              }}
              onClick={() => followersInputRef.current?.click()}
            >
              <input
                type="file"
                ref={followersInputRef}
                className={styles.fileInput}
                accept=".json"
                onChange={(e) => processFile(e.target.files[0], false)}
              />
              <svg
                className={styles.icon}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {followers ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                )}
              </svg>
              <div className={styles.zoneTitle}>
                {followers ? "Seguidores Importados!" : "Upload de Seguidores"}
              </div>
              <div className={styles.zoneDesc}>
                {followers
                  ? `${followers.length} contas encontradas (${followersName})`
                  : "Arraste ou clique para carregar followers_1.json"}
              </div>
            </div>

            {/* Caixa Seguindo */}
            <div
              className={`${styles.dropzone} ${dragOverFollowing ? styles.dropzoneActive : ""} ${following ? styles.dropzoneSuccess : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverFollowing(true);
              }}
              onDragLeave={() => setDragOverFollowing(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverFollowing(false);
                const file = e.dataTransfer.files[0];
                processFile(file, true);
              }}
              onClick={() => followingInputRef.current?.click()}
            >
              <input
                type="file"
                ref={followingInputRef}
                className={styles.fileInput}
                accept=".json"
                onChange={(e) => processFile(e.target.files[0], true)}
              />
              <svg
                className={styles.icon}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {following ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                )}
              </svg>
              <div className={styles.zoneTitle}>
                {following ? "Seguindo Importado!" : "Upload de Seguindo"}
              </div>
              <div className={styles.zoneDesc}>
                {following
                  ? `${following.length} contas encontradas (${followingName})`
                  : "Arraste ou clique para carregar following.json"}
              </div>
            </div>
          </div>

          <div className={styles.instructionsCard}>
            <div className={styles.instructionsTitle}>
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Como obter esses arquivos no Instagram? (Meta Oficial)
            </div>
            <ol className={styles.stepList}>
              <li className={styles.stepItem}>
                <span className={styles.stepNumber}>1</span>
                Acesse as <strong>Configurações</strong> do Instagram e vá na <strong>Central de Contas</strong>.
              </li>
              <li className={styles.stepItem}>
                <span className={styles.stepNumber}>2</span>
                Acesse <strong>Suas informações e permissões</strong> e selecione <strong>Baixar suas informações</strong>.
              </li>
              <li className={styles.stepItem}>
                <span className={styles.stepNumber}>3</span>
                Selecione <strong>Algumas das suas informações</strong> e marque apenas <strong>Seguidores e seguindo</strong>.
              </li>
              <li className={styles.stepItem}>
                <span className={styles.stepNumber}>4</span>
                <strong>Importante:</strong> Altere o Formato para <strong>JSON</strong> (o padrão é HTML) e o Intervalo de datas para <strong>Desde o início</strong>.
              </li>
              <li className={styles.stepItem}>
                <span className={styles.stepNumber}>5</span>
                Envie a solicitação. Quando o Instagram liberar o download (geralmente leva de algumas horas até dias), extraia o ZIP e carregue os arquivos <strong>followers_1.json</strong> e <strong>following.json</strong>.
              </li>
            </ol>
          </div>
        </div>
      )}

      {isReady && (
        <div className={styles.statusMessage}>
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Dados carregados! Pronto para analisar as conexões.
        </div>
      )}

      <button
        onClick={handleConfirm}
        className={`${styles.btn} ${!isReady ? styles.btnDisabled : ""}`}
        disabled={!isReady}
      >
        Analisar Conexões
      </button>
    </div>
  );
}
