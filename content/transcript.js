// content/transcript.js
let _transcriptData = null;
let _currentVideoId = null;

window.addEventListener('message', (event) => {
  if (event.source !== window) return;

  if (event.data?.type === 'YT_NAVIGATED') {
    _transcriptData = null;
    _currentVideoId = null;
    console.log("Navigation detected — transcript data reset");
    return;
  }

  if (event.data?.type !== 'YT_TRANSCRIPT_DATA') return;

  const hasGerman = (event.data.tracks || []).some(t => t === 'de');
  if (!hasGerman) {
    console.log("No German captions — ignoring");
    return;
  }

  _transcriptData = event.data.data;
  _currentVideoId = event.data.videoId;
  console.log("German transcript data received for video:", _currentVideoId);
});

function resetTranscriptData() {
  _transcriptData = null;
  _currentVideoId = null;
}

async function fetchTranscript() {
  if (!_transcriptData) return { error: "No transcript data — open the YouTube transcript panel first" };

  const contents = _transcriptData?.content
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
}