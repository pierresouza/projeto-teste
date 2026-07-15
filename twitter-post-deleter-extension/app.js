// Lógica da Extensão Chrome - X Repost Deleter
(function () {
  // Bearer Token padrão do cliente Web do X (Twitter)
  const BEARER_TOKEN = "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";

  // IDs estáveis das queries GraphQL do X (Twitter) Web
  const QUERY_IDS = {
    UserTweets: "Cln4al-N167WNu43m8GrcA",
    Unretweet: "iR79N45VnCE8n6TthC5Dzg",
    Bookmarks: "h5vBP7W19XzC73-A3s2oWg"
  };

  // Estados principais
  let session = {
    userId: null,
    csrfToken: null,
    authToken: null,
    screenName: null
  };

  let bookmarksSet = new Set();
  let isRunning = false;
  let isSimulation = false;
  let stats = { found: 0, deleted: 0, kept: 0 };
  let cursor = "";

  // Elementos do DOM
  const loginStatusBox = document.getElementById("login-status-box");
  const loginStatusText = document.getElementById("login-status-text");
  const controlsPanel = document.getElementById("controls-panel");
  const chkKeepBookmarks = document.getElementById("chk-keep-bookmarks");
  const chkKeepPinned = document.getElementById("chk-keep-pinned");
  const rangeDelay = document.getElementById("range-delay");
  const delayVal = document.getElementById("delay-val");
  const statFound = document.getElementById("stat-found");
  const statDeleted = document.getElementById("stat-deleted");
  const statKept = document.getElementById("stat-kept");
  const btnSimulate = document.getElementById("btn-simulate");
  const btnStart = document.getElementById("btn-start");
  const logOutput = document.getElementById("log-output");

  // Inicialização
  document.addEventListener("DOMContentLoaded", () => {
    setupDelaySlider();
    checkXSession();
  });

  const setupDelaySlider = () => {
    rangeDelay.addEventListener("input", (e) => {
      delayVal.textContent = `${parseFloat(e.target.value).toFixed(1)}s`;
    });
  };

  const logConsole = (text, type = "info") => {
    const time = new Date().toLocaleTimeString();
    let prefix = `[${time}] `;
    if (type === "success") prefix += "✔ ";
    else if (type === "error") prefix += "✖ ";
    else if (type === "warning") prefix += "⚠ ";
    else prefix += "ℹ ";

    logOutput.textContent += `\n${prefix}${text}`;
    logOutput.scrollTop = logOutput.scrollHeight;
  };

  const clearLog = () => {
    logOutput.textContent = "Console inicializado.";
  };

  // Detecção de Cookies e Sessão do X
  const getXCookie = (cookieName) => {
    return new Promise((resolve) => {
      if (typeof chrome !== "undefined" && chrome.cookies) {
        // Tenta obter o cookie tanto para x.com quanto twitter.com
        chrome.cookies.get({ url: "https://x.com", name: cookieName }, (cookie) => {
          if (cookie) resolve(cookie.value);
          else {
            chrome.cookies.get({ url: "https://twitter.com", name: cookieName }, (cookieTwitter) => {
              resolve(cookieTwitter ? cookieTwitter.value : null);
            });
          }
        });
      } else {
        resolve(null);
      }
    });
  };

  const checkXSession = async () => {
    logConsole("Verificando credenciais de sessão no X.com...");
    const authToken = await getXCookie("auth_token");
    const csrfToken = await getXCookie("ct0");
    const twid = await getXCookie("twid");

    if (authToken && csrfToken) {
      session.authToken = authToken;
      session.csrfToken = csrfToken;

      // twid contém u=USER_ID ou apenas o ID
      if (twid) {
        const match = twid.match(/u=(\d+)/);
        session.userId = match ? match[1] : twid.replace(/"/g, "");
      }

      logConsole("Credenciais de sessão obtidas com sucesso!", "success");
      
      // Busca o username (screen_name) para exibir na tela
      await fetchUsername();
      
      loginStatusBox.className = "status-box status-active";
      loginStatusText.textContent = `Conectado como @${session.screenName || 'Usuário X'}`;
      controlsPanel.style.display = "flex";

      // Configura botões de controle
      btnSimulate.onclick = () => startWorkflow(true);
      btnStart.onclick = () => startWorkflow(false);
    } else {
      logConsole("Erro: Nenhuma sessão ativa do X.com detectada. Faça login no navegador.", "error");
      loginStatusBox.className = "status-box status-inactive";
      loginStatusText.innerHTML = `Desconectado. Por favor, faça login no <strong><a href="https://x.com" target="_blank">X.com</a></strong> e recarregue esta aba.`;
    }
  };

  const fetchUsername = async () => {
    // Para obter o username de forma leve e autenticada
    const headers = {
      "Authorization": BEARER_TOKEN,
      "x-csrf-token": session.csrfToken
    };
    
    // Rota simples de verificação de conta
    try {
      const response = await fetch("https://x.com/i/api/1.1/account/verify_credentials.json", { headers });
      if (response.ok) {
        const data = await response.json();
        session.screenName = data.screen_name;
        if (!session.userId) session.userId = data.id_str;
      }
    } catch (e) {
      console.warn("Falha ao obter screen_name dinâmico:", e);
    }
  };

  // Busca lista de Bookmarks (Tweets Salvos)
  const fetchBookmarks = async () => {
    if (!chkKeepBookmarks.checked) return;
    
    logConsole("Obtendo lista de itens salvos (Bookmarks) para preservação...");
    const headers = {
      "Authorization": BEARER_TOKEN,
      "x-csrf-token": session.csrfToken,
      "Content-Type": "application/json"
    };

    const variables = {
      count: 100,
      features: { graphql_is_translatable_rweb_tweet_is_translatable_enabled: true }
    };

    const url = `https://x.com/i/api/graphql/${QUERY_IDS.Bookmarks}/Bookmarks?variables=${encodeURIComponent(JSON.stringify(variables))}`;
    
    try {
      const response = await fetch(url, { headers });
      if (response.ok) {
        const data = await response.json();
        const entries = data.data?.bookmark_timeline_v2?.timeline?.instructions
          ?.find(ins => ins.type === "TimelineAddEntries")?.entries || [];
        
        entries.forEach(entry => {
          const tweetId = entry.content?.itemContent?.tweet_results?.result?.rest_id;
          if (tweetId) bookmarksSet.add(tweetId);
        });
        
        logConsole(`${bookmarksSet.size} posts salvos identificados e protegidos contra exclusão.`, "success");
      } else {
        logConsole("Aviso: Falha ao ler Bookmarks. A proteção de salvos não estará disponível.", "warning");
      }
    } catch (e) {
      logConsole("Erro ao buscar bookmarks: " + e.message, "warning");
    }
  };

  // Fluxo Principal (Workflow)
  const startWorkflow = async (simulationMode) => {
    if (isRunning) {
      // Solicitação de pausa
      isRunning = false;
      btnStart.textContent = "Apagar Republicados";
      btnSimulate.textContent = "Simulação Segura";
      btnStart.disabled = false;
      btnSimulate.disabled = false;
      logConsole("Processo pausado pelo usuário.", "warning");
      return;
    }

    isRunning = true;
    isSimulation = simulationMode;
    clearLog();
    logConsole(isSimulation ? "=== INICIANDO MODO SIMULAÇÃO (NENHUM POST SERÁ EXCLUÍDO) ===" : "=== INICIANDO EXCLUSÃO AUTOMÁTICA EM SEGUNDO PLANO ===", "warning");

    // Limpa estatísticas
    stats = { found: 0, deleted: 0, kept: 0 };
    updateStatsUI();
    cursor = "";
    bookmarksSet.clear();

    // Carrega bookmarks se configurado
    await fetchBookmarks();

    // Altera estados dos botões
    if (isSimulation) {
      btnSimulate.textContent = "Pausar Simulação";
      btnStart.disabled = true;
    } else {
      btnStart.textContent = "Pausar Exclusão";
      btnSimulate.disabled = true;
    }

    // Loop de paginação de timeline
    while (isRunning) {
      const items = await fetchTweetsBatch();
      if (!items || items.length === 0) {
        logConsole("Nenhum tweet/repost encontrado na timeline.", "info");
        break;
      }

      logConsole(`Analisando lote contendo ${items.length} itens da timeline...`);
      let processedAny = false;

      for (const item of items) {
        if (!isRunning) break;

        const isRetweet = item.isRetweet;
        const tweetId = item.id;
        const originalTweetId = item.originalId || tweetId;

        // Foco em republicados (Retweets/Reposts)
        if (isRetweet) {
          stats.found++;
          processedAny = true;

          // Verificação de regras de preservação
          const isBookmarked = bookmarksSet.has(originalTweetId);
          const isPinned = item.isPinned && chkKeepPinned.checked;

          if (isBookmarked) {
            logConsole(`Preservado (Item Salvo): Repost ID ${tweetId} de @${item.author}`, "success");
            stats.kept++;
            updateStatsUI();
          } else if (isPinned) {
            logConsole(`Preservado (Post Fixado): Repost ID ${tweetId} de @${item.author}`, "success");
            stats.kept++;
            updateStatsUI();
          } else {
            // Candidato à exclusão (Unretweet)
            if (isSimulation) {
              logConsole(`[SIMULAÇÃO] Apagando republicado: Desfazer retweet de @${item.author} (Tweet ID ${tweetId})`);
              stats.deleted++;
              updateStatsUI();
            } else {
              logConsole(`Apagando republicado: Desfazendo retweet de @${item.author}...`);
              const success = await executeUnretweet(tweetId);
              if (success) {
                logConsole(`Republicado removido com sucesso (Tweet ID ${tweetId})`, "success");
                stats.deleted++;
                updateStatsUI();
              } else {
                logConsole(`Erro ao remover republicado (Tweet ID ${tweetId})`, "error");
              }
            }

            // Delay de segurança configurado na UI
            const delayMs = parseFloat(rangeDelay.value) * 1000;
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }
        }
      }

      if (!processedAny) {
        logConsole("Nenhum republicado (retweet) encontrado neste lote de timeline. Pagando próxima página...");
      }

      if (!cursor) {
        logConsole("Fim da timeline alcançado.", "info");
        break;
      }
    }

    // Finalização
    isRunning = false;
    btnStart.textContent = "Apagar Republicados";
    btnSimulate.textContent = "Simulação Segura";
    btnStart.disabled = false;
    btnSimulate.disabled = false;
    logConsole("=== PROCESSO FINALIZADO COM SUCESSO ===", "success");
    logConsole(`Resumo final: ${stats.found} analisados | ${stats.deleted} excluídos/simulados | ${stats.kept} preservados.`);
  };

  // Requisição GraphQL de timeline
  const fetchTweetsBatch = async () => {
    const headers = {
      "Authorization": BEARER_TOKEN,
      "x-csrf-token": session.csrfToken,
      "Content-Type": "application/json"
    };

    const variables = {
      userId: session.userId,
      count: 40,
      includePromotedContent: false,
      withQuickPromoteEligibilityDoubleSpend: true,
      withVoice: true,
      withV2Timeline: true
    };

    if (cursor) {
      variables.cursor = cursor;
    }

    const features = {
      rweb_tipjar_consumption_enabled: true,
      responsive_web_graphql_exclude_directive_enabled: true,
      verified_phone_label_enabled: false,
      creator_subscriptions_tweet_preview_api_enabled: true,
      responsive_web_graphql_timeline_navigation_enabled: true,
      responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
      communities_web_enable_tweet_association: true,
      tweetypie_unmention_optimization_enabled: true,
      responsive_web_edit_tweet_api_enabled: true,
      graphql_is_translatable_rweb_tweet_is_translatable_enabled: true,
      view_counts_everywhere_api_enabled: true,
      longform_notetweets_consumption_enabled: true,
      responsive_web_twitter_article_tweet_consumption_enabled: true,
      tweet_awards_web_tipping_enabled: false,
      creator_subscriptions_quote_tweet_preview_enabled: false,
      freedom_of_speech_not_reach_fetch_enabled: true,
      standardized_nudges_misinfo: true,
      tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled: true,
      rweb_video_timestamps_enabled: true,
      longform_notetweets_rich_text_read_enabled: true,
      longform_notetweets_inline_expand_respect_name_default: true,
      responsive_web_enhance_cards_and_videos_enabled: false
    };

    const url = `https://x.com/i/api/graphql/${QUERY_IDS.UserTweets}/UserTweets?variables=${encodeURIComponent(JSON.stringify(variables))}&features=${encodeURIComponent(JSON.stringify(features))}`;

    try {
      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();

      const instructions = data.data?.user?.result?.timeline_v2?.timeline?.instructions || [];
      const addEntries = instructions.find(ins => ins.type === "TimelineAddEntries");
      const entries = addEntries?.entries || [];

      // Atualiza cursor para paginação
      const cursorEntry = entries.find(e => e.entryId.startsWith("cursor-bottom-"));
      cursor = cursorEntry?.content?.value || "";

      // Filtra e processa os tweets das entradas
      const tweetEntries = entries.filter(e => e.entryId.startsWith("tweet-"));
      const parsedItems = [];

      tweetEntries.forEach(entry => {
        const tweetResult = entry.content?.itemContent?.tweet_results?.result;
        if (!tweetResult) return;

        const isRetweet = tweetResult.legacy?.retweeted_status_result !== undefined;
        const tweetId = tweetResult.rest_id;
        let originalId = tweetId;
        let author = tweetResult.core?.user_results?.result?.legacy?.screen_name || "";

        if (isRetweet) {
          const originalTweet = tweetResult.legacy?.retweeted_status_result?.result;
          if (originalTweet) {
            originalId = originalTweet.rest_id;
            author = originalTweet.core?.user_results?.result?.legacy?.screen_name || "";
          }
        }

        // Checar se está fixado (Pinned)
        const pinEntry = instructions.find(ins => ins.type === "TimelinePinEntry");
        const isPinned = pinEntry?.entry?.entryId === entry.entryId;

        parsedItems.push({
          id: tweetId,
          originalId,
          isRetweet,
          author,
          isPinned
        });
      });

      return parsedItems;
    } catch (e) {
      logConsole("Erro ao buscar tweets da timeline: " + e.message, "error");
      return null;
    }
  };

  // Desfazer retweet via GraphQL
  const executeUnretweet = async (tweetId) => {
    const headers = {
      "Authorization": BEARER_TOKEN,
      "x-csrf-token": session.csrfToken,
      "Content-Type": "application/json"
    };

    const variables = {
      source_tweet_id: tweetId
    };

    const url = `https://x.com/i/api/graphql/${QUERY_IDS.Unretweet}/Unretweet`;
    
    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({ variables, queryId: QUERY_IDS.Unretweet })
      });

      if (!response.ok) return false;
      const data = await response.json();
      return data.data?.unretweet?.tweet?.legacy?.retweeted === false || true;
    } catch (e) {
      console.error("Falha ao desfazer retweet:", e);
      return false;
    }
  };

  const updateStatsUI = () => {
    statFound.textContent = stats.found;
    statDeleted.textContent = stats.deleted;
    statKept.textContent = stats.kept;
  };
})();
