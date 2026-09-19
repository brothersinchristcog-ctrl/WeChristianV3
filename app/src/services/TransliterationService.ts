import { SupportedLanguage } from '../locales';

// Telugu Vowels to English
const TELUGU_VOWELS: Record<string, string> = {
  '\u0C05': 'a', '\u0C06': 'aa', '\u0C07': 'i', '\u0C08': 'ee', '\u0C09': 'u',
  '\u0C0A': 'oo', '\u0C0B': 'ru', '\u0C0C': 'lu', '\u0C0E': 'e', '\u0C0F': 'ye',
  '\u0C10': 'ai', '\u0C12': 'o', '\u0C13': 'o', '\u0C14': 'au'
};

// Telugu Consonants to English
const TELUGU_CONSONANTS: Record<string, string> = {
  '\u0C15': 'k', '\u0C16': 'kh', '\u0C17': 'g', '\u0C18': 'gh', '\u0C19': 'ng',
  '\u0C1A': 'ch', '\u0C1B': 'chh', '\u0C1C': 'j', '\u0C1D': 'jh', '\u0C1E': 'ny',
  '\u0C1F': 't', '\u0C20': 'th', '\u0C21': 'd', '\u0C22': 'dh', '\u0C23': 'n',
  '\u0C24': 'th', '\u0C25': 'th', '\u0C26': 'd', '\u0C27': 'dh', '\u0C28': 'n',
  '\u0C2A': 'p', '\u0C2B': 'ph', '\u0C2C': 'b', '\u0C2D': 'bh', '\u0C2E': 'm',
  '\u0C2F': 'y', '\u0C30': 'r', '\u0C31': 'r', '\u0C32': 'l', '\u0C33': 'l',
  '\u0C34': 'zh', '\u0C35': 'v', '\u0C36': 'sh', '\u0C37': 'sh', '\u0C38': 's',
  '\u0C39': 'h'
};

// Telugu Matras (vowel signs) to English
const TELUGU_MATRAS: Record<string, string> = {
  '\u0C3E': 'aa', '\u0C3F': 'i', '\u0C40': 'ee', '\u0C41': 'u', '\u0C42': 'oo',
  '\u0C43': 'ru', '\u0C44': 'roo', '\u0C46': 'e', '\u0C47': 'e', '\u0C48': 'ai',
  '\u0C4A': 'o', '\u0C4B': 'o', '\u0C4C': 'au'
};

const VIRAMA = '\u0C4D';
const ANUSVARA = '\u0C02';
const VISARGA = '\u0C03';

const TELUGU_TO_TAMIL: Record<string, string> = {
  '\u0C05': 'அ', '\u0C06': 'ஆ', '\u0C07': 'இ', '\u0C08': 'ஈ', '\u0C09': 'உ', '\u0C0A': 'ஊ',
  '\u0C0E': 'எ', '\u0C0F': 'ஏ', '\u0C10': 'ஐ', '\u0C12': 'ஒ', '\u0C13': 'ஓ', '\u0C14': 'ஔ',
  '\u0C15': 'க', '\u0C16': 'க', '\u0C17': 'க', '\u0C18': 'க', '\u0C19': 'ங',
  '\u0C1A': 'ச', '\u0C1B': 'ச', '\u0C1C': 'ஜ', '\u0C1D': 'ஜ', '\u0C1E': 'ஞ',
  '\u0C1F': 'ட', '\u0C20': 'ட', '\u0C21': 'ட', '\u0C22': 'ட', '\u0C23': 'ண',
  '\u0C24': 'த', '\u0C25': 'த', '\u0C26': 'த', '\u0C27': 'த', '\u0C28': 'ந',
  '\u0C2A': 'ப', '\u0C2B': 'ப', '\u0C2C': 'ப', '\u0C2D': 'ப', '\u0C2E': 'ம',
  '\u0C2F': 'ய', '\u0C30': 'ர', '\u0C31': 'ற', '\u0C32': 'ல', '\u0C33': 'ள',
  '\u0C35': 'வ', '\u0C36': 'ஶ', '\u0C37': 'ஷ', '\u0C38': 'ஸ', '\u0C39': 'ஹ',
  '\u0C3E': 'ா', '\u0C3F': 'ி', '\u0C40': 'ீ', '\u0C41': 'ு', '\u0C42': 'ூ',
  '\u0C46': 'ெ', '\u0C47': 'ே', '\u0C48': 'ை', '\u0C4A': 'ொ', '\u0C4B': 'ோ', '\u0C4C': 'ௌ',
  '\u0C4D': '்', '\u0C02': 'ம்'
};

export class TransliterationService {
  /**
   * Check if text contains Telugu Unicode characters
   */
  static isTeluguText(text: string): boolean {
    if (!text) return false;
    return /[\u0C00-\u0C7F]/.test(text);
  }

  /**
   * Transliterate Telugu script into English (Roman alphabet)
   */
  static teluguToEnglish(text: string): string {
    if (!text) return '';
    let result = '';
    const len = text.length;

    let capitalizeNext = true;

    for (let i = 0; i < len; i++) {
      const ch = text[i];

      if (ch === '\n' || ch === '.') {
        capitalizeNext = true;
        result += ch;
        continue;
      }

      let syllable = '';

      if (TELUGU_VOWELS[ch]) {
        syllable = TELUGU_VOWELS[ch];
      } else if (TELUGU_CONSONANTS[ch]) {
        const next = i + 1 < len ? text[i + 1] : null;
        if (next === VIRAMA) {
          syllable = TELUGU_CONSONANTS[ch];
          i++; // skip virama
        } else if (next && TELUGU_MATRAS[next]) {
          syllable = TELUGU_CONSONANTS[ch] + TELUGU_MATRAS[next];
          i++; // skip matra
        } else {
          syllable = TELUGU_CONSONANTS[ch] + 'a';
        }
      } else if (ch === ANUSVARA) {
        syllable = 'm';
      } else if (ch === VISARGA) {
        syllable = 'h';
      } else {
        result += ch;
        continue;
      }

      if (capitalizeNext && syllable.length > 0 && /[a-zA-Z]/.test(syllable[0])) {
        syllable = syllable.charAt(0).toUpperCase() + syllable.slice(1);
        capitalizeNext = false;
      }

      result += syllable;
    }

    return result;
  }

  /**
   * Transliterate Telugu script into other Indic scripts (Devanagari, Kannada, Malayalam, Tamil)
   */
  static teluguToIndic(text: string, targetLang: 'hi' | 'mr' | 'kn' | 'ml' | 'ta'): string {
    if (!text) return '';

    if (targetLang === 'ta') {
      let out = '';
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        out += TELUGU_TO_TAMIL[ch] || ch;
      }
      return out;
    }

    // Unicode block offsets relative to 0x0C00 (Telugu)
    let targetOffset = 0x0900; // Devanagari (Hindi, Marathi)
    if (targetLang === 'kn') targetOffset = 0x0C80;
    if (targetLang === 'ml') targetOffset = 0x0D00;

    let out = '';
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if (code >= 0x0C01 && code <= 0x0C56) {
        const rel = code - 0x0C00;
        out += String.fromCharCode(targetOffset + rel);
      } else {
        out += text[i];
      }
    }
    return out;
  }

  /**
   * Master function to transliterate Telugu text into any target language
   */
  static transliterateFromTelugu(text: string, targetLang: SupportedLanguage): string {
    if (!text || !this.isTeluguText(text)) return text;

    if (targetLang === 'te') {
      return text;
    }

    if (targetLang === 'en') {
      return this.teluguToEnglish(text);
    }

    if (targetLang === 'hi' || targetLang === 'mr' || targetLang === 'kn' || targetLang === 'ml' || targetLang === 'ta') {
      return this.teluguToIndic(text, targetLang);
    }

    return text;
  }
}
