// content/content.js
let _ltReady = false;
let _pendingSegments = null;

function onYouTubeNavigate() {
  const isVideoPage = window.location.pathname === "/watch";
  if (!isVideoPage) return;

  if (typeof resetTranscriptData === 'function') resetTranscriptData();

  browser.runtime.sendMessage({ type: "GET_STATE" })
    .then(({ enabled }) => {
      console.log("Video page detected. Translator enabled:", enabled);
      if (enabled) {
        return browser.runtime.sendMessage({ type: "GET_LT_STATE" });
      }
    })
    .then(response => {
      if (response?.ready) {
        console.log("LibreTranslate already ready");
        _ltReady = true;
        if (_pendingSegments) {
          runTranslation(_pendingSegments);
          _pendingSegments = null;
        }
      }
    });

  // Always inject the button regardless of enabled state
  const btnInterval = setInterval(() => {
    if (document.querySelector('button[aria-label="Show transcript"]')) {
      injectPageButton();
      clearInterval(btnInterval);
    }
  }, 500);
}

function runTranslation(segments) {
  console.log("Transcript fetched:", segments.length, "segments — translating...");
  clearTranslations();
  translateSegments(segments, (translated) => {
    injectTranslation(translated);
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

      browser.runtime.sendMessage({ type: "GET_STATE" }).then(({ enabled }) => {
        if (!enabled) {
          console.log("Translator is off — skipping translation");
          return;
        }
        if (!_ltReady) {
          console.log("LibreTranslate not ready yet — queuing segments");
          _pendingSegments = result.segments;
          return;
        }
        runTranslation(result.segments);
      });
    });
  }, 50);
});

browser.runtime.onMessage.addListener((message) => {
  if (message.type === "TOGGLE") {
    console.log("Translator toggled:", message.enabled);
    if (!message.enabled) {
      _ltReady = false;
      _pendingSegments = null;
    }
  }

  if (message.type === "LT_READY") {
    console.log("LibreTranslate is ready");
    _ltReady = true;
    if (_pendingSegments) {
      runTranslation(_pendingSegments);
      _pendingSegments = null;
    }
  }
});

onYouTubeNavigate();
window.addEventListener("yt-navigate-finish", onYouTubeNavigate);