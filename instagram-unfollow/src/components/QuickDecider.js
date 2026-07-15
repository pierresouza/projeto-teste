"use client";

import { useState, useEffect } from "react";
import styles from "./QuickDecider.module.css";

export default function QuickDecider({ list, decisions, onDecision, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [profilePicUrl, setProfilePicUrl] = useState(null);

  const currentUser = list[currentIndex];

  // Busca e define a foto do perfil assincronamente ao trocar de usuário
  useEffect(() => {
    if (!currentUser?.username) return;
    setProfilePicUrl(null);

    const getCookie = (name) => {
      if (typeof document === "undefined") return null;
      const value = "; " + document.cookie;
      const parts = value.split("; " + name + "=");
      if (parts.length === 2) return parts.pop().split(";").shift();
      return null;
    };

    const fetchPic = async () => {
      const csrfToken = getCookie("csrftoken") || "";
      const headers = {
        "X-CSRFToken": csrfToken,
        "X-IG-App-ID": "936619743392459",
        "X-Requested-With": "XMLHttpRequest"
      };

      const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${currentUser.username}`;
      try {
        const response = await fetch(url, { headers });
        if (!response.ok) throw new Error("HTTP error");
        const data = await response.json();
        const urlHd = data.data?.user?.profile_pic_url_hd || data.data?.user?.profile_pic_url;
        if (urlHd) {
          const proxiedUrl = `https://images.weserv.nl/?url=${encodeURIComponent(urlHd)}`;
          setProfilePicUrl(proxiedUrl);
        }
      } catch (e) {
        console.warn("CORS ou erro de rede ao buscar avatar de " + currentUser.username);
      }
    };

    fetchPic();
  }, [currentUser]);

  // Configura atalhos de teclado
  useEffect(() => {
    if (currentIndex >= list.length) return;

    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") {
        // Unfollow
        handleUnfollow();
      } else if (e.key === "ArrowRight") {
        // Keep
        handleKeep();
      } else if (e.key === "ArrowUp" || e.key === " ") {
        // Skip (ou abrir perfil)
        e.preventDefault();
        handleSkip();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentIndex, list]);

  const handleKeep = () => {
    if (currentIndex < list.length) {
      onDecision(currentUser.username, "keep");
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleUnfollow = () => {
    if (currentIndex < list.length) {
      onDecision(currentUser.username, "unfollow");
      // Abre o perfil no Instagram
      window.open(`https://www.instagram.com/${currentUser.username}/`, "_blank");
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    if (currentIndex < list.length) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  // Cores dinâmicas para o avatar baseadas no username
  const getAvatarStyle = (username) => {
    if (!username) return {};
    const charCodeSum = username.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hues = [15, 30, 190, 260, 320];
    const hue1 = hues[charCodeSum % hues.length];
    const hue2 = (hue1 + 60) % 360;
    return {
      background: `linear-gradient(135deg, hsl(${hue1}, 85%, 55%), hsl(${hue2}, 85%, 50%))`,
    };
  };

  const isFinished = currentIndex >= list.length;

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        <button className={styles.closeBtn} onClick={onClose} title="Voltar ao Painel">
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {!isFinished ? (
          <>
            <div className={styles.progressText}>
              Perfil {currentIndex + 1} de {list.length}
            </div>

            <div className={styles.card}>
              <div 
                className={styles.avatar} 
                style={profilePicUrl ? { background: "none" } : getAvatarStyle(currentUser.username)}
              >
                {profilePicUrl ? (
                  <img 
                    src={profilePicUrl} 
                    alt={currentUser.username} 
                    className={styles.avatarImg} 
                    onError={() => setProfilePicUrl(null)} 
                  />
                ) : (
                  currentUser.username.charAt(0)
                )}
              </div>
              <h2 className={styles.username}>@{currentUser.username}</h2>
              <a
                href={`https://www.instagram.com/${currentUser.username}/`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.profileLink}
              >
                Abrir Instagram
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            <div className={styles.actions}>
              {/* Botão Unfollow */}
              <button
                className={`${styles.actionBtn} styles.actionBtnUnfollow`}
                onClick={handleUnfollow}
                title="Deixar de seguir (Seta Esquerda)"
                style={{ background: "var(--primary)" }}
              >
                <svg width="24" height="24" fill="none" stroke="white" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>

              {/* Botão Skip */}
              <button
                className={`${styles.actionBtn} ${styles.actionBtnSkip}`}
                onClick={handleSkip}
                title="Pular este perfil (Espaço)"
              >
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>

              {/* Botão Keep */}
              <button
                className={`${styles.actionBtn} ${styles.actionBtnKeep}`}
                onClick={handleKeep}
                title="Manter perfil (Seta Direita)"
              >
                <svg width="24" height="24" fill="none" stroke="white" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>

            <div className={styles.shortcuts}>
              <span>Atalhos:</span>
              <span className={styles.shortcutTag}>← Unfollow</span>
              <span className={styles.shortcutTag}>Space Pular</span>
              <span className={styles.shortcutTag}>→ Manter</span>
            </div>
          </>
        ) : (
          <div className={styles.finishedState}>
            <svg
              className={styles.finishedIcon}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className={styles.finishedTitle}>Faxina Concluída!</h2>
            <p className={styles.finishedDesc}>
              Você revisou todos os perfis selecionados nesta rodada.
            </p>
            <button className={styles.backBtn} onClick={onClose}>
              Voltar ao Painel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
