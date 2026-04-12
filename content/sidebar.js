// content/sidebar.js

function injectTranslation(segment) {
  const segmentEls = document.querySelectorAll('transcript-segment-view-model');

  for (const segmentEl of segmentEls) {
    const timestampEl = segmentEl.querySelector('.ytwTranscriptSegmentViewModelTimestamp');
    if (!timestampEl) continue;
    if (timestampEl.textContent.trim() !== segment.timestamp) continue;

    // Don't inject twice
    if (segmentEl.querySelector('.yt-translator-injected')) continue;

    const translationEl = document.createElement('div');
    translationEl.className = 'yt-translator-injected';
    translationEl.textContent = segment.translated;
    translationEl.style.cssText = `
      font-size: 14px;
      color: #888;
      padding: 2px 0 6px 48px;
      font-style: italic;
    `;

    segmentEl.appendChild(translationEl);
    break;
  }
}

function clearTranslations() {
  document.querySelectorAll('.yt-translator-injected').forEach(el => el.remove());
}

function injectPageButton() {
  // Don't inject twice
  if (document.querySelector('#yt-translator-btn')) return;

  const showTranscriptBtn = document.querySelector('button[aria-label="Show transcript"]');
  if (!showTranscriptBtn) return;

  const parent = showTranscriptBtn.closest('yt-button-shape')?.parentElement;
  if (!parent) return;

  const btn = document.createElement('button');
  btn.id = 'yt-translator-btn';
  btn.textContent = 'Transcript with translation';
  btn.style.cssText = `
    margin-left: 8px;
    padding: 8px 16px;
    border-radius: 18px;
    border: 1px solid #909090;
    background: transparent;
    color: inherit;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    font-family: inherit;
  `;

  btn.addEventListener('click', () => {
  const transcriptBtn = document.querySelector('button[aria-label="Show transcript"]');
  if (transcriptBtn) transcriptBtn.click();
  browser.runtime.sendMessage({ type: "GET_STATE" }).then(({ enabled }) => {
    if (!enabled) {
      browser.runtime.sendMessage({ type: "SET_STATE_CURRENT", enabled: true });
    }
  });
});

  parent.insertAdjacentElement('afterend', btn);
  console.log("Translator button injected");
}