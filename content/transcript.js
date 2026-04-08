// content/transcript.js

async function fetchTranscript() {
  const videoId = new URLSearchParams(window.location.search).get("v");
  if (!videoId) return { error: "No video ID found" };

  // Step 1: Fetch the page HTML and extract ytInitialPlayerResponse
  const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
  const html = await response.text();

  const match = html.match(/ytInitialPlayerResponse\s*=\s*({.+?})\s*;/);
  if (!match) return { error: "Could not find player response" };

  let playerResponse;
  try {
    playerResponse = JSON.parse(match[1]);
  } catch (e) {
    return { error: "Could not parse player response" };
  }

  // Step 2: Find caption tracks
  const tracks = playerResponse?.captions
    ?.playerCaptionsTracklistRenderer
    ?.captionTracks;

  if (!tracks || tracks.length === 0) return { error: "No captions available" };

  // Step 3: Find German track
  const deTrack = tracks.find(t => t.languageCode === "de");
  if (!deTrack) return { error: "No German captions found" };

  // Step 4: Fetch the transcript XML
  const transcriptResponse = await fetch(deTrack.baseUrl);
  const xml = await transcriptResponse.text();

  // Step 5: Parse XML
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");
  const textNodes = Array.from(doc.querySelectorAll("text"));

  if (textNodes.length === 0) return { error: "Transcript is empty" };

  const segments = textNodes.map(node => {
    const start = parseFloat(node.getAttribute("start"));
    const minutes = Math.floor(start / 60).toString().padStart(2, "0");
    const seconds = Math.floor(start % 60).toString().padStart(2, "0");
    return {
      timestamp: `${minutes}:${seconds}`,
      text: node.textContent.replace(/&#39;/g, "'").replace(/&amp;/g, "&").trim()
    };
  });

  return { segments };
}