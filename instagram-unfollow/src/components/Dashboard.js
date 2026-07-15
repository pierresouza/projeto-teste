"use client";

import { useState, useMemo } from "react";
import styles from "./Dashboard.module.css";

export default function Dashboard({
  followers,
  following,
  decisions,
  onDecision,
  onReset,
  onStartQuickDecider,
}) {
  const [activeFilter, setActiveFilter] = useState("non-followers");
  const [searchQuery, setSearchQuery] = useState("");

  // Conjuntos para busca rápida
  const followersSet = useMemo(() => new Set(followers.map((f) => f.username)), [followers]);
  const followingSet = useMemo(() => new Set(following.map((f) => f.username)), [following]);

  // Cruzamento de dados de reciprocidade
  const nonFollowers = useMemo(() => {
    return following.filter((user) => !followersSet.has(user.username));
  }, [following, followersSet]);

  const mutuals = useMemo(() => {
    return following.filter((user) => followersSet.has(user.username));
  }, [following, followersSet]);

  const fans = useMemo(() => {
    return followers.filter((user) => !followingSet.has(user.username));
  }, [followers, followingSet]);

  // Obter lista atual de acordo com o filtro
  const currentList = useMemo(() => {
    switch (activeFilter) {
      case "all":
        return following;
      case "non-followers":
        return nonFollowers;
      case "mutuals":
        return mutuals;
      case "fans":
        return fans;
      default:
        return following;
    }
  }, [activeFilter, following, nonFollowers, mutuals, fans]);

  // Filtragem pela busca de texto
  const filteredList = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return currentList;
    return currentList.filter((user) => user.username.toLowerCase().includes(query));
  }, [currentList, searchQuery]);

  // Estatísticas de progresso
  const progressStats = useMemo(() => {
    // Apenas quem seguimos (all, non-followers, mutuals) pode ser revisado
    const listToCount = currentList;
    if (activeFilter === "fans") return { total: 0, completed: 0, percent: 0 };

    const total = listToCount.length;
    const completed = listToCount.filter((user) => decisions[user.username] !== undefined).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, percent };
  }, [currentList, activeFilter, decisions]);

  const handleAction = (username, actionType) => {
    onDecision(username, actionType);

    if (actionType === "unfollow") {
      // Abre o perfil no Instagram em uma nova aba
      window.open(`https://www.instagram.com/${username}/`, "_blank");
    }
  };

  // Cores dinâmicas para os avatares baseados no username
  const getAvatarStyle = (username) => {
    const charCodeSum = username.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hues = [15, 30, 190, 260, 320]; // Laranja, Terracota, Ciano, Roxo, Rosa
    const hue1 = hues[charCodeSum % hues.length];
    const hue2 = (hue1 + 60) % 360;
    return {
      background: `linear-gradient(135deg, hsl(${hue1}, 85%, 55%), hsl(${hue2}, 85%, 50%))`,
    };
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Painel de Conexões</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
            Revise seus relacionamentos e organize seu feed com segurança
          </p>
        </div>
        <button className={styles.resetBtn} onClick={onReset}>
          Carregar outros arquivos
        </button>
      </header>

      {/* Cards de Métricas */}
      <section className={styles.statsGrid}>
        <div
          className={`${styles.statCard} ${activeFilter === "all" ? styles.statCardActive : ""}`}
          onClick={() => setActiveFilter("all")}
        >
          <div className={styles.statValue}>{following.length}</div>
          <div className={styles.statLabel}>Seguindo</div>
        </div>

        <div
          className={`${styles.statCard} ${activeFilter === "non-followers" ? styles.statCardActive : ""}`}
          onClick={() => setActiveFilter("non-followers")}
        >
          <div className={styles.statValue} style={{ color: "var(--primary)" }}>{nonFollowers.length}</div>
          <div className={styles.statLabel}>Não me seguem de volta</div>
        </div>

        <div
          className={`${styles.statCard} ${activeFilter === "mutuals" ? styles.statCardActive : ""}`}
          onClick={() => setActiveFilter("mutuals")}
        >
          <div className={styles.statValue} style={{ color: "var(--secondary)" }}>{mutuals.length}</div>
          <div className={styles.statLabel}>Seguidores mútuos</div>
        </div>

        <div
          className={`${styles.statCard} ${activeFilter === "fans" ? styles.statCardActive : ""}`}
          onClick={() => setActiveFilter("fans")}
        >
          <div className={styles.statValue}>{fans.length}</div>
          <div className={styles.statLabel}>Fãs (Seguem você)</div>
        </div>
      </section>

      {/* Progresso de Revisão */}
      {activeFilter !== "fans" && progressStats.total > 0 && (
        <section className={styles.progressContainer}>
          <div className={styles.progressLabel}>
            Progresso da faxina ({progressStats.completed} de {progressStats.total} revisados)
          </div>
          <div className={styles.progressBarWrapper}>
            <div
              className={styles.progressBar}
              style={{ width: `${progressStats.percent}%` }}
            ></div>
          </div>
          <div className={styles.progressLabel} style={{ minWidth: "40px", textAlign: "right" }}>
            {progressStats.percent}%
          </div>
        </section>
      )}

      {/* Barra de Filtros e Ações */}
      <section className={styles.controlBar}>
        <div className={styles.searchWrapper}>
          <svg className={styles.searchIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Buscar usuário..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.actionBtns}>
          {activeFilter !== "fans" && currentList.length > 0 && (
            <button
              className={styles.quickDeciderBtn}
              onClick={() => onStartQuickDecider(filteredList)}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Revisão Rápida ({filteredList.length})
            </button>
          )}
        </div>
      </section>

      {/* Grade de Cards */}
      {filteredList.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateTitle}>Nenhum perfil encontrado</div>
          <p>Tente ajustar sua busca ou mudar o filtro selecionado.</p>
        </div>
      ) : (
        <section className={styles.grid}>
          {filteredList.map((user) => {
            const decision = decisions[user.username];
            const isUnfollowed = decision === "unfollow";

            return (
              <div
                key={user.username}
                className={`${styles.card} ${isUnfollowed ? styles.cardUnfollowed : ""}`}
              >
                <div className={styles.profileInfo}>
                  <div className={styles.avatar} style={getAvatarStyle(user.username)}>
                    {user.username.charAt(0)}
                  </div>
                  <div className={styles.usernameWrapper}>
                    <span className={styles.username}>@{user.username}</span>
                    <a
                      href={`https://www.instagram.com/${user.username}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.profileLink}
                    >
                      Ver perfil
                      <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>

                {activeFilter !== "fans" && (
                  <div className={styles.cardActions}>
                    <button
                      className={styles.keepBtn}
                      title="Manter na minha lista"
                      onClick={() => handleAction(user.username, "keep")}
                      style={decision === "keep" ? { background: "#10B981", color: "white", borderColor: "#10B981" } : {}}
                    >
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button
                      className={styles.unfollowBtn}
                      onClick={() => handleAction(user.username, "unfollow")}
                      style={isUnfollowed ? { background: "#EF4444", color: "white", borderColor: "#EF4444" } : {}}
                    >
                      {isUnfollowed ? "Unfollowed" : "Unfollow"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
