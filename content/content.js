// content/content.js

function onYouTubeNavigate() {
  const isVideoPage = window.location.pathname === "/watch";
  if (!isVideoPage) return;

  browser.runtime.sendMessage({ type: "GET_STATE" })
    .then(({ enabled }) => {
      console.log("Video page detected. Translator enabled:", enabled);
    });
}

// Initial load
onYouTubeNavigate();

// YouTube SPA navigation
window.addEventListener("yt-navigate-finish", onYouTubeNavigate);

// Message listener — top level
browser.runtime.onMessage.addListener((message) => {
  if (message.type === "TOGGLE") {
    console.log("Translator toggled:", message.enabled);
  }
});
