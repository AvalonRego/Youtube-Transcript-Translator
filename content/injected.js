// content/injected.js
(function() {
  let currentTracks = [];

  window.addEventListener('yt-page-data-fetched', (e) => {
    const tracks = e.detail?.pageData?.playerResponse
      ?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
    currentTracks = tracks.map(t => t.languageCode);
    console.log("Tracks updated from page data:", currentTracks);
  });

  const origFetch = window.fetch;
  window.fetch = async function(...args) {
    const res = await origFetch.apply(this, args);
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
    if (url && url.includes('get_panel')) {
      res.clone().json().then(data => {
        const currentVideoId = new URLSearchParams(window.location.search).get('v');
        console.log("FETCH TRACKS:", currentTracks, "Video ID:", currentVideoId);
        window.postMessage({
          type: 'YT_TRANSCRIPT_DATA',
          data,
          tracks: currentTracks,
          videoId: currentVideoId
        }, '*');
      }).catch(() => {});
    }
    return res;
  };

  window.addEventListener('yt-navigate-finish', () => {
    window.postMessage({ type: 'YT_NAVIGATED' }, '*');
  });
})();