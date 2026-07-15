// Lógica da Extensão Chrome - Instagram Session Detector
(function () {
  const sessionChecking = document.getElementById("session-checking");
  const sessionActive = document.getElementById("session-active");
  const sessionInactive = document.getElementById("session-inactive");
  const userDetails = document.getElementById("user-details");

  document.addEventListener("DOMContentLoaded", () => {
    detectInstagramSession();
  });

  const getInstagramCookie = (cookieName) => {
    return new Promise((resolve) => {
      if (typeof chrome !== "undefined" && chrome.cookies) {
        chrome.cookies.get(
          { url: "https://www.instagram.com", name: cookieName },
          (cookie) => {
            resolve(cookie ? cookie.value : null);
          }
        );
      } else {
        resolve(null);
      }
    });
  };

  const detectInstagramSession = async () => {
    const userId = await getInstagramCookie("ds_user_id");

    sessionChecking.style.display = "none";

    if (userId) {
      sessionActive.style.display = "block";
      sessionInactive.style.display = "none";
      userDetails.textContent = `ID de Usuário Conectado: ${userId}`;
    } else {
      sessionActive.style.display = "none";
      sessionInactive.style.display = "block";
    }
  };
})();
