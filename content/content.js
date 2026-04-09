// content/content.js

function onYouTubeNavigate() {
  const isVideoPage = window.location.pathname === "/watch";
  if (!isVideoPage) return;

  if (typeof resetTranscriptData === 'function') resetTranscriptData();

  browser.runtime.sendMessage({ type: "GET_STATE" })
    .then(({ enabled }) => {
      console.log("Video page detected. Translator enabled:", enabled);
    });
}

window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  if (event.data?.type !== 'YT_TRANSCRIPT_DATA') return;

  setTimeout(() => {
    fetchTranscript().then(result => {
      if (result.error) {
        console.log("Transcript error:", result.error);
        return;
      }
      console.log("Transcript result:", result.segments.length, "segments");
      translateSegments(result.segments).then(translated => {
      console.log("Translation result:", translated);
      injectTranslations(translated);
    });
    });
  }, 50);
});

onYouTubeNavigate();
window.addEventListener("yt-navigate-finish", onYouTubeNavigate);

browser.runtime.onMessage.addListener((message) => {
  if (message.type === "TOGGLE") {
    console.log("Translator toggled:", message.enabled);
  }
});