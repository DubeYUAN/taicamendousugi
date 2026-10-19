import { LanguageOption } from '../types';

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en-US', name: '英語 (English - US)', flag: '🇺🇸' },
  { code: 'en-GB', name: '英語 (English - UK)', flag: '🇬🇧' },
  { code: 'ja-JP', name: '日語 (Japanese)', flag: '🇯🇵' },
  { code: 'ko-KR', name: '韓語 (Korean)', flag: '🇰🇷' },
  { code: 'es-ES', name: '西班牙語 (Spanish)', flag: '🇪🇸' },
  { code: 'fr-FR', name: '法語 (French)', flag: '🇫🇷' },
  { code: 'de-DE', name: '德語 (German)', flag: '🇩🇪' },
  { code: 'zh-TW', name: '繁體中文 (Chinese - TW)', flag: '🇹🇼' },
  { code: 'zh-CN', name: '簡體中文 (Chinese - CN)', flag: '🇨🇳' },
  { code: 'it-IT', name: '義大利語 (Italian)', flag: '🇮🇹' },
  { code: 'pt-BR', name: '葡萄牙語 (Portuguese)', flag: '🇧🇷' },
  { code: 'ru-RU', name: '俄語 (Russian)', flag: '🇷🇺' },
  { code: 'vi-VN', name: '越南語 (Vietnamese)', flag: '🇻🇳' },
  { code: 'th-TH', name: '泰語 (Thai)', flag: '🇹🇭' },
];

/**
 * Automatically infer language tag from text scripts if not specified
 */
export function detectLanguage(text: string): string {
  if (!text) return 'en-US';

  // Japanese Hiragana & Katakana
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) {
    return 'ja-JP';
  }
  // Korean Hangul
  if (/[\uAC00-\uD7AF\u1100-\u11FF]/.test(text)) {
    return 'ko-KR';
  }
  // Chinese Hanzi
  if (/[\u4E00-\u9FFF]/.test(text)) {
    return 'zh-TW';
  }
  // Cyrillic (Russian etc)
  if (/[\u0400-\u04FF]/.test(text)) {
    return 'ru-RU';
  }
  // Thai
  if (/[\u0E00-\u0E7F]/.test(text)) {
    return 'th-TH';
  }
  // Spanish accented letters (ñ, ¿, ¡, á, é, í, ó, ú)
  if (/[ñÑ¿¡áéíóúÁÉÍÓÚ]/.test(text)) {
    return 'es-ES';
  }
  // French accents (ç, œ, à, è, ù, â, ê, î, ô, û)
  if (/[çœàèùâêîôûëïü]/.test(text)) {
    return 'fr-FR';
  }
  // German umlauts/eszett (ä, ö, ü, ß)
  if (/[äöüßÄÖÜ]/.test(text)) {
    return 'de-DE';
  }

  // Default to English
  return 'en-US';
}

let cachedVoices: SpeechSynthesisVoice[] = [];

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve([]);
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      cachedVoices = voices;
      resolve(voices);
      return;
    }

    const handler = () => {
      cachedVoices = window.speechSynthesis.getVoices();
      window.speechSynthesis.removeEventListener('voiceschanged', handler);
      resolve(cachedVoices);
    };

    window.speechSynthesis.addEventListener('voiceschanged', handler);
    // Fallback if event doesn't trigger
    setTimeout(() => {
      cachedVoices = window.speechSynthesis.getVoices();
      resolve(cachedVoices);
    }, 500);
  });
}

// Initial prefetch
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
}

export async function speak(
  text: string,
  lang: string = 'en-US',
  rate: number = 1.0,
  pitch: number = 1.0
): Promise<boolean> {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('SpeechSynthesis is not supported in this environment');
    return false;
  }

  try {
    window.speechSynthesis.cancel(); // Stop any pending utterances

    const cleanText = text.replace(/\[.*?\]|\(.*?\)/g, '').trim() || text;
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = lang;
    utterance.rate = rate;
    utterance.pitch = pitch;

    const voices = cachedVoices.length ? cachedVoices : await loadVoices();
    // Try exact lang match first (e.g. ja-JP)
    let matchingVoice = voices.find((v) => v.lang === lang || v.lang.replace('_', '-') === lang);
    // If not found, try primary language prefix match (e.g. 'ja' or 'es')
    if (!matchingVoice) {
      const prefix = lang.split('-')[0].toLowerCase();
      matchingVoice = voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
    }

    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.error('Speech synthesis failed:', err);
    return false;
  }
}
