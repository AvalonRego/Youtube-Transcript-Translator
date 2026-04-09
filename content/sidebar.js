// content/sidebar.js

function injectTranslations(translatedSegments) {
  // Remove any previously injected translations
  document.querySelectorAll('.yt-translator-injected').forEach(el => el.remove());

  const segmentEls = document.querySelectorAll('transcript-segment-view-model');

  segmentEls.forEach(segmentEl => {
    const timestampEl = segmentEl.querySelector('.ytwTranscriptSegmentViewModelTimestamp');
    const textEl = segmentEl.querySelector('.yt-core-attributed-string');

    if (!timestampEl || !textEl) return;

    const timestamp = timestampEl.textContent.trim();
    const match = translatedSegments.find(s => s.timestamp === timestamp);
    if (!match) return;

    const translationEl = document.createElement('div');
    translationEl.className = 'yt-translator-injected';
    translationEl.textContent = match.translated;
    translationEl.style.cssText = `
      font-size: 14px;
      color: #888;
      padding: 2px 0 6px 48px;
      font-style: italic;
    `;

    segmentEl.appendChild(translationEl);
  });

  console.log("Translations injected into transcript panel");
}