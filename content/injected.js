// content/injected.js
(function() {
  const origFetch = window.fetch;
  window.fetch = async function(...args) {
    const res = await origFetch.apply(this, args);
    const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
    if (url && url.includes('get_panel')) {
      res.clone().json().then(data => {
        window.postMessage({ type: 'YT_TRANSCRIPT_DATA', data }, '*');
      }).catch(() => {});
    }
    return res;
  };
})();