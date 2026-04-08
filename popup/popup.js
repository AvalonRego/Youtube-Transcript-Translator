// popup/popup.js
const statusEl = document.getElementById("status");
const toggleBtn = document.getElementById("toggle");

let currentTabId = null;

function updateUI(enabled) {
  statusEl.textContent = "Translator: " + (enabled ? "ON" : "OFF");
  toggleBtn.textContent = enabled ? "Disable" : "Enable";
}

browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
  currentTabId = tabs[0].id;
  return browser.runtime.sendMessage({ type: "GET_STATE", tabId: currentTabId });
}).then(({ enabled }) => {
  updateUI(enabled);
});

toggleBtn.addEventListener("click", () => {
  browser.runtime.sendMessage({ type: "GET_STATE", tabId: currentTabId }).then(({ enabled }) => {
    const newState = !enabled;
    return browser.runtime.sendMessage({ type: "SET_STATE", tabId: currentTabId, enabled: newState });
  }).then(({ enabled }) => {
    updateUI(enabled);
    browser.tabs.sendMessage(currentTabId, { type: "TOGGLE", enabled });
  });
});