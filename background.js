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
});

// Clean up when tab closes
browser.tabs.onRemoved.addListener((tabId) => {
  delete tabStates[tabId];
});


