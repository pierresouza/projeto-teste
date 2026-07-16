// Lógica da Extensão Chrome - Instagram Unfollow Manager (Estilo Clássico)
(function () {
  // Estado Global
  const state = {
    session: {
      active: false,
      userId: null,
      csrfToken: null
    },
    tinder: {
      allFollowers: [], // usernames
      allFollowing: [], // objects {username, fullName}
      unreciprocalUsers: [], // objects de não-seguidores
      mutualUsers: [], // objects de seguidores mútuos
      activeListType: "nonfollowers", // tipo de lista ativa
      currentIndex: 0,
      activeUser: null, // usuário sendo exibido
      unfollowQueue: [], // usernames/IDs na fila de unfollow
      isProcessingQueue: false
    },
    posts: {
      allItems: [], // publicações carregadas
      selectedIds: new Set(),
      deleteQueue: [],
      isProcessingDelete: false
    },
    reposts: {
      allItems: [], // republicações carregadas
      selectedIds: new Set(),
      deleteQueue: [],
      isProcessingDelete: false
    }
  };

  // Elementos do DOM
  const elements = {
    // SEÇÃO 1: Sessão
    sessionChecking: document.getElementById("session-checking"),
    sessionActive: document.getElementById("session-active"),
    sessionInactive: document.getElementById("session-inactive"),
    userDetails: document.getElementById("user-details"),
    btnDetectAgain: document.getElementById("btn-detect-again"),
    btnDetectLogin: document.getElementById("btn-detect-login"),
    
    // SEÇÃO 2: Tinder Unfollow
    sessionBlockers: document.querySelectorAll(".session-blocker"),
    tinderSetup: document.getElementById("tinder-setup"),
    tinderDeckContainer: document.getElementById("tinder-deck-container"),
    btnAutoImportTinder: document.getElementById("btn-auto-import-tinder"),
    tinderAutoLoading: document.getElementById("tinder-auto-loading"),
    tinderAutoStatus: document.getElementById("tinder-auto-status"),
    uploadZone: document.getElementById("upload-zone"),
    fileConnections: document.getElementById("file-connections"),
    jsonPaste: document.getElementById("json-paste"),
    btnProcessJson: document.getElementById("btn-process-json"),
    
    // Filtros Dinâmicos
    btnFilterFollowing: document.getElementById("btn-filter-following"),
    btnFilterFollowers: document.getElementById("btn-filter-followers"),
    btnFilterMutuals: document.getElementById("btn-filter-mutuals"),
    btnFilterNonfollowers: document.getElementById("btn-filter-nonfollowers"),
    badgeFollowingCount: document.getElementById("badge-following-count"),
    badgeFollowersCount: document.getElementById("badge-followers-count"),
    badgeMutualsCount: document.getElementById("badge-mutuals-count"),
    badgeNonfollowersCount: document.getElementById("badge-nonfollowers-count"),
    
    // Tinder Arena
    tinderCard: document.getElementById("tinder-card"),
    cardUserPhoto: document.getElementById("card-user-photo"),
    cardUsername: document.getElementById("card-username"),
    cardFullname: document.getElementById("card-fullname"),
    cardProfileLink: document.getElementById("card-profile-link"),
    deckCounter: document.getElementById("deck-counter"),
    deckEmpty: document.getElementById("deck-empty"),
    btnRestartTinder: document.getElementById("btn-restart-tinder"),
    
    // Tinder Controles e Stamps
    stampKeep: document.querySelector(".stamp-keep"),
    stampUnfollow: document.querySelector(".stamp-unfollow"),
    btnActionUnfollow: document.getElementById("btn-action-unfollow"),
    btnActionSkip: document.getElementById("btn-action-skip"),
    btnActionKeep: document.getElementById("btn-action-keep"),
    
    // Fila de Unfollow
    unfollowQueueProgress: document.getElementById("unfollow-queue-progress"),
    queueStatus: document.getElementById("queue-status"),
    queueBar: document.getElementById("queue-bar"),
    
    // SEÇÃO 3: Publicações
    postsSetup: document.getElementById("posts-setup"),
    postsGridContainer: document.getElementById("posts-grid-container"),
    btnFetchPosts: document.getElementById("btn-fetch-posts"),
    postsFetchLoading: document.getElementById("posts-fetch-loading"),
    postsCounter: document.getElementById("posts-counter"),
    postsGrid: document.getElementById("posts-grid"),
    btnSelectAllPosts: document.getElementById("btn-select-all-posts"),
    btnDeselectAllPosts: document.getElementById("btn-deselect-all-posts"),
    btnDeleteSelectedPosts: document.getElementById("btn-delete-selected-posts"),
    deleteSelectedCount: document.getElementById("delete-selected-count"),
    deleteQueueProgress: document.getElementById("delete-queue-progress"),
    deleteQueueStatus: document.getElementById("delete-queue-status"),
    deleteQueueBar: document.getElementById("delete-queue-bar"),
    
    // SEÇÃO 4: Republicações
    repostsSetup: document.getElementById("reposts-setup"),
    repostsGridContainer: document.getElementById("reposts-grid-container"),
    btnFetchReposts: document.getElementById("btn-fetch-reposts"),
    repostsFetchLoading: document.getElementById("reposts-fetch-loading"),
    repostsCounter: document.getElementById("reposts-counter"),
    repostsGrid: document.getElementById("reposts-grid"),
    btnSelectAllReposts: document.getElementById("btn-select-all-reposts"),
    btnDeselectAllReposts: document.getElementById("btn-deselect-all-reposts"),
    btnDeleteSelectedReposts: document.getElementById("btn-delete-selected-reposts"),
    deleteRepostsSelectedCount: document.getElementById("delete-reposts-selected-count"),
    repostsQueueProgress: document.getElementById("reposts-queue-progress"),
    repostsQueueStatus: document.getElementById("reposts-queue-status"),
    repostsTimeEst: document.getElementById("reposts-time-est"),
    repostsQueueBar: document.getElementById("reposts-queue-bar")
  };

  // Inicialização
  document.addEventListener("DOMContentLoaded", () => {
    detectSession();
    initUploadZone();
    initTinderGestures();
    initKeyboardShortcuts();
    initButtons();
  });

  // ==========================================
  // DETECÇÃO DE SESSÃO (COOKIES NATIVOS)
  // ==========================================
  async function detectSession() {
    showSessionState("checking");
    
    const getCookie = (name) => {
      return new Promise((resolve) => {
        if (typeof chrome !== "undefined" && chrome.cookies) {
          chrome.cookies.get({ url: "https://www.instagram.com", name }, (c) => {
            if (c) resolve(c.value);
            else {
              chrome.cookies.get({ url: "https://instagram.com", name }, (c2) => {
                resolve(c2 ? c2.value : null);
              });
            }
          });
        } else {
          resolve(null);
        }
      });
    };

    try {
      const userId = await getCookie("ds_user_id");
      const sessionId = await getCookie("sessionid");
      const csrfToken = await getCookie("csrftoken");

      if (userId && sessionId) {
        state.session.active = true;
        state.session.userId = userId;
        state.session.csrfToken = csrfToken || "";
        
        elements.userDetails.textContent = `ID de Usuário Conectado: ${userId}`;
        showSessionState("active");
        hideSessionBlockers(false);
      } else {
        state.session.active = false;
        showSessionState("inactive");
        hideSessionBlockers(true);
      }
    } catch (err) {
      console.error("Erro na detecção de sessão:", err);
      state.session.active = false;
      showSessionState("inactive");
      hideSessionBlockers(true);
    }
  }

  function showSessionState(status) {
    elements.sessionChecking.style.display = status === "checking" ? "flex" : "none";
    elements.sessionActive.style.display = status === "active" ? "flex" : "none";
    elements.sessionInactive.style.display = status === "inactive" ? "flex" : "none";
  }

  function hideSessionBlockers(shouldBlock) {
    elements.sessionBlockers.forEach(blocker => {
      blocker.style.display = shouldBlock ? "block" : "none";
      const sibling = blocker.nextElementSibling;
      if (sibling) {
        sibling.style.display = shouldBlock ? "none" : "";
      }
    });
  }

  function initButtons() {
    elements.btnDetectAgain.addEventListener("click", detectSession);
    elements.btnDetectLogin.addEventListener("click", detectSession);
    
    // Tinder
    elements.btnAutoImportTinder.addEventListener("click", startAutoImportTinder);
    elements.btnProcessJson.addEventListener("click", processJsonInput);
    elements.btnRestartTinder.addEventListener("click", restartTinder);
    
    elements.btnFilterFollowing.addEventListener("click", () => selectTinderFilter("following"));
    elements.btnFilterFollowers.addEventListener("click", () => selectTinderFilter("followers"));
    elements.btnFilterMutuals.addEventListener("click", () => selectTinderFilter("mutuals"));
    elements.btnFilterNonfollowers.addEventListener("click", () => selectTinderFilter("nonfollowers"));
    
    elements.btnActionUnfollow.addEventListener("click", () => handleTinderDecision("unfollow"));
    elements.btnActionSkip.addEventListener("click", () => handleTinderDecision("skip"));
    elements.btnActionKeep.addEventListener("click", () => handleTinderDecision("keep"));
    
    // Posts
    elements.btnFetchPosts.addEventListener("click", fetchUserPosts);
    elements.btnSelectAllPosts.addEventListener("click", selectAllPosts);
    elements.btnDeselectAllPosts.addEventListener("click", deselectAllPosts);
    elements.btnDeleteSelectedPosts.addEventListener("click", startDeleteQueue);

    // Reposts
    elements.btnFetchReposts.addEventListener("click", fetchUserReposts);
    elements.btnSelectAllReposts.addEventListener("click", selectAllReposts);
    elements.btnDeselectAllReposts.addEventListener("click", deselectAllReposts);
    elements.btnDeleteSelectedReposts.addEventListener("click", startRepostDeleteQueue);
  }

  // ==========================================
  // SEÇÃO 2: TINDER UNFOLLOW — UPLOAD & PARSING
  // ==========================================
  function initUploadZone() {
    const zone = elements.uploadZone;
    const fileInput = elements.fileConnections;

    zone.addEventListener("click", () => fileInput.click());
    
    zone.addEventListener("dragover", (e) => {
      e.preventDefault();
      zone.style.borderColor = "var(--primary-light)";
      zone.style.background = "var(--primary-dim)";
    });

    zone.addEventListener("dragleave", () => {
      zone.style.borderColor = "var(--border)";
      zone.style.background = "";
    });

    zone.addEventListener("drop", (e) => {
      e.preventDefault();
      zone.style.borderColor = "var(--border)";
      zone.style.background = "";
      
      if (e.dataTransfer.files.length > 0) {
        fileInput.files = e.dataTransfer.files;
        handleFileSelect(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener("change", () => {
      if (fileInput.files.length > 0) {
        handleFileSelect(fileInput.files[0]);
      }
    });
  }

  function handleFileSelect(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      elements.jsonPaste.value = e.target.result;
    };
    reader.readAsText(file);
  }

  function processJsonInput() {
    const text = elements.jsonPaste.value.trim();
    if (!text) {
      alert("Por favor, carregue um arquivo JSON ou cole o conteúdo na caixa.");
      return;
    }

    try {
      const data = JSON.parse(text);
      let followers = [];
      let following = [];

      // 1. Caso seja o arquivo compactado da Meta (connections.json ou unificado)
      if (data.relationships_followers || data.followers) {
        const followersList = data.relationships_followers || data.followers || [];
        followers = followersList.map(item => {
          const stringData = item.string_list_data?.[0] || item;
          return stringData.value || stringData;
        });
      }
      
      if (data.relationships_following || data.following) {
        const followingList = data.relationships_following || data.following || [];
        following = followingList.map(item => {
          const stringData = item.string_list_data?.[0] || item;
          return {
            username: stringData.value || stringData,
            fullName: stringData.href || ""
          };
        });
      }

      // 2. Se for arquivo avulso followers.json
      if (Array.isArray(data) && data.length > 0 && data[0].string_list_data) {
        // É um array de seguidores
        followers = data.map(item => item.string_list_data[0].value);
      }

      // 3. Se for arquivo avulso following.json
      if (Array.isArray(data) && data.length > 0 && data[0].string_list_data && text.includes("following")) {
        // É um array de seguindo
        following = data.map(item => ({
          username: item.string_list_data[0].value,
          fullName: item.string_list_data[0].href || ""
        }));
      }

      // Fallback: se for apenas um objeto com arrays diretos de strings
      if (Array.isArray(data.followers)) followers = data.followers;
      if (Array.isArray(data.following)) {
        following = data.following.map(item => typeof item === "string" ? { username: item, fullName: "" } : item);
      }

      // Validação básica
      if (following.length === 0) {
        if (followers.length > 0) {
          state.tinder.allFollowers = followers;
          alert(`Carregados ${followers.length} seguidores. Agora carregue o arquivo de seguindo (following.json) para cruzar.`);
          elements.jsonPaste.value = "";
          return;
        }
        throw new Error("Não foi possível extrair a lista de seguindo (following). Certifique-se de que o arquivo está no formato correto do Instagram.");
      }

      if (following.length > 0 && followers.length === 0 && state.tinder.allFollowers.length > 0) {
        followers = state.tinder.allFollowers;
      } else if (followers.length > 0) {
        state.tinder.allFollowers = followers;
      }

      state.tinder.allFollowing = following;

      // Calcular reciprocidade normalizando para minúsculas
      const followersSet = new Set(followers.map(u => u.toLowerCase()));
      state.tinder.unreciprocalUsers = following.filter(user => !followersSet.has(user.username.toLowerCase()));
      state.tinder.mutualUsers = following.filter(user => followersSet.has(user.username.toLowerCase()));

      state.tinder.activeListType = "nonfollowers";
      updateTinderFilterUI();

      if (state.tinder.unreciprocalUsers.length === 0) {
        alert("Excelente notícia! Todos os perfis que você segue também te seguem de volta.");
      }

      // Iniciar o Tinder
      elements.tinderSetup.style.display = "none";
      elements.tinderDeckContainer.style.display = "flex";
      state.tinder.currentIndex = 0;
      
      showNextCard();

    } catch (err) {
      alert("Erro ao ler JSON: " + err.message);
    }
  }

  async function startAutoImportTinder() {
    const userId = state.session.userId;
    const csrfToken = state.session.csrfToken;
    if (!userId) {
      alert("Erro: Sessão não identificada. Por favor, conecte-se no Instagram primeiro.");
      return;
    }

    elements.btnAutoImportTinder.style.display = "none";
    elements.tinderAutoLoading.style.display = "flex";
    elements.tinderAutoStatus.textContent = "Iniciando coleta automática...";

    const appId = "936619743392459"; // App ID padrão web
    const headers = {
      "X-IG-App-ID": appId,
      "X-Requested-With": "XMLHttpRequest",
      "Accept": "*/*"
    };
    if (csrfToken) {
      headers["X-CSRFToken"] = csrfToken;
    }

    const fetchAll = async (endpointType) => {
      let list = [];
      let hasNext = true;
      let maxId = "";

      while (hasNext) {
        elements.tinderAutoStatus.textContent = `Coletando ${endpointType === "following" ? "seguindo" : "seguidores"}... ${list.length} perfis`;
        
        const url = `https://www.instagram.com/api/v1/friendships/${userId}/${endpointType}/?count=200${
          maxId ? `&max_id=${maxId}` : ""
        }`;
        
        try {
          const response = await fetch(url, { headers });
          if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
          const data = await response.json();

          const users = data.users || [];
          list = list.concat(
            users.map((u) => u.username)
          );

          hasNext = data.next_max_id ? true : false;
          maxId = data.next_max_id || "";

          if (hasNext) {
            await new Promise((r) => setTimeout(r, 1500));
          }
        } catch (err) {
          console.error(`Erro ao coletar ${endpointType}:`, err);
          alert(`Extração automática parcial de ${endpointType}. Apenas ${list.length} perfis foram obtidos.`);
          hasNext = false;
        }
      }

      return list;
    };

    try {
      const followingList = await fetchAll("following");
      await new Promise((r) => setTimeout(r, 2000));
      const followersList = await fetchAll("followers");

      state.tinder.allFollowers = followersList;
      state.tinder.allFollowing = followingList.map(u => ({ username: u, fullName: "" }));

      // Calcular reciprocidade normalizando para minúsculas
      const followersSet = new Set(followersList.map(u => u.toLowerCase()));
      state.tinder.unreciprocalUsers = state.tinder.allFollowing.filter(user => !followersSet.has(user.username.toLowerCase()));
      state.tinder.mutualUsers = state.tinder.allFollowing.filter(user => followersSet.has(user.username.toLowerCase()));

      elements.tinderAutoLoading.style.display = "none";
      elements.btnAutoImportTinder.style.display = "flex";

      state.tinder.activeListType = "nonfollowers";
      updateTinderFilterUI();

      if (state.tinder.unreciprocalUsers.length === 0) {
        alert("Excelente notícia! Todos os perfis que você segue também te seguem de volta.");
      }

      // Iniciar o Tinder
      elements.tinderSetup.style.display = "none";
      elements.tinderDeckContainer.style.display = "flex";
      state.tinder.currentIndex = 0;
      
      showNextCard();

    } catch (e) {
      console.error("Erro na automação de importação:", e);
      alert("Erro ao importar conexões automaticamente. Você pode tentar importar via arquivo JSON.");
      elements.tinderAutoLoading.style.display = "none";
      elements.btnAutoImportTinder.style.display = "flex";
    }
  }

  // ==========================================
  // LOGICA DO TINDER CARD (EXIBIÇÃO E GESTOS)
  // ==========================================
  async function showNextCard() {
    let list = [];
    if (state.tinder.activeListType === "following") {
      list = state.tinder.allFollowing;
    } else if (state.tinder.activeListType === "followers") {
      list = state.tinder.allFollowers.map(u => ({ username: u, fullName: "" }));
    } else if (state.tinder.activeListType === "mutuals") {
      list = state.tinder.mutualUsers;
    } else {
      list = state.tinder.unreciprocalUsers;
    }

    const index = state.tinder.currentIndex;

    if (index >= list.length) {
      elements.tinderCard.style.display = "none";
      elements.deckEmpty.style.display = "flex";
      elements.deckCounter.textContent = `Cartão ${list.length} de ${list.length}`;
      return;
    }

    elements.tinderCard.style.display = "flex";
    elements.deckEmpty.style.display = "none";

    const user = list[index];
    state.tinder.activeUser = user;

    elements.cardUsername.textContent = `@${user.username}`;
    elements.cardFullname.textContent = user.fullName || "Carregando perfil...";
    elements.deckCounter.textContent = `Cartão ${index + 1} de ${list.length}`;
    elements.cardProfileLink.href = `https://www.instagram.com/${user.username}/`;

    // Atualiza o selo de reciprocidade visualmente
    const reciprocityEl = document.getElementById("deck-reciprocity");
    if (reciprocityEl) {
      if (state.tinder.activeListType === "nonfollowers") {
        reciprocityEl.textContent = "Não te segue de volta";
        reciprocityEl.style.background = "rgba(239, 68, 68, 0.08)";
        reciprocityEl.style.color = "var(--red)";
        reciprocityEl.style.borderColor = "rgba(239, 68, 68, 0.15)";
      } else if (state.tinder.activeListType === "mutuals") {
        reciprocityEl.textContent = "Seguidor Mútuo";
        reciprocityEl.style.background = "rgba(16, 185, 129, 0.08)";
        reciprocityEl.style.color = "var(--green)";
        reciprocityEl.style.borderColor = "rgba(16, 185, 129, 0.15)";
      } else if (state.tinder.activeListType === "followers") {
        reciprocityEl.textContent = "Te Segue";
        reciprocityEl.style.background = "rgba(124, 58, 237, 0.08)";
        reciprocityEl.style.color = "var(--secondary)";
        reciprocityEl.style.borderColor = "rgba(124, 58, 237, 0.15)";
      } else {
        reciprocityEl.textContent = "Você Segue";
        reciprocityEl.style.background = "var(--bg-glass)";
        reciprocityEl.style.color = "var(--text-muted)";
        reciprocityEl.style.borderColor = "var(--border)";
      }
    }

    // LAZY LOAD: Carrega Foto de perfil apenas para o cartão ativo!
    elements.cardUserPhoto.style.display = "none";
    const spinner = elements.tinderCard.querySelector(".card-photo-spinner");
    if (spinner) spinner.style.display = "block";

    elements.tinderCard.style.transform = "translate(0px, 0px) rotate(0deg)";
    elements.stampKeep.style.opacity = 0;
    elements.stampUnfollow.style.opacity = 0;

    try {
      const profileData = await fetchInstagramUserProfile(user.username);
      if (profileData && profileData.profile_pic_url) {
        const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(profileData.profile_pic_url)}`;
        elements.cardUserPhoto.src = proxyUrl;
        elements.cardUserPhoto.style.display = "block";
        if (spinner) spinner.style.display = "none";
        
        elements.cardFullname.textContent = profileData.full_name || "Sem nome no Instagram";
        user.userId = profileData.id;
      } else {
        useFallbackAvatar(spinner);
      }
    } catch (e) {
      console.warn("Falha ao buscar perfil público no Instagram:", e);
      useFallbackAvatar(spinner);
    }
  }

  function useFallbackAvatar(spinner) {
    elements.cardUserPhoto.src = `https://api.dicebear.com/7.x/initials/svg?seed=${state.tinder.activeUser.username}`;
    elements.cardUserPhoto.style.display = "block";
    if (spinner) spinner.style.display = "none";
  }

  async function fetchInstagramUserProfile(username) {
    const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-IG-App-ID": "936619743392459",
        "Accept": "*/*"
      }
    });

    if (!response.ok) throw new Error("Erro na rede");
    const json = await response.json();
    const user = json.data?.user;
    if (user) {
      return {
        id: user.id,
        profile_pic_url: user.profile_pic_url,
        full_name: user.full_name
      };
    }
    return null;
  }

  // ==========================================
  // GESTOS DO TINDER (DRAG AND DROP)
  // ==========================================
  function initTinderGestures() {
    const card = elements.tinderCard;
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;

    const onStart = (e) => {
      if (elements.tinder.activeUser === null) return;
      isDragging = true;
      startX = e.clientX || e.touches[0].clientX;
      startY = e.clientY || e.touches[0].clientY;
      card.style.transition = "none";
    };

    const onMove = (e) => {
      if (!isDragging) return;
      currentX = (e.clientX || e.touches[0].clientX) - startX;
      currentY = (e.clientY || e.touches[0].clientY) - startY;

      const rotate = currentX / 12;
      card.style.transform = `translate(${currentX}px, ${currentY}px) rotate(${rotate}deg)`;

      if (currentX > 0) {
        elements.stampKeep.style.opacity = Math.min(currentX / 100, 1);
        elements.stampUnfollow.style.opacity = 0;
      } else {
        elements.stampUnfollow.style.opacity = Math.min(-currentX / 100, 1);
        elements.stampKeep.style.opacity = 0;
      }
    };

    const onEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      card.style.transition = "transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease";

      const threshold = 120;
      if (currentX > threshold) {
        animateCardOut("right");
      } else if (currentX < -threshold) {
        animateCardOut("left");
      } else {
        card.style.transform = "translate(0px, 0px) rotate(0deg)";
        elements.stampKeep.style.opacity = 0;
        elements.stampUnfollow.style.opacity = 0;
      }
    };

    card.addEventListener("mousedown", onStart);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onEnd);

    card.addEventListener("touchstart", onStart);
    document.addEventListener("touchmove", onMove);
    document.addEventListener("touchend", onEnd);
  }

  function animateCardOut(direction) {
    const card = elements.tinderCard;
    const translateVal = direction === "right" ? 400 : -400;
    const rotateVal = direction === "right" ? 30 : -30;

    elements.cardUserPhoto.src = ""; // Descarrega a imagem imediatamente

    card.style.transform = `translate(${translateVal}px, 0px) rotate(${rotateVal}deg)`;
    card.style.opacity = 0;

    setTimeout(() => {
      card.style.transition = "none";
      card.style.opacity = 1;
      handleTinderDecision(direction === "right" ? "keep" : "unfollow");
    }, 200);
  }

  // ==========================================
  // ATALHOS DE TECLADO (←, Espaço, →)
  // ==========================================
  function initKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
      const isSessionActive = state.session.active;
      if (!isSessionActive || state.tinder.activeUser === null) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        animateCardOut("left");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        animateCardOut("right");
      } else if (e.key === " ") {
        e.preventDefault();
        handleTinderDecision("skip");
      }
    });
  }

  // ==========================================
  // FILA E APIS DE UNFOLLOW
  // ==========================================
  function handleTinderDecision(decision) {
    const user = state.tinder.activeUser;
    if (!user) return;

    if (decision === "unfollow") {
      state.tinder.unfollowQueue.push(user);
      updateQueueUI();
      processUnfollowQueue();
    } else if (decision === "keep") {
      console.log(`[Tinder] Usuário @${user.username} marcado para MANTER.`);
    } else if (decision === "skip") {
      console.log(`[Tinder] Usuário @${user.username} foi PULADO.`);
    }

    state.tinder.currentIndex++;
    showNextCard();
  }

  function updateQueueUI() {
    const q = state.tinder.unfollowQueue;
    if (q.length > 0) {
      elements.unfollowQueueProgress.style.display = "block";
      elements.queueStatus.textContent = `${q.length} pendente(s) na fila`;
      elements.queueBar.style.width = "100%";
    } else {
      elements.unfollowQueueProgress.style.display = "none";
    }
  }

  async function processUnfollowQueue() {
    if (state.tinder.isProcessingQueue || state.tinder.unfollowQueue.length === 0) return;
    state.tinder.isProcessingQueue = true;

    const user = state.tinder.unfollowQueue[0];
    
    try {
      let targetId = user.userId;
      
      if (!targetId) {
        const profile = await fetchInstagramUserProfile(user.username);
        if (profile) targetId = profile.id;
      }

      if (targetId) {
        const success = await sendInstagramUnfollowRequest(targetId);
        if (success) {
          console.log(`[Unfollow] Deixou de seguir @${user.username} com sucesso.`);
        } else {
          console.error(`[Unfollow] Falha ao dar unfollow em @${user.username}`);
        }
      } else {
        console.error(`[Unfollow] Não foi possível encontrar o ID do usuário @${user.username}`);
      }
    } catch (e) {
      console.error(`[Unfollow] Erro na fila para @${user.username}:`, e);
    }

    state.tinder.unfollowQueue.shift();
    updateQueueUI();

    const randomDelay = Math.floor(Math.random() * (5000 - 3000 + 1)) + 3000;
    
    setTimeout(() => {
      state.tinder.isProcessingQueue = false;
      processUnfollowQueue();
    }, randomDelay);
  }

  async function sendInstagramUnfollowRequest(targetUserId) {
    const url = `https://www.instagram.com/api/v1/friendships/destroy/${targetUserId}/`;
    
    const headers = {
      "X-IG-App-ID": "936619743392459",
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "*/*"
    };

    if (state.session.csrfToken) {
      headers["X-CSRFToken"] = state.session.csrfToken;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: new URLSearchParams({
        container_module: "profile",
        user_id: targetUserId
      })
    });

    if (response.ok) {
      const json = await response.json();
      return json.status === "ok";
    }
    return false;
  }

  function restartTinder() {
    state.tinder.currentIndex = 0;
    elements.deckEmpty.style.display = "none";
    showNextCard();
  }

  function selectTinderFilter(filterType) {
    state.tinder.activeListType = filterType;
    state.tinder.currentIndex = 0;
    elements.deckEmpty.style.display = "none";

    // Atualiza classes ativas nos botões
    const buttons = [
      { type: "following", el: elements.btnFilterFollowing },
      { type: "followers", el: elements.btnFilterFollowers },
      { type: "mutuals", el: elements.btnFilterMutuals },
      { type: "nonfollowers", el: elements.btnFilterNonfollowers }
    ];

    buttons.forEach(btn => {
      if (btn.type === filterType) {
        btn.el.classList.add("active");
        btn.el.style.borderColor = "var(--primary)";
        btn.el.style.color = "var(--primary)";
        const badge = btn.el.querySelector(".badge-count");
        if (badge) {
          badge.style.background = "var(--primary)";
          badge.style.color = "white";
        }
      } else {
        btn.el.classList.remove("active");
        btn.el.style.borderColor = "";
        btn.el.style.color = "";
        const badge = btn.el.querySelector(".badge-count");
        if (badge) {
          badge.style.background = "";
          badge.style.color = "";
        }
      }
    });

    showNextCard();
  }

  function updateTinderFilterUI() {
    elements.badgeFollowingCount.textContent = state.tinder.allFollowing.length;
    elements.badgeFollowersCount.textContent = state.tinder.allFollowers.length;
    elements.badgeMutualsCount.textContent = state.tinder.mutualUsers.length;
    elements.badgeNonfollowersCount.textContent = state.tinder.unreciprocalUsers.length;

    // Garante que o botão ativo atual está visualmente correto
    const type = state.tinder.activeListType;
    const buttons = [
      { type: "following", el: elements.btnFilterFollowing },
      { type: "followers", el: elements.btnFilterFollowers },
      { type: "mutuals", el: elements.btnFilterMutuals },
      { type: "nonfollowers", el: elements.btnFilterNonfollowers }
    ];

    buttons.forEach(btn => {
      if (btn.type === type) {
        btn.el.classList.add("active");
        btn.el.style.borderColor = "var(--primary)";
        btn.el.style.color = "var(--primary)";
        const badge = btn.el.querySelector(".badge-count");
        if (badge) {
          badge.style.background = "var(--primary)";
          badge.style.color = "white";
        }
      } else {
        btn.el.classList.remove("active");
        btn.el.style.borderColor = "";
        btn.el.style.color = "";
        const badge = btn.el.querySelector(".badge-count");
        if (badge) {
          badge.style.background = "";
          badge.style.color = "";
        }
      }
    });
  }

  // ==========================================
  // SEÇÃO 3: GERENCIAR PUBLICAÇÕES
  // ==========================================
  async function fetchUserPosts() {
    elements.postsSetup.style.display = "none";
    elements.postsFetchLoading.style.display = "flex";
    
    try {
      const url = `https://www.instagram.com/api/v1/feed/user/${state.session.userId}/`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "X-IG-App-ID": "936619743392459"
        }
      });

      if (!response.ok) throw new Error("Falha ao consultar publicações");
      const data = await response.json();
      const items = data.items || [];

      state.posts.allItems = items;
      state.posts.selectedIds.clear();

      renderPostsGrid();
      
      elements.postsFetchLoading.style.display = "none";
      elements.postsGridContainer.style.display = "block";
      elements.postsCounter.textContent = `${items.length} publicações encontradas`;
      elements.deleteSelectedCount.textContent = "0";

    } catch (e) {
      alert("Erro ao buscar publicações: " + e.message);
      elements.postsSetup.style.display = "flex";
      elements.postsFetchLoading.style.display = "none";
    }
  }

  function renderPostsGrid() {
    elements.postsGrid.innerHTML = "";
    
    state.posts.allItems.forEach(item => {
      const picUrl = item.image_versions2?.candidates?.[0]?.url || item.carousel_media?.[0]?.image_versions2?.candidates?.[0]?.url || "";
      if (!picUrl) return;

      const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(picUrl)}&w=150&h=150&fit=cover`;

      const card = document.createElement("div");
      card.className = "post-card";
      card.dataset.id = item.id;

      card.innerHTML = `
        <img class="post-thumbnail" src="${proxyUrl}" alt="Feed Post">
        <div class="post-checkbox-wrapper">
          <input type="checkbox">
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
          </svg>
        </div>
      `;

      card.addEventListener("click", () => togglePostSelection(item.id, card));
      elements.postsGrid.appendChild(card);
    });
  }

  function togglePostSelection(id, cardEl) {
    const checkbox = cardEl.querySelector("input[type='checkbox']");
    if (state.posts.selectedIds.has(id)) {
      state.posts.selectedIds.delete(id);
      cardEl.classList.remove("selected");
      if (checkbox) checkbox.checked = false;
    } else {
      state.posts.selectedIds.add(id);
      cardEl.classList.add("selected");
      if (checkbox) checkbox.checked = true;
    }
    elements.deleteSelectedCount.textContent = state.posts.selectedIds.size;
  }

  function selectAllPosts() {
    state.posts.selectedIds.clear();
    const cards = elements.postsGrid.querySelectorAll(".post-card");
    cards.forEach(card => {
      const id = card.dataset.id;
      state.posts.selectedIds.add(id);
      card.classList.add("selected");
      const checkbox = card.querySelector("input[type='checkbox']");
      if (checkbox) checkbox.checked = true;
    });
    elements.deleteSelectedCount.textContent = state.posts.selectedIds.size;
  }

  function deselectAllPosts() {
    state.posts.selectedIds.clear();
    const cards = elements.postsGrid.querySelectorAll(".post-card");
    cards.forEach(card => {
      card.classList.remove("selected");
      const checkbox = card.querySelector("input[type='checkbox']");
      if (checkbox) checkbox.checked = false;
    });
    elements.deleteSelectedCount.textContent = "0";
  }

  // ==========================================
  // FILA DE DELEÇÃO DE PUBLICIDADE
  // ==========================================
  function startDeleteQueue() {
    const list = Array.from(state.posts.selectedIds);
    if (list.length === 0) {
      alert("Nenhuma publicação selecionada.");
      return;
    }

    const confirmDelete = confirm(`Deseja apagar definitivamente as ${list.length} publicações selecionadas do seu Instagram? Esta ação é irreversível.`);
    if (!confirmDelete) return;

    state.posts.deleteQueue = list;
    elements.deleteQueueProgress.style.display = "block";
    updateDeleteQueueUI(list.length, list.length);
    processDeleteQueue(list.length);
  }

  function updateDeleteQueueUI(remaining, total) {
    const done = total - remaining;
    const pct = total > 0 ? (done / total) * 100 : 0;
    elements.deleteQueueStatus.textContent = `${done} de ${total} excluído(s)`;
    elements.deleteQueueBar.style.width = `${pct}%`;
  }

  async function processDeleteQueue(totalItems) {
    if (state.posts.isProcessingDelete || state.posts.deleteQueue.length === 0) {
      if (state.posts.deleteQueue.length === 0) {
        setTimeout(() => {
          elements.deleteQueueProgress.style.display = "none";
          alert("Exclusão de lote finalizada com sucesso!");
          fetchUserPosts();
        }, 1500);
      }
      return;
    }

    state.posts.isProcessingDelete = true;
    const mediaId = state.posts.deleteQueue[0];
    
    try {
      const success = await sendInstagramDeleteRequest(mediaId);
      if (success) {
        console.log(`[Posts] Publicação ${mediaId} excluída.`);
      } else {
        console.error(`[Posts] Falha ao excluir publicação ${mediaId}`);
      }
    } catch (e) {
      console.error(`[Posts] Erro na exclusão de ${mediaId}:`, e);
    }

    state.posts.deleteQueue.shift();
    updateDeleteQueueUI(state.posts.deleteQueue.length, totalItems);

    const delay = Math.floor(Math.random() * (3000 - 2000 + 1)) + 2000;
    
    setTimeout(() => {
      state.posts.isProcessingDelete = false;
      processDeleteQueue(totalItems);
    }, delay);
  }

  async function sendInstagramDeleteRequest(mediaId) {
    const url = `https://www.instagram.com/api/v1/media/${mediaId}/delete/`;
    
    const headers = {
      "X-IG-App-ID": "936619743392459",
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "*/*"
    };

    if (state.session.csrfToken) {
      headers["X-CSRFToken"] = state.session.csrfToken;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: new URLSearchParams({
        media_id: mediaId
      })
    });

    if (response.ok) {
      const json = await response.json();
      return json.status === "ok";
    }
    return false;
  }

  // ==========================================
  // SEÇÃO 4: GERENCIAR REPUBLICAÇÕES (REPOSTS)
  // ==========================================
  async function fetchUserReposts() {
    elements.repostsSetup.style.display = "none";
    elements.repostsFetchLoading.style.display = "flex";
    
    const tryFetch = async (url) => {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "X-IG-App-ID": "936619743392459"
        }
      });
      if (!response.ok) throw new Error("Erro na rede");
      return await response.json();
    };

    try {
      let data;
      try {
        // Tenta o endpoint primário de reposted_media
        const url1 = `https://www.instagram.com/api/v1/feed/user/${state.session.userId}/reposted_media/`;
        data = await tryFetch(url1);
      } catch (err) {
        console.warn("Falha no endpoint primário de reposts, tentando fallback...", err);
        // Fallback: tenta o endpoint alternativo reposts
        const url2 = `https://www.instagram.com/api/v1/feed/user/${state.session.userId}/reposts/`;
        data = await tryFetch(url2);
      }

      const items = data.items || data.reposted_media || data.reposts || [];
      state.reposts.allItems = items;
      state.reposts.selectedIds.clear();

      renderRepostsGrid();
      
      elements.repostsFetchLoading.style.display = "none";
      elements.repostsGridContainer.style.display = "block";
      elements.repostsCounter.textContent = `${items.length} republicações encontradas`;
      elements.deleteRepostsSelectedCount.textContent = "0";

    } catch (e) {
      alert("Erro ao buscar republicações: " + e.message);
      elements.repostsSetup.style.display = "flex";
      elements.repostsFetchLoading.style.display = "none";
    }
  }

  function renderRepostsGrid() {
    elements.repostsGrid.innerHTML = "";
    
    state.reposts.allItems.forEach(item => {
      // O post republicado pode conter os dados do post original em uma sub-chave 'reposted_post' ou no próprio root
      const media = item.reposted_post || item;
      const picUrl = media.image_versions2?.candidates?.[0]?.url || media.carousel_media?.[0]?.image_versions2?.candidates?.[0]?.url || "";
      if (!picUrl) return;

      const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(picUrl)}&w=150&h=150&fit=cover`;

      const card = document.createElement("div");
      card.className = "post-card";
      card.dataset.id = item.id; // ID do repost para desfazer

      card.innerHTML = `
        <img class="post-thumbnail" src="${proxyUrl}" alt="Repost Feed">
        <div class="post-checkbox-wrapper">
          <input type="checkbox">
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
          </svg>
        </div>
      `;

      card.addEventListener("click", () => toggleRepostSelection(item.id, card));
      elements.repostsGrid.appendChild(card);
    });
  }

  function toggleRepostSelection(id, cardEl) {
    const checkbox = cardEl.querySelector("input[type='checkbox']");
    if (state.reposts.selectedIds.has(id)) {
      state.reposts.selectedIds.delete(id);
      cardEl.classList.remove("selected");
      if (checkbox) checkbox.checked = false;
    } else {
      state.reposts.selectedIds.add(id);
      cardEl.classList.add("selected");
      if (checkbox) checkbox.checked = true;
    }
    elements.deleteRepostsSelectedCount.textContent = state.reposts.selectedIds.size;
  }

  function selectAllReposts() {
    state.reposts.selectedIds.clear();
    const cards = elements.repostsGrid.querySelectorAll(".post-card");
    cards.forEach(card => {
      const id = card.dataset.id;
      state.reposts.selectedIds.add(id);
      card.classList.add("selected");
      const checkbox = card.querySelector("input[type='checkbox']");
      if (checkbox) checkbox.checked = true;
    });
    elements.deleteRepostsSelectedCount.textContent = state.reposts.selectedIds.size;
  }

  function deselectAllReposts() {
    state.reposts.selectedIds.clear();
    const cards = elements.repostsGrid.querySelectorAll(".post-card");
    cards.forEach(card => {
      card.classList.remove("selected");
      const checkbox = card.querySelector("input[type='checkbox']");
      if (checkbox) checkbox.checked = false;
    });
    elements.deleteRepostsSelectedCount.textContent = "0";
  }

  function startRepostDeleteQueue() {
    const list = Array.from(state.reposts.selectedIds);
    if (list.length === 0) {
      alert("Nenhuma republicação selecionada.");
      return;
    }

    const confirmDelete = confirm(`Deseja apagar definitivamente as ${list.length} republicações selecionadas do seu Instagram? Esta ação é irreversível.`);
    if (!confirmDelete) return;

    state.reposts.deleteQueue = list;
    elements.repostsQueueProgress.style.display = "block";
    updateRepostDeleteQueueUI(list.length, list.length);
    processRepostDeleteQueue(list.length);
  }

  function updateRepostDeleteQueueUI(remaining, total) {
    const done = total - remaining;
    const pct = total > 0 ? (done / total) * 100 : 0;
    
    // Atualiza progresso textual
    elements.repostsQueueStatus.textContent = `${done} de ${total} excluído(s)`;
    elements.repostsQueueBar.style.width = `${pct}%`;

    // Atualiza o tempo estimado restante (5 segundos por item)
    const timeEstSeconds = remaining * 5;
    if (timeEstSeconds <= 0) {
      elements.repostsTimeEst.textContent = "Finalizando...";
    } else if (timeEstSeconds >= 60) {
      const mins = Math.floor(timeEstSeconds / 60);
      const secs = timeEstSeconds % 60;
      elements.repostsTimeEst.textContent = `${mins}m ${secs}s`;
    } else {
      elements.repostsTimeEst.textContent = `${timeEstSeconds}s`;
    }
  }

  async function processRepostDeleteQueue(totalItems) {
    if (state.reposts.isProcessingDelete || state.reposts.deleteQueue.length === 0) {
      if (state.reposts.deleteQueue.length === 0) {
        setTimeout(() => {
          elements.repostsQueueProgress.style.display = "none";
          alert("Republicações desfeitas com sucesso!");
          fetchUserReposts(); // recarrega grid
        }, 1500);
      }
      return;
    }

    state.reposts.isProcessingDelete = true;
    const mediaId = state.reposts.deleteQueue[0];
    
    try {
      const success = await sendInstagramUnrepostRequest(mediaId);
      if (success) {
        console.log(`[Reposts] Republicação ${mediaId} desfeita.`);
      } else {
        console.error(`[Reposts] Falha ao desfazer republicação ${mediaId}`);
      }
    } catch (e) {
      console.error(`[Reposts] Erro na fila ao desfazer ${mediaId}:`, e);
    }

    state.reposts.deleteQueue.shift();
    updateRepostDeleteQueueUI(state.reposts.deleteQueue.length, totalItems);

    // Timeout solicitado de 5 segundos de intervalo entre desfazimento de reposts
    const delay = 5000;
    
    setTimeout(() => {
      state.reposts.isProcessingDelete = false;
      processRepostDeleteQueue(totalItems);
    }, delay);
  }

  async function sendInstagramUnrepostRequest(mediaId) {
    // Rota primária para desfazer repost
    const url1 = `https://www.instagram.com/api/v1/repost/undo/`;
    
    const headers = {
      "X-IG-App-ID": "936619743392459",
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "*/*"
    };

    if (state.session.csrfToken) {
      headers["X-CSRFToken"] = state.session.csrfToken;
    }

    const tryRequest = async (url) => {
      const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: new URLSearchParams({
          media_id: mediaId
        })
      });
      if (response.ok) {
        const json = await response.json();
        return json.status === "ok";
      }
      return false;
    };

    try {
      const ok = await tryRequest(url1);
      if (ok) return true;
      
      // Fallback: rota secundária se a primeira falhar
      console.warn("Rota primária falhou, tentando fallback de undo_repost...");
      const url2 = `https://www.instagram.com/api/v1/media/${mediaId}/undo_repost/`;
      return await tryRequest(url2);
    } catch (e) {
      console.error("Erro na request de undo repost:", e);
      return false;
    }
  }

})();
