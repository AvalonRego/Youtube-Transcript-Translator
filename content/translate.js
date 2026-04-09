// content/translate.js

async function translateSegments(segments) {
  const { sourceLang, targetLang } = await browser.storage.local.get(['sourceLang', 'targetLang']);
  const result = [];

  for (const segment of segments) {
    try {
      const response = await browser.runtime.sendMessage({
        type: "TRANSLATE",
        text: segment.text,
        sourceLang,
        targetLang
      });

      if (response.error) throw new Error(response.error);

      result.push({
        timestamp: segment.timestamp,
        original: segment.text,
        translated: response.translatedText || "[translation error]"
      });
      console.log(`[${segment.timestamp}] ${segment.text} → ${response.translatedText}`);
    } catch (e) {
      result.push({
        timestamp: segment.timestamp,
        original: segment.text,
        translated: "[translation error]"
      });
      console.warn(`Translation failed for segment: ${segment.text}`, e.message, e);
    }
  }

  return result;
}