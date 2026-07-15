// Service worker para abrir o painel da extensão ao ser clicado
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({ url: "index.html" });
});
