"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Key, AlertCircle, Play, Pause, RefreshCw, CheckCircle2, ShieldAlert, X, Heart, UserPlus, UserMinus, Search, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";

export default function TwitterPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [credentials, setCredentials] = useState({
    authToken: "",
    csrfToken: ""
  });
  const [session, setSession] = useState({
    active: false,
    userId: null,
    screenName: null
  });
  const [error, setError] = useState(null);

  // Estados de Limpeza
  const [chkTweets, setChkTweets] = useState(false);
  const [chkReposts, setChkReposts] = useState(true);
  const [chkBookmarks, setChkBookmarks] = useState(true);
  const [chkPinned, setChkPinned] = useState(true);
  const [delay, setDelay] = useState([3.0]);
  
  const [cleaningActive, setCleaningActive] = useState(false);
  const [isSimulation, setIsSimulation] = useState(false);
  const [stats, setStats] = useState({ found: 0, deleted: 0, kept: 0 });
  const [logs, setLogs] = useState(["Aguardando inicialização..."]);
  const isRunningRef = useRef(false);
  const terminalEndRef = useRef(null);

  // Estados de Conexões (Follow/Unfollow)
  const [isSyncing, setIsSyncing] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [activeFilter, setActiveFilter] = useState("non-followers");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Estado do Quick Decider (Revisão Rápida)
  const [isQdOpen, setIsQdOpen] = useState(false);
  const [qdList, setQdList] = useState([]);
  const [qdIndex, setQdIndex] = useState(0);
  const [qdProcessing, setQdProcessing] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const checkAndVerify = async (authTokenVal, csrfTokenVal) => {
      try {
        const res = await fetch("/api/twitter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "verify",
            authToken: authTokenVal,
            csrfToken: csrfTokenVal
          })
        });
        if (res.ok) {
          const data = await res.json();
          localStorage.setItem("x_auth_token", authTokenVal);
          localStorage.setItem("x_csrf_token", csrfTokenVal);
          localStorage.setItem("x_user_id", data.userId);
          localStorage.setItem("x_screen_name", data.screenName);
          setSession({
            active: true,
            userId: data.userId,
            screenName: data.screenName
          });
          addLog(`Sessão do Twitter detectada e validada. Conectado como @${data.screenName}`, "success");
        }
      } catch (err) {
        // Falha silenciosa no login automatico
      }
    };

    // Detecção Automática se estiver em extensão do Chrome
    if (typeof window !== "undefined" && window.chrome && window.chrome.cookies) {
      const getCookie = (name) => {
        return new Promise((resolve) => {
          window.chrome.cookies.get({ url: "https://x.com", name }, (cookie) => {
            if (cookie) resolve(cookie.value);
            else {
              // Tenta no domínio twitter.com também
              window.chrome.cookies.get({ url: "https://twitter.com", name }, (cookie2) => {
                resolve(cookie2 ? cookie2.value : "");
              });
            }
          });
        });
      };

      Promise.all([
        getCookie("auth_token"),
        getCookie("ct0")
      ]).then(([authTokenVal, csrfTokenVal]) => {
        if (authTokenVal && csrfTokenVal) {
          setCredentials({ authToken: authTokenVal, csrfToken: csrfTokenVal });
          checkAndVerify(authTokenVal, csrfTokenVal);
        }
      });
      return;
    }

    // Fallback: Recupera dados salvos localmente
    const savedAuthToken = localStorage.getItem("x_auth_token");
    const savedCsrfToken = localStorage.getItem("x_csrf_token");
    const savedUserId = localStorage.getItem("x_user_id");
    const savedScreenName = localStorage.getItem("x_screen_name");

    if (savedAuthToken && savedCsrfToken) {
      setCredentials({ authToken: savedAuthToken, csrfToken: savedCsrfToken });
      setSession({
        active: true,
        userId: savedUserId,
        screenName: savedScreenName
      });
    }
  }, []);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const addLog = (text, type = "info") => {
    const time = new Date().toLocaleTimeString();
    let icon = "ℹ";
    if (type === "success") icon = "✔";
    else if (type === "error") icon = "✖";
    else if (type === "warning") icon = "⚠";

    setLogs((prev) => [...prev, `[${time}] ${icon} ${text}`]);
  };

  const handleConnect = async (e) => {
    e.preventDefault();
    setError(null);

    if (!credentials.authToken || !credentials.csrfToken) {
      setError("Por favor, forneça o auth_token e o ct0 (CSRF token).");
      return;
    }

    try {
      // Faz chamada de verificação
      const res = await fetch("/api/twitter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "verify",
          authToken: credentials.authToken,
          csrfToken: credentials.csrfToken
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Falha na validação das credenciais.");
      }

      const data = await res.json();

      localStorage.setItem("x_auth_token", credentials.authToken);
      localStorage.setItem("x_csrf_token", credentials.csrfToken);
      localStorage.setItem("x_user_id", data.userId);
      localStorage.setItem("x_screen_name", data.screenName);

      setSession({
        active: true,
        userId: data.userId,
        screenName: data.screenName
      });
      addLog(`Sessão validada com sucesso. Conectado como @${data.screenName}`, "success");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem("x_auth_token");
    localStorage.removeItem("x_csrf_token");
    localStorage.removeItem("x_user_id");
    localStorage.removeItem("x_screen_name");

    setCredentials({ authToken: "", csrfToken: "" });
    setSession({ active: false, userId: null, screenName: null });
    setError(null);
    setFollowers([]);
    setFollowing([]);
  };

  // Algoritmo de Sincronização de Seguidores/Seguindo
  const syncConnections = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    addLog("Iniciando carregamento de conexões (Seguidores e Seguindo)...");

    try {
      // Coleta Seguindo
      let followingList = [];
      let cursor = "-1";
      addLog("Buscando lista de pessoas que você segue...");
      
      while (cursor !== "0") {
        const res = await fetch("/api/twitter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "fetch_connections",
            type: "following",
            cursor,
            authToken: credentials.authToken,
            csrfToken: credentials.csrfToken
          })
        });
        
        if (!res.ok) throw new Error("Erro ao buscar Seguindo do Twitter.");
        const data = await res.json();
        const users = data.users || [];
        followingList = followingList.concat(users.map(u => ({
          id: u.id_str,
          username: u.screen_name,
          name: u.name,
          profilePic: u.profile_image_url_https
        })));
        
        cursor = data.next_cursor_str || "0";
        addLog(`Progresso: ${followingList.length} pessoas que você segue carregadas...`);
        if (cursor !== "0") await new Promise(r => setTimeout(r, 1500));
      }

      // Coleta Seguidores
      let followersList = [];
      cursor = "-1";
      addLog("Buscando lista de seus seguidores...");

      while (cursor !== "0") {
        const res = await fetch("/api/twitter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "fetch_connections",
            type: "followers",
            cursor,
            authToken: credentials.authToken,
            csrfToken: credentials.csrfToken
          })
        });

        if (!res.ok) throw new Error("Erro ao buscar Seguidores do X.");
        const data = await res.json();
        const users = data.users || [];
        followersList = followersList.concat(users.map(u => ({
          id: u.id_str,
          username: u.screen_name,
          name: u.name,
          profilePic: u.profile_image_url_https
        })));

        cursor = data.next_cursor_str || "0";
        addLog(`Progresso: ${followersList.length} seguidores carregados...`);
        if (cursor !== "0") await new Promise(r => setTimeout(r, 1500));
      }

      setFollowing(followingList);
      setFollowers(followersList);
      addLog("Sincronização de amizades concluída com sucesso!", "success");
    } catch (err) {
      addLog(`Falha na sincronização: ${err.message}`, "error");
    } finally {
      setIsSyncing(false);
    }
  };

  // Lógica de follow/unfollow individual via Proxy
  const toggleConnection = async (targetUser, actionType) => {
    addLog(`Processando ${actionType} em @${targetUser.username}...`);
    try {
      const res = await fetch("/api/twitter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "connection_action",
          type: actionType,
          targetScreenName: targetUser.username,
          authToken: credentials.authToken,
          csrfToken: credentials.csrfToken
        })
      });

      if (!res.ok) throw new Error("Erro na API.");
      addLog(`Sucesso ao realizar ${actionType} em @${targetUser.username}!`, "success");

      // Atualiza o estado localmente
      if (actionType === "unfollow") {
        setFollowing((prev) => prev.filter(u => u.username !== targetUser.username));
      } else {
        setFollowing((prev) => [...prev, targetUser]);
      }
    } catch (err) {
      addLog(`Falha na ação em @${targetUser.username}: ${err.message}`, "error");
    }
  };

  // Processo de Faxina de Posts
  const startCleaning = async (simulationMode) => {
    if (cleaningActive) {
      isRunningRef.current = false;
      setCleaningActive(false);
      addLog("Faxina pausada pelo usuário.", "warning");
      return;
    }

    if (chkTweets) {
      const confirmDele = window.confirm("ATENÇÃO: Você selecionou a opção de apagar TWEETS AUTORAIS. Essa ação é definitiva e apagará suas próprias postagens. Deseja prosseguir?");
      if (!confirmDele) return;
    }

    isRunningRef.current = true;
    setCleaningActive(true);
    setIsSimulation(simulationMode);
    setStats({ found: 0, deleted: 0, kept: 0 });
    setLogs([]);

    addLog(simulationMode ? "=== SIMULAÇÃO INICIADA (NADA SERÁ APAGADO) ===" : "=== FAXINA REAL INICIADA ===", "warning");

    let cursorTimeline = "";
    let bookmarksSet = new Set();

    // Carrega bookmarks se ativado
    if (chkBookmarks) {
      addLog("Lendo lista de Bookmarks salvos...");
      try {
        const res = await fetch("/api/twitter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "fetch_bookmarks",
            authToken: credentials.authToken,
            csrfToken: credentials.csrfToken
          })
        });
        if (res.ok) {
          const data = await res.json();
          const entries = data.data?.bookmark_timeline_v2?.timeline?.instructions
            ?.find(ins => ins.type === "TimelineAddEntries")?.entries || [];
          entries.forEach(e => {
            const id = e.content?.itemContent?.tweet_results?.result?.rest_id;
            if (id) bookmarksSet.add(id);
          });
          addLog(`${bookmarksSet.size} posts salvos identificados e protegidos.`, "success");
        }
      } catch (e) {
        addLog("Aviso: Falha ao carregar bookmarks.", "warning");
      }
    }

    while (isRunningRef.current) {
      try {
        const res = await fetch("/api/twitter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "fetch_tweets",
            cursor: cursorTimeline,
            userId: session.userId,
            authToken: credentials.authToken,
            csrfToken: credentials.csrfToken
          })
        });

        if (!res.ok) throw new Error("Erro ao coletar timeline.");
        const data = await res.json();

        const instructions = data.data?.user?.result?.timeline_v2?.timeline?.instructions || [];
        const addEntries = instructions.find(ins => ins.type === "TimelineAddEntries");
        const entries = addEntries?.entries || [];

        if (entries.length === 0) {
          addLog("Nenhum post retornado na timeline.");
          break;
        }

        const cursorEntry = entries.find(e => e.entryId.startsWith("cursor-bottom-"));
        cursorTimeline = cursorEntry?.content?.value || "";

        const tweetEntries = entries.filter(e => e.entryId.startsWith("tweet-"));
        let countThisBatch = 0;

        for (const entry of tweetEntries) {
          if (!isRunningRef.current) break;

          const result = entry.content?.itemContent?.tweet_results?.result;
          if (!result) continue;

          const isRetweet = result.legacy?.retweeted_status_result !== undefined;
          const tweetId = result.rest_id;
          let originalId = tweetId;
          let author = result.core?.user_results?.result?.legacy?.screen_name || "";

          if (isRetweet) {
            const orig = result.legacy?.retweeted_status_result?.result;
            if (orig) {
              originalId = orig.rest_id;
              author = orig.core?.user_results?.result?.legacy?.screen_name || "";
            }
          }

          const isPinned = instructions.find(ins => ins.type === "TimelinePinEntry")?.entry?.entryId === entry.entryId;

          // Regras de seleção para exclusão
          let shouldDelete = false;
          let actionLabel = "";

          if (isRetweet && chkReposts) {
            shouldDelete = true;
            actionLabel = "repost (retweet)";
          } else if (!isRetweet && chkTweets) {
            shouldDelete = true;
            actionLabel = "tweet autoral";
          }

          if (shouldDelete) {
            setStats(prev => ({ ...prev, found: prev.found + 1 }));

            const isSaved = bookmarksSet.has(originalId);
            const isPinnedProtected = isPinned && chkPinned;

            if (isSaved && chkBookmarks) {
              addLog(`Preservado (Bookmark): Repost de @${author} (Tweet ID ${tweetId})`, "success");
              setStats(prev => ({ ...prev, kept: prev.kept + 1 }));
            } else if (isPinnedProtected) {
              addLog(`Preservado (Fixado): Tweet ID ${tweetId}`, "success");
              setStats(prev => ({ ...prev, kept: prev.kept + 1 }));
            } else {
              // Ação de exclusão
              if (simulationMode) {
                addLog(`[SIMULAÇÃO] Apagaria ${actionLabel} de @${author} (Tweet ID ${tweetId})`);
                setStats(prev => ({ ...prev, deleted: prev.deleted + 1 }));
              } else {
                addLog(`Removendo ${actionLabel} de @${author}...`);
                const apiAction = isRetweet ? "unretweet" : "delete_tweet";
                
                const deleteRes = await fetch("/api/twitter", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    action: apiAction,
                    tweetId,
                    authToken: credentials.authToken,
                    csrfToken: credentials.csrfToken
                  })
                });

                if (deleteRes.ok) {
                  addLog(`Post removido com sucesso!`, "success");
                  setStats(prev => ({ ...prev, deleted: prev.deleted + 1 }));
                } else {
                  addLog(`Erro ao deletar post.`, "error");
                }
              }

              // Delay de segurança
              await new Promise(r => setTimeout(r, delay[0] * 1000));
            }
            countThisBatch++;
          }
        }

        if (countThisBatch === 0 && !cursorTimeline) break;
        if (!cursorTimeline) {
          addLog("Fim da timeline alcançado.");
          break;
        }
      } catch (err) {
        addLog(`Erro no processo de faxina: ${err.message}`, "error");
        break;
      }
    }

    setCleaningActive(false);
    isRunningRef.current = false;
    addLog("=== FAXINA FINALIZADA COM SUCESSO ===", "success");
  };

  // Cruzamento de Reciprocidade
  const getFilteredConnections = () => {
    if (activeFilter === "following") return following;
    if (activeFilter === "followers") return followers;

    const followerUsernames = new Set(followers.map(u => u.username));
    const followingUsernames = new Set(following.map(u => u.username));

    if (activeFilter === "non-followers") {
      return following.filter(u => !followerUsernames.has(u.username));
    }
    if (activeFilter === "mutuals") {
      return following.filter(u => followerUsernames.has(u.username));
    }
    if (activeFilter === "fans") {
      return followers.filter(u => !followingUsernames.has(u.username));
    }

    return [];
  };

  const filteredConnections = getFilteredConnections().filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Quick Decider (Revisão Rápida)
  const openQuickDecider = () => {
    const list = getFilteredConnections();
    if (list.length === 0) {
      alert("Nenhum perfil nesta lista para revisar!");
      return;
    }
    setQdList(list);
    setQdIndex(0);
    setIsQdOpen(true);
  };

  const handleQdDecision = async (actionType) => {
    if (qdProcessing) return;
    const targetUser = qdList[qdIndex];
    
    setQdProcessing(true);
    if (actionType === "unfollow" || actionType === "follow") {
      await toggleConnection(targetUser, actionType);
    }
    
    setQdProcessing(false);
    if (qdIndex + 1 >= qdList.length) {
      setIsQdOpen(false);
      alert("Revisão concluída!");
    } else {
      setQdIndex(prev => prev + 1);
    }
  };

  if (!isMounted) {
    return (
      <main className="min-h-screen bg-[#FAF7F2] dark:bg-[#0D0B0A] text-zinc-900 dark:text-zinc-50 flex items-center justify-center">
        <div className="text-zinc-500 dark:text-zinc-400 font-semibold">Carregando módulo X/Twitter...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF7F2] dark:bg-[#0D0B0A] text-zinc-900 dark:text-zinc-50 p-4 md:p-8 relative overflow-hidden transition-colors duration-300">
      
      {/* Header com Voltar e ThemeToggle */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400 hover:text-violet-600 dark:hover:text-violet-500 transition-colors font-semibold">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Hub
        </Link>
        <ThemeToggle />
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center text-violet-600">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M4 4l11.733 16h4.267l-11.733 -16z"></path>
                  <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"></path>
                </svg>
              </div>
              <div>
                <CardTitle className="text-xl font-bold">X (Twitter) Suite</CardTitle>
                <CardDescription>Limpeza de posts e gerenciamento de seguidores</CardDescription>
              </div>
            </div>

            {session.active && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30">
                  @{session.screenName}
                </span>
                <Button variant="outline" size="sm" onClick={handleDisconnect}>
                  Sair
                </Button>
              </div>
            )}
          </CardHeader>

          <CardContent className="pt-6">
            {!session.active ? (
              /* LOGIN */
              <form onSubmit={handleConnect} className="max-w-md mx-auto space-y-4">
                <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-lg text-amber-800 dark:text-amber-300">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-xs leading-relaxed">
                    Insira seus cookies de sessão do X (Twitter Web) para conectar. Eles são usados de forma segura e local apenas para enviar as ordens à API do X.
                  </p>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 rounded-lg text-xs font-semibold">
                    {error}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                      Auth Token (auth_token)
                    </label>
                    <input 
                      type="password" 
                      placeholder="Cole o valor do cookie auth_token"
                      value={credentials.authToken}
                      onChange={(e) => setCredentials({ ...credentials, authToken: e.target.value })}
                      className="w-full p-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">
                      CSRF Token (ct0)
                    </label>
                    <input 
                      type="text" 
                      placeholder="Cole o valor do cookie ct0"
                      value={credentials.csrfToken}
                      onChange={(e) => setCredentials({ ...credentials, csrfToken: e.target.value })}
                      className="w-full p-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center gap-1.5">
                  <Key className="w-4 h-4" /> Validar e Conectar
                </Button>
              </form>
            ) : (
              /* PAINEL ATIVO */
              <Tabs defaultValue="cleaning" className="space-y-6">
                <TabsList className="w-full grid grid-cols-2 bg-zinc-100 dark:bg-zinc-900">
                  <TabsTrigger value="cleaning">Limpeza de Posts</TabsTrigger>
                  <TabsTrigger value="connections">Gerenciador de Conexões</TabsTrigger>
                </TabsList>

                {/* TAB 1: LIMPEZA */}
                <TabsContent value="cleaning" className="space-y-6 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Opções */}
                    <div className="space-y-4 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800/80 p-5 rounded-xl">
                      <h3 className="font-bold text-sm border-b border-zinc-200 dark:border-zinc-800 pb-2">Configurações de Exclusão</h3>
                      
                      <div className="space-y-3">
                        <label className="flex items-center gap-2.5 cursor-pointer">
                          <Checkbox checked={chkTweets} onCheckedChange={setChkTweets} />
                          <span className="text-sm font-semibold">Apagar Tweets Autorais</span>
                        </label>
                        
                        <label className="flex items-center gap-2.5 cursor-pointer">
                          <Checkbox checked={chkReposts} onCheckedChange={setChkReposts} />
                          <span className="text-sm font-semibold">Apagar Republicados (Retweets)</span>
                        </label>

                        <label className="flex items-center gap-2.5 cursor-pointer">
                          <Checkbox checked={chkBookmarks} onCheckedChange={setChkBookmarks} />
                          <span className="text-sm font-semibold">Preservar Salvos (Bookmarks)</span>
                        </label>

                        <label className="flex items-center gap-2.5 cursor-pointer">
                          <Checkbox checked={chkPinned} onCheckedChange={setChkPinned} />
                          <span className="text-sm font-semibold">Preservar Post Fixado (Pinned)</span>
                        </label>
                      </div>

                      <div className="space-y-2 pt-2">
                        <div className="flex justify-between text-xs font-semibold">
                          <span>Atraso por Exclusão:</span>
                          <span className="text-violet-600 dark:text-violet-400">{delay[0].toFixed(1)}s</span>
                        </div>
                        <Slider 
                          value={delay} 
                          onValueChange={setDelay} 
                          min={1.5} 
                          max={8} 
                          step={0.5} 
                        />
                      </div>
                    </div>

                    {/* Estatísticas */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex flex-col justify-center items-center">
                        <div className="text-3xl font-black">{stats.found}</div>
                        <div className="text-[10px] uppercase font-bold text-zinc-500 mt-1">Encontrados</div>
                      </div>
                      <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex flex-col justify-center items-center">
                        <div className="text-3xl font-black text-red-600 dark:text-red-500">{stats.deleted}</div>
                        <div className="text-[10px] uppercase font-bold text-zinc-500 mt-1">Excluídos</div>
                      </div>
                      <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex flex-col justify-center items-center">
                        <div className="text-3xl font-black text-emerald-600 dark:text-emerald-500">{stats.kept}</div>
                        <div className="text-[10px] uppercase font-bold text-zinc-500 mt-1">Preservados</div>
                      </div>

                      <div className="col-span-3 flex gap-3 pt-3">
                        <Button 
                          variant="outline" 
                          onClick={() => startCleaning(true)}
                          disabled={cleaningActive && !isSimulation}
                          className="flex-1 border-violet-600/30 text-violet-600 hover:bg-violet-600/10"
                        >
                          {cleaningActive && isSimulation ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                          Simulação
                        </Button>
                        <Button 
                          onClick={() => startCleaning(false)}
                          disabled={cleaningActive && isSimulation}
                          className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
                        >
                          {cleaningActive && !isSimulation ? <Pause className="w-4 h-4 mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                          {cleaningActive && !isSimulation ? "Pausar" : "Iniciar Faxina"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Terminal Logs */}
                  <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm bg-black">
                    <div className="bg-zinc-900 p-2.5 flex items-center gap-1.5 border-b border-zinc-800">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                      <span className="text-[10px] font-mono text-zinc-500 ml-2">Terminal Logs</span>
                    </div>
                    <div className="h-44 p-4 overflow-y-auto font-mono text-xs text-emerald-500 space-y-1 scrollbar-thin">
                      {logs.map((log, idx) => (
                        <div key={idx}>{log}</div>
                      ))}
                      <div ref={terminalEndRef} />
                    </div>
                  </div>
                </TabsContent>

                {/* TAB 2: CONEXÕES */}
                <TabsContent value="connections" className="space-y-6 animate-fade-in">
                  
                  {following.length === 0 && followers.length === 0 ? (
                    <div className="text-center py-12 space-y-4">
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Nenhuma amizade carregada ainda para a conta @{session.screenName}.
                      </p>
                      <Button onClick={syncConnections} disabled={isSyncing} className="bg-violet-600 hover:bg-violet-700 text-white">
                        <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                        Sincronizar Conexões
                      </Button>
                    </div>
                  ) : (
                    <>
                      {/* Cards de Filtro */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                        <button 
                          onClick={() => setActiveFilter("following")}
                          className={`p-3 rounded-lg border text-center transition-all ${activeFilter === "following" ? "border-violet-600 bg-violet-600/5 font-bold" : "border-zinc-200 dark:border-zinc-800"}`}
                        >
                          <div className="text-lg font-black">{following.length}</div>
                          <div className="text-[10px] text-zinc-500">Seguindo</div>
                        </button>
                        <button 
                          onClick={() => setActiveFilter("followers")}
                          className={`p-3 rounded-lg border text-center transition-all ${activeFilter === "followers" ? "border-violet-600 bg-violet-600/5 font-bold" : "border-zinc-200 dark:border-zinc-800"}`}
                        >
                          <div className="text-lg font-black">{followers.length}</div>
                          <div className="text-[10px] text-zinc-500">Seguidores</div>
                        </button>
                        <button 
                          onClick={() => setActiveFilter("non-followers")}
                          className={`p-3 rounded-lg border text-center transition-all ${activeFilter === "non-followers" ? "border-violet-600 bg-violet-600/5 font-bold text-violet-600 dark:text-violet-400" : "border-zinc-200 dark:border-zinc-800"}`}
                        >
                          <div className="text-lg font-black">
                            {following.filter(f => !followers.some(s => s.username === f.username)).length}
                          </div>
                          <div className="text-[10px] text-zinc-500">Não seguem de volta</div>
                        </button>
                        <button 
                          onClick={() => setActiveFilter("mutuals")}
                          className={`p-3 rounded-lg border text-center transition-all ${activeFilter === "mutuals" ? "border-violet-600 bg-violet-600/5 font-bold text-emerald-600 dark:text-emerald-400" : "border-zinc-200 dark:border-zinc-800"}`}
                        >
                          <div className="text-lg font-black">
                            {following.filter(f => followers.some(s => s.username === f.username)).length}
                          </div>
                          <div className="text-[10px] text-zinc-500">Mútuos</div>
                        </button>
                        <button 
                          onClick={() => setActiveFilter("fans")}
                          className={`p-3 rounded-lg border text-center transition-all ${activeFilter === "fans" ? "border-violet-600 bg-violet-600/5 font-bold" : "border-zinc-200 dark:border-zinc-800"}`}
                        >
                          <div className="text-lg font-black">
                            {followers.filter(f => !following.some(s => s.username === f.username)).length}
                          </div>
                          <div className="text-[10px] text-zinc-500">Fãs (Seguem você)</div>
                        </button>
                      </div>

                      {/* Controle */}
                      <div className="flex gap-3">
                        <div className="relative flex-1">
                          <Search className="w-4 h-4 absolute left-3 top-3.5 text-zinc-400" />
                          <input 
                            type="text" 
                            placeholder="Buscar usuário..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-violet-600"
                          />
                        </div>
                        <Button onClick={openQuickDecider} variant="outline" className="border-violet-600/30 text-violet-600 hover:bg-violet-600/10">
                          Revisão Rápida
                        </Button>
                        <Button onClick={syncConnections} disabled={isSyncing} variant="outline">
                          <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
                        </Button>
                      </div>

                      {/* Grid de Perfis */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredConnections.slice(0, 50).map((user) => (
                          <div key={user.id} className="flex items-center justify-between p-4 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-900 rounded-xl hover:shadow-sm transition-all duration-300">
                            <div className="flex items-center gap-3">
                              <img src={user.profilePic} alt={user.username} className="w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-800" />
                              <div>
                                <h4 className="font-bold text-sm leading-tight">{user.name}</h4>
                                <a href={`https://x.com/${user.username}`} target="_blank" className="text-xs text-zinc-500 dark:text-zinc-400 hover:underline">
                                  @{user.username}
                                </a>
                              </div>
                            </div>
                            
                            {/* Ações */}
                            {following.some(f => f.username === user.username) ? (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => toggleConnection(user, "unfollow")}
                                className="border-red-600/20 text-red-600 hover:bg-red-600/10 hover:border-red-600"
                              >
                                <UserMinus className="w-4 h-4 mr-1.5" /> Deixar de Seguir
                              </Button>
                            ) : (
                              <Button 
                                size="sm" 
                                onClick={() => toggleConnection(user, "follow")}
                                className="bg-violet-600 hover:bg-violet-700 text-white"
                              >
                                <UserPlus className="w-4 h-4 mr-1.5" /> Seguir de Volta
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

      {/* QUICK DECIDER OVERLAY */}
      {isQdOpen && qdList[qdIndex] && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-md w-full border border-zinc-800 bg-zinc-950 text-white shadow-2xl relative">
            <button 
              onClick={() => setIsQdOpen(false)} 
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <CardHeader className="text-center pb-2">
              <span className="text-xs font-semibold text-zinc-500">
                Revisando Perfil {qdIndex + 1} de {qdList.length}
              </span>
            </CardHeader>

            <CardContent className="flex flex-col items-center p-6 text-center">
              <img 
                src={qdList[qdIndex].profilePic.replace("_normal", "_400x400")} 
                alt={qdList[qdIndex].username} 
                className="w-24 h-24 rounded-full border-2 border-violet-600 mb-4"
              />
              <h2 className="text-xl font-bold">{qdList[qdIndex].name}</h2>
              <a 
                href={`https://x.com/${qdList[qdIndex].username}`} 
                target="_blank" 
                className="text-violet-400 hover:underline font-semibold mt-1"
              >
                @{qdList[qdIndex].username}
              </a>
            </CardContent>

            <CardFooter className="flex gap-4 p-6 border-t border-zinc-900 justify-center">
              {following.some(f => f.username === qdList[qdIndex].username) ? (
                <Button 
                  onClick={() => handleQdDecision("unfollow")} 
                  disabled={qdProcessing}
                  variant="destructive"
                  className="px-6 py-5 rounded-full"
                >
                  <UserMinus className="w-4 h-4 mr-2" /> Deixar de Seguir
                </Button>
              ) : (
                <Button 
                  onClick={() => handleQdDecision("follow")} 
                  disabled={qdProcessing}
                  className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-5 rounded-full"
                >
                  <UserPlus className="w-4 h-4 mr-2" /> Seguir de Volta
                </Button>
              )}
              <Button 
                onClick={() => handleQdDecision("keep")} 
                disabled={qdProcessing}
                variant="outline"
                className="px-6 py-5 rounded-full border-zinc-800 text-zinc-300 hover:bg-zinc-900"
              >
                Manter
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </main>
  );
}
