import { SupportedLanguage } from '../locales';
import { WorshipSong } from './FirestoreService';
import { TransliterationService } from './TransliterationService';

export const CANONICAL_SONG_CATEGORIES = [
  'All',
  'Stuthi Songs',
  'Aradhana Songs',
  'Offering Songs',
  'Special Songs',
  'Gospel Songs',
  'Youth Songs',
  'Christmas Songs',
  'Easter Songs',
  'Marriage Songs',
  'Thanksgiving Songs',
  'Other'
];

export const CATEGORY_TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    'All': 'All Songs',
    'All Songs': 'All Songs',
    'Stuthi Songs': 'Sthuthi Songs',
    'Sthuthi Songs': 'Sthuthi Songs',
    'Aradhana Songs': 'Aradhana Songs',
    'Offering Songs': 'Offering Songs',
    'Special Songs': 'Special Songs',
    'Gospel Songs': 'Gospel Songs',
    'Youth Songs': 'Youth Songs',
    'Christmas Songs': 'Christmas Songs',
    'Easter Songs': 'Easter Songs',
    'Marriage Songs': 'Marriage Songs',
    'Thanksgiving Songs': 'Thanksgiving Songs',
    'Other': 'Other',
    'Theme Songs': 'Theme Songs'
  },
  te: {
    'All': 'అన్ని కీర్తనలు',
    'All Songs': 'అన్ని కీర్తనలు',
    'Stuthi Songs': 'స్తుతి కీర్తనలు',
    'Sthuthi Songs': 'స్తుతి కీర్తనలు',
    'Aradhana Songs': 'ఆరాధన కీర్తనలు',
    'Offering Songs': 'కానుకల కీర్తనలు',
    'Special Songs': 'ప్రత్యేక కీర్తనలు',
    'Gospel Songs': 'సువార్త కీర్తనలు',
    'Youth Songs': 'యవ్వనస్థుల కీర్తనలు',
    'Christmas Songs': 'క్రిస్మస్ కీర్తనలు',
    'Easter Songs': 'ఈస్టర్ కీర్తనలు',
    'Marriage Songs': 'వివాహ కీర్తనలు',
    'Thanksgiving Songs': 'కృతజ్ఞతా కీర్తనలు',
    'Other': 'ఇతరము',
    'Theme Songs': 'థీమ్ కీర్తనలు'
  },
  hi: {
    'All': 'सभी गीत',
    'All Songs': 'सभी गीत',
    'Stuthi Songs': 'स्तुति गीत',
    'Sthuthi Songs': 'स्तुति गीत',
    'Aradhana Songs': 'आराधना गीत',
    'Offering Songs': 'दान के गीत',
    'Special Songs': 'विशेष गीत',
    'Gospel Songs': 'सुसमाचार गीत',
    'Youth Songs': 'युवा गीत',
    'Christmas Songs': 'क्रिसमस गीत',
    'Easter Songs': 'ईस्टर गीत',
    'Marriage Songs': 'विवाह गीत',
    'Thanksgiving Songs': 'धन्यवाद गीत',
    'Other': 'अन्य',
    'Theme Songs': 'थीम गीत'
  },
  ta: {
    'All': 'அனைத்துப் பாடல்கள்',
    'All Songs': 'அனைத்துப் பாடல்கள்',
    'Stuthi Songs': 'துதிப் பாடல்கள்',
    'Sthuthi Songs': 'துதிப் பாடல்கள்',
    'Aradhana Songs': 'ஆராதனைப் பாடல்கள்',
    'Offering Songs': 'காணிக்கைப் பாடல்கள்',
    'Special Songs': 'சிறப்புப் பாடல்கள்',
    'Gospel Songs': 'சுவிசேஷப் பாடல்கள்',
    'Youth Songs': 'வாலிபர் பாடல்கள்',
    'Christmas Songs': 'கிறிஸ்துமஸ் பாடல்கள்',
    'Easter Songs': 'ஈஸ்டர் பாடல்கள்',
    'Marriage Songs': 'திருமணப் பாடல்கள்',
    'Thanksgiving Songs': 'நன்றிப் பாடல்கள்',
    'Other': 'மற்றவை',
    'Theme Songs': 'தீம் பாடல்கள்'
  },
  mr: {
    'All': 'सर्व गीते',
    'All Songs': 'सर्व गीते',
    'Stuthi Songs': 'स्तुती गीते',
    'Sthuthi Songs': 'स्तुती गीते',
    'Aradhana Songs': 'आराधना गीते',
    'Offering Songs': 'अर्पणाची गीते',
    'Special Songs': 'विशेष गीते',
    'Gospel Songs': 'सुवार्ता गीते',
    'Youth Songs': 'तरुणांची गीते',
    'Christmas Songs': 'नाताळ गीते',
    'Easter Songs': 'ईस्टर गीते',
    'Marriage Songs': 'विवाह गीते',
    'Thanksgiving Songs': 'कृतज्ञता गीते',
    'Other': 'इतर',
    'Theme Songs': 'थीम गीते'
  },
  ml: {
    'All': 'എല്ലാ ഗാനങ്ങളും',
    'All Songs': 'എല്ലാ ഗാനങ്ങളും',
    'Stuthi Songs': 'സ്തുതി ഗാനങ്ങൾ',
    'Sthuthi Songs': 'സ്തുതി ഗാനങ്ങൾ',
    'Aradhana Songs': 'ആരാധനാ ഗാനങ്ങൾ',
    'Offering Songs': 'സമർപ്പണ ഗാനങ്ങൾ',
    'Special Songs': 'പ്രത്യേക ഗാനങ്ങൾ',
    'Gospel Songs': 'സുവിശേഷ ഗാനങ്ങൾ',
    'Youth Songs': 'യുവജന ഗാനങ്ങൾ',
    'Christmas Songs': 'ക്രിസ്മസ് ഗാനങ്ങൾ',
    'Easter Songs': 'ഈസ്റ്റർ ഗാനങ്ങൾ',
    'Marriage Songs': 'വിവാഹ ഗാനങ്ങൾ',
    'Thanksgiving Songs': 'കൃതജ്ഞതാ ഗാനങ്ങൾ',
    'Other': 'മറ്റുള്ളവ',
    'Theme Songs': 'തീം ഗാനങ്ങൾ'
  },
  kn: {
    'All': 'ಎಲ್ಲಾ ಹಾಡುಗಳು',
    'All Songs': 'ಎಲ್ಲಾ ಹಾಡುಗಳು',
    'Stuthi Songs': 'ಸ್ತುತಿ ಹಾಡುಗಳು',
    'Sthuthi Songs': 'ಸ್ತುತಿ ಹಾಡುಗಳು',
    'Aradhana Songs': 'ಆರಾಧನಾ ಹಾಡುಗಳು',
    'Offering Songs': 'ಕಾಣಿಕೆ ಹಾಡುಗಳು',
    'Special Songs': 'ವಿಶೇಷ ಹಾಡುಗಳು',
    'Gospel Songs': 'ಸುವಾರ್ತೆ ಹಾಡುಗಳು',
    'Youth Songs': 'ಯುವಜನರ ಹಾಡುಗಳು',
    'Christmas Songs': 'ಕ್ರಿಸ್ಮಸ್ ಹಾಡುಗಳು',
    'Easter Songs': 'ಈಸ್ಟರ್ ಹಾಡುಗಳು',
    'Marriage Songs': 'ವಿವಾಹ ಹಾಡುಗಳು',
    'Thanksgiving Songs': 'ಕೃತಜ್ಞತಾ ಹಾಡುಗಳು',
    'Other': 'ಇತರೆ',
    'Theme Songs': 'ಥೀಮ್ ಹಾಡುಗಳು'
  }
};

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  en: 'English',
  te: 'తెలుగు',
  hi: 'हिन्दी',
  ta: 'தமிழ்',
  mr: 'मराठी',
  ml: 'മലയാളം',
  kn: 'ಕನ್ನಡ'
};

export interface SongLyricsResult {
  lyrics: string;
  langCode: SupportedLanguage;
  langName: string;
  isFallback: boolean;
  isTransliterated: boolean;
  originalLang?: SupportedLanguage;
}

export class SongLanguageHelper {
  /**
   * Get localized category name from canonical category name
   */
  static getLocalizedCategory(canonicalCategory: string, lang: SupportedLanguage): string {
    const langDict = CATEGORY_TRANSLATIONS[lang] || CATEGORY_TRANSLATIONS.en;
    if (langDict[canonicalCategory]) {
      return langDict[canonicalCategory];
    }
    // Handle multi-category strings like "Stuthi Songs; Aradhana Songs"
    if (canonicalCategory.includes(';')) {
      return canonicalCategory
        .split(';')
        .map(c => c.trim())
        .filter(Boolean)
        .map(c => langDict[c] || c)
        .join(' · ');
    }
    return canonicalCategory;
  }

  /**
   * Get primary and secondary song titles for a given language
   */
  static getSongTitle(song: WorshipSong, lang: SupportedLanguage): { primary: string; secondary?: string } {
    if (!song) return { primary: '' };

    // Check language-specific title fields
    const langKey = lang.charAt(0).toUpperCase() + lang.slice(1);
    const specificTitle = (song as any)[`title${langKey}`] ||
      (lang === 'te' ? song.titleTe : undefined) ||
      (lang === 'en' ? (song as any).titleEn : undefined) ||
      song.translations?.[lang]?.title;

    if (lang === 'te') {
      // Primary should be Telugu script
      const primary = song.titleTe || specificTitle || (song.title && TransliterationService.isTeluguText(song.title) ? song.title : '');
      if (primary) {
        const secondary = (song.title && song.title !== primary) ? song.title : undefined;
        return { primary, secondary };
      }
      return { primary: song.title || '', secondary: undefined };
    }

    if (lang === 'en') {
      // Primary should be English Roman script
      let primary = (song as any).titleEn || specificTitle || '';
      if (!primary && song.title && !TransliterationService.isTeluguText(song.title)) {
        primary = song.title;
      }
      if (!primary && song.titleTe) {
        primary = TransliterationService.teluguToEnglish(song.titleTe);
      }
      if (!primary) {
        primary = song.title || '';
      }

      const secondary = (song.titleTe && song.titleTe !== primary) ? song.titleTe : undefined;
      return { primary, secondary };
    }

    // For other languages: hi, ta, mr, ml, kn
    if (specificTitle) {
      const secondary = song.title || song.titleTe;
      return { primary: specificTitle, secondary: secondary !== specificTitle ? secondary : undefined };
    }

    // If song has Telugu title, transliterate to target Indic script
    if (song.titleTe && TransliterationService.isTeluguText(song.titleTe)) {
      const primary = TransliterationService.transliterateFromTelugu(song.titleTe, lang);
      const secondary = song.title || song.titleTe;
      return { primary, secondary: secondary !== primary ? secondary : undefined };
    }

    // Fallback: Default title
    return {
      primary: song.title || song.titleTe || '',
      secondary: song.titleTe && song.titleTe !== song.title ? song.titleTe : undefined
    };
  }

  /**
   * Get available languages that can be selected in the lyrics viewer
   */
  static getAvailableSongLanguages(song: WorshipSong, activeAppLang?: SupportedLanguage): { code: SupportedLanguage; name: string }[] {
    if (!song) return [];
    const available: { code: SupportedLanguage; name: string }[] = [];

    const addLang = (code: SupportedLanguage) => {
      if (!available.some(a => a.code === code)) {
        available.push({ code, name: LANGUAGE_LABELS[code] });
      }
    };

    // Check specific fields
    const allLangs: SupportedLanguage[] = ['en', 'te', 'hi', 'ta', 'mr', 'ml', 'kn'];
    for (const code of allLangs) {
      const langKey = code.charAt(0).toUpperCase() + code.slice(1);
      const lyrics = (song as any)[`lyrics${langKey}`] ||
        (code === 'te' ? (song as any).lyricsTe : undefined) ||
        (code === 'en' ? (song as any).lyricsEn : undefined) ||
        song.translations?.[code]?.lyrics;

      if (lyrics && lyrics.trim().length > 0) {
        addLang(code);
      }
    }

    // Analyze base lyrics
    const baseLyrics = song.lyrics || '';
    if (baseLyrics.trim().length > 0) {
      if (TransliterationService.isTeluguText(baseLyrics)) {
        // Base is Telugu
        addLang('te');
        // Transliterated English is always available for Telugu lyrics
        addLang('en');
        // If the user's active profile language is another Indic language, also offer that
        if (activeAppLang && activeAppLang !== 'te' && activeAppLang !== 'en') {
          addLang(activeAppLang);
        }
      } else {
        // Base is English / other
        addLang('en');
      }
    }

    return available;
  }

  /**
   * Get lyrics in selected language if available, or transliterate/fallback gracefully
   */
  static getSongLyrics(song: WorshipSong, lang: SupportedLanguage): SongLyricsResult {
    if (!song) {
      return {
        lyrics: '',
        langCode: lang,
        langName: LANGUAGE_LABELS[lang],
        isFallback: false,
        isTransliterated: false
      };
    }

    const langKey = lang.charAt(0).toUpperCase() + lang.slice(1);
    const specificLyrics = (song as any)[`lyrics${langKey}`] ||
      (lang === 'te' ? (song as any).lyricsTe : undefined) ||
      (lang === 'en' ? (song as any).lyricsEn : undefined) ||
      song.translations?.[lang]?.lyrics;

    // 1. Explicit translation exists for this language
    if (specificLyrics && specificLyrics.trim().length > 0) {
      return {
        lyrics: specificLyrics,
        langCode: lang,
        langName: LANGUAGE_LABELS[lang],
        isFallback: false,
        isTransliterated: false
      };
    }

    // 2. Process base lyrics
    const baseLyrics = (song.lyrics || '').trim();
    if (baseLyrics.length > 0) {
      const isBaseTelugu = TransliterationService.isTeluguText(baseLyrics);

      // If base is Telugu
      if (isBaseTelugu) {
        if (lang === 'te') {
          return {
            lyrics: baseLyrics,
            langCode: 'te',
            langName: 'తెలుగు',
            isFallback: false,
            isTransliterated: false
          };
        }

        if (lang === 'en') {
          // Provide English transliteration
          const transliterated = TransliterationService.teluguToEnglish(baseLyrics);
          return {
            lyrics: transliterated,
            langCode: 'en',
            langName: 'English',
            isFallback: false,
            isTransliterated: true,
            originalLang: 'te'
          };
        }

        // For other Indic languages (hi, mr, kn, ml, ta)
        const indicTrans = TransliterationService.transliterateFromTelugu(baseLyrics, lang);
        return {
          lyrics: indicTrans,
          langCode: lang,
          langName: LANGUAGE_LABELS[lang],
          isFallback: false,
          isTransliterated: true,
          originalLang: 'te'
        };
      }

      // If base is English (or other non-Telugu)
      if (lang === 'en') {
        return {
          lyrics: baseLyrics,
          langCode: 'en',
          langName: 'English',
          isFallback: false,
          isTransliterated: false
        };
      }

      // If user selected Telugu or another language, but song is only in English
      return {
        lyrics: baseLyrics,
        langCode: 'en',
        langName: 'English',
        isFallback: true,
        isTransliterated: false,
        originalLang: 'en'
      };
    }

    return {
      lyrics: '',
      langCode: lang,
      langName: LANGUAGE_LABELS[lang],
      isFallback: false,
      isTransliterated: false
    };
  }
}
