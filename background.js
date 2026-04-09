// background.js
const tabStates = {};

browser.runtime.onInstalled.addListener(() => {
  browser.storage.local.set({
    sourceLang: "de",
    targetLang: "en"
  });
});

browser.runtime.onMessage.addListener((message, sender) => {
  if (message.type === "GET_STATE") {
    const tabId = message.tabId ?? sender.tab?.id;
    const enabled = tabStates[tabId] ?? false;
    return Promise.resolve({ enabled });
  }

  if (message.type === "SET_STATE") {
    const { tabId, enabled } = message;
    tabStates[tabId] = enabled;
    return Promise.resolve({ enabled });
  }

  if (message.type === "TRANSLATE") {
    const { text, sourceLang, targetLang } = message;
    return fetch("http://localhost:5000/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: text, source: sourceLang, target: targetLang, format: "text" })
    })
    .then(r => r.json())
    .then(data => ({ translatedText: data.translatedText }))
    .catch(e => ({ error: e.message }));
  }
});

browser.tabs.onRemoved.addListener((tabId) => {
  delete tabStates[tabId];
});