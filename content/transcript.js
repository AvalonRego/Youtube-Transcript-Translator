// content/transcript.js

let _transcriptData = null;

window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  if (event.data?.type === 'YT_TRANSCRIPT_DATA') {
    _transcriptData = event.data.data;
    console.log("Transcript data received");
  }
});

function waitForTranscriptData(timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    if (_transcriptData) return resolve(_transcriptData);

    const handler = (event) => {
      if (event.source !== window) return;
      if (event.data?.type === 'YT_TRANSCRIPT_DATA') {
        window.removeEventListener('message', handler);
        clearTimeout(timer);
        resolve(event.data.data);
      }
    };

    const timer = setTimeout(() => {
      window.removeEventListener('message', handler);
      reject(new Error("Timed out waiting for transcript data"));
    }, timeoutMs);

    window.addEventListener('message', handler);
  });
}

async function fetchTranscript() {
  try {
    const data = await waitForTranscriptData();

    const contents = data?.content
      ?.engagementPanelSectionListRenderer
      ?.content
      ?.sectionListRenderer
      ?.contents?.[0]
      ?.itemSectionRenderer
      ?.contents;

    if (!contents || contents.length === 0) return { error: "No transcript contents found" };

    const segments = contents.map(item => {
      const vm = item?.macroMarkersPanelItemViewModel?.item?.timelineItemViewModel;
      const text = vm?.contentItems?.[0]?.transcriptSegmentViewModel?.simpleText;
      const timestamp = vm?.timestamp;
      return text && timestamp ? { timestamp, text } : null;
    }).filter(Boolean);

    if (segments.length === 0) return { error: "No segments parsed" };

    return { segments };
  } catch (e) {
    return { error: e.message };
  }
}