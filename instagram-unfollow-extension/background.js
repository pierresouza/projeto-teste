// Background Service Worker para abrir o app em tela cheia ao clicar na extensão
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({ url: "index.html" });
});
