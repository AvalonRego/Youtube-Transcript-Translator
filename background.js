// background.js
const tabStates = {};
let nativePort = null;
let libreTranslateReady = false;

browser.runtime.onInstalled.addListener(() => {
  browser.storage.local.set({
    sourceLang: "de",
    targetLang: "en"
  });
});

function connectNativeHost() {
  console.log("Connecting to native host...");
  nativePort = browser.runtime.connectNative('yt_translator_host');
  console.log("Native port created:", nativePort);

  nativePort.onMessage.addListener((message) => {
    console.log("Native host message:", message);
    if (message.status === 'ready') {
      libreTranslateReady = true;
      console.log("LibreTranslate ready — notifying tabs");
      browser.tabs.query({}).then(tabs => {
        console.log("Tabs to notify:", tabs.length);
        tabs.forEach(tab => {
          browser.tabs.sendMessage(tab.id, { type: "LT_READY" })
            .then(() => console.log("LT_READY sent to tab:", tab.id))
            .catch(e => console.log("Failed to send to tab:", tab.id, e.message));
        });
      });
    }else if (message.status === 'stopped' || message.status === 'error') {
      console.log("message.status:", message.status);
      libreTranslateReady = false;
      
    }
  });

  nativePort.onDisconnect.addListener(() => {
    console.log("Native host disconnected, error:", browser.runtime.lastError);
    libreTranslateReady = false;
    nativePort = null;
  });
}

browser.runtime.onMessage.addListener((message, sender) => {
  if (message.type === "GET_STATE") {
    const tabId = message.tabId ?? sender.tab?.id;
    const enabled = tabStates[tabId] ?? false;
    return Promise.resolve({ enabled });
  }

  if (message.type === "SET_STATE") {
  const { tabId, enabled } = message;
  tabStates[tabId] = enabled;
  console.log("SET_STATE received, enabled:", enabled);

  if (enabled) {
    console.log("Attempting to connect native host...");
    if (!nativePort) connectNativeHost();
    nativePort.postMessage({ cmd: "start" });
    libreTranslateReady = false;
  } else {
    if (nativePort) {
      nativePort.postMessage({ cmd: "stop" });
      libreTranslateReady = false;
    }
  }

  return Promise.resolve({ enabled });
  }

  if (message.type === "TRANSLATE") {
    if (!libreTranslateReady) {
      return Promise.resolve({ error: "LibreTranslate not ready" });
    }
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
  if (message.type === "GET_LT_STATE") {
  return Promise.resolve({ ready: libreTranslateReady });
  }
  if (message.type === "SET_STATE_CURRENT") {
  const tabId = sender.tab?.id;
  tabStates[tabId] = message.enabled;
  if (message.enabled) {
    if (!nativePort) connectNativeHost();
    nativePort.postMessage({ cmd: "start" });
    libreTranslateReady = false;
  } else {
    if (nativePort) {
      nativePort.postMessage({ cmd: "stop" });
      libreTranslateReady = false;
    }
  }
  return Promise.resolve({ enabled: message.enabled });
  }
});

browser.tabs.onRemoved.addListener((tabId) => {
  delete tabStates[tabId];
});