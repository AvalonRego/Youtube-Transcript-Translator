// content/translate.js

async function translateSegments(segments, onSegmentTranslated) {
  const { sourceLang, targetLang } = await browser.storage.local.get(['sourceLang', 'targetLang']);

  for (const segment of segments) {
    try {
      const response = await browser.runtime.sendMessage({
        type: "TRANSLATE",
        text: segment.text,
        sourceLang,
        targetLang
      });

      if (response.error) throw new Error(response.error);

      const translated = {
        timestamp: segment.timestamp,
        original: segment.text,
        translated: response.translatedText || "[translation error]"
      };

      onSegmentTranslated(translated);
    } catch (e) {
      onSegmentTranslated({
        timestamp: segment.timestamp,
        original: segment.text,
        translated: "[translation error]"
      });
      console.warn(`Translation failed: ${segment.text}`, e.message);
    }
  }
}