import { SupportedLanguage } from '../locales';

// Local Telugu Bible fallback (bundled offline JSON)
let LOCAL_TELUGU_BIBLE: any = null;
try {
  LOCAL_TELUGU_BIBLE = require('../../assets/telugu_bible.json');
} catch (e) {
  console.warn('Local Telugu Bible JSON not loaded:', e);
}

export interface BibleVerse {
  verse: number;
  text: string;
}

// 3-Letter USFM Book Codes (Canonical Order 0..65)
export const BIBLE_BOOK_USFM = [
  'GEN', 'EXO', 'LEV', 'NUM', 'DEU', 'JOS', 'JDG', 'RUT', '1SA', '2SA',
  '1KI', '2KI', '1CH', '2CH', 'EZR', 'NEH', 'EST', 'JOB', 'PSA', 'PRO',
  'ECC', 'SNG', 'ISA', 'JER', 'LAM', 'EZK', 'DAN', 'HOS', 'JOL', 'AMO',
  'OBA', 'JON', 'MIC', 'NAM', 'HAB', 'ZEP', 'HAG', 'ZEC', 'MAL',
  'MAT', 'MRK', 'LUK', 'JHN', 'ACT', 'ROM', '1CO', '2CO', 'GAL', 'EPH',
  'PHP', 'COL', '1TH', '2TH', '1TI', '2TI', 'TIT', 'PHM', 'HEB', 'JAS',
  '1PE', '2PE', '1JN', '2JN', '3JN', 'JUD', 'REV'
];

// Number of chapters per book (Genesis to Revelation, Index 0..65)
export const CHAPTER_COUNTS: number[] = [
  50, 40, 27, 36, 34, 24, 21, 4, 31, 24,
  22, 25, 29, 36, 10, 13, 10, 42, 150, 31,
  12, 8, 66, 52, 5, 48, 12, 14, 3, 9,
  1, 4, 7, 3, 3, 3, 2, 14, 4,
  28, 16, 24, 21, 28, 16, 16, 13, 6, 6,
  4, 4, 5, 3, 6, 4, 3, 1, 13, 5,
  5, 3, 5, 1, 1, 1, 22
];

// 66 Book Names for All 7 Supported Languages
export const BIBLE_BOOKS: Record<SupportedLanguage, { OT: string[]; NT: string[] }> = {
  en: {
    OT: [
      'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
      'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
      '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
      'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
      'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah', 'Lamentations',
      'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
      'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
      'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'
    ],
    NT: [
      'Matthew', 'Mark', 'Luke', 'John', 'Acts',
      'Romans', '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
      'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians', '1 Timothy',
      '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James',
      '1 Peter', '2 Peter', '1 John', '2 John', '3 John',
      'Jude', 'Revelation'
    ]
  },
  te: {
    OT: [
      'ఆదికాండము', 'నిర్గమకాండము', 'లేవీయకాండము', 'సంఖ్యాకాండము', 'ద్వితీయోపదేశకాండము',
      'యెహోషువ', 'న్యాయాధిపతులు', 'రూతు', '1 సమూయేలు', '2 సమూయేలు',
      '1 రాజులు', '2 రాజులు', '1 దినవృత్తాంతములు', '2 దినవృత్తాంతములు', 'ఎజ్రా',
      'నెహెమ్యా', 'ఎస్తేరు', 'యోబు', 'కీర్తనల గ్రంథము', 'సామెతలు',
      'ప్రసంగి', 'పరమగీతము', 'యెషయా', 'యిర్మియా', 'విలాపవాక్యములు',
      'యెహెజ్కేలు', 'దానియేలు', 'హోషేయ', 'యోవేలు', 'ఆమోసు',
      'ఓబద్యా', 'యోనా', 'మీకా', 'నహూము', 'హబక్కూకు',
      'జెఫన్యా', 'హగ్గయి', 'జెకర్యా', 'మలాకీ'
    ],
    NT: [
      'మత్తయి సువార్త', 'మార్కు సువార్త', 'లూకా సువార్త', 'యోహాను సువార్త', 'అపొస్తలుల కార్యములు',
      'రోమీయులకు వ్రాసిన పత్రిక', '1 కొరింథీయులకు', '2 కొరింథీయులకు', 'గలతీయులకు', 'ఎఫెసీయులకు',
      'ఫిలిప్పీయులకు', 'కొలొస్సయులకు', '1 థెస్సలొనీకయులకు', '2 థెస్సలొనీకయులకు', '1 తిమోతికి',
      '2 తిమోతికి', 'తీతుకు', 'ఫిలేమోనుకు', 'హెబ్రీయులకు', 'యాకోబు',
      '1 పేతురు', '2 పేతురు', '1 యోహాను', '2 యోహాను', '3 యోహాను',
      'యూదా', 'ప్రకటన గ్రంథము'
    ]
  },
  hi: {
    OT: [
      'उत्पत्ति', 'निर्गमन', 'लैव्यव्यवस्था', 'गिनती', 'व्यवस्थाविवरण',
      'यहोशू', 'न्यायियों', 'रूत', '1 शमूएल', '2 शमूएल',
      '1 राजाओं', '2 राजाओं', '1 इतिहास', '2 इतिहास', 'एज्रा',
      'नहेम्याह', 'एस्तेर', 'अय्यूब', 'भजन संहिता', 'नीतिवचन',
      'सभोपदेशक', 'श्रेष्ठगीत', 'यशायाह', 'यिर्मयाह', 'विलापगीत',
      'यहेजकेल', 'दानिय्येल', 'होशे', 'योएल', 'आमोस',
      'ओबद्याह', 'योना', 'मीका', 'नहूम', 'हबक्कूक',
      'सपन्याह', 'हाग्गै', 'जकर्याह', 'मलाकी'
    ],
    NT: [
      'मत्ती', 'मरकुस', 'लूका', 'यूहन्ना', 'प्रेरितों के काम',
      'रोमियों', '1 कुरिन्थियों', '2 कुरिन्थियों', 'गलातियों', 'इफिसियों',
      'फिलिप्पियों', 'कुलुस्सियों', '1 थिस्सलुनीकियों', '2 थिस्सलुनीकियों', '1 तीमुथियुस',
      '2 तीमुथियुस', 'तीतुस', 'फिलेमोन', 'इब्रानियों', 'याकूब',
      '1 पतरस', '2 पतरस', '1 यूहन्ना', '2 यूहन्ना', '3 यूहन्ना',
      'यहूदा', 'प्रकाशितवाक्य'
    ]
  },
  ta: {
    OT: [
      'ஆதியாகமம்', 'யாத்திராகமம்', 'லேவியராகமம்', 'எண்ணாகமம்', 'உபாகமம்',
      'யோசுவா', 'நியாயாதிபதிகள்', 'ரூத்', '1 சாமுவேல்', '2 சாமுவேல்',
      '1 இராஜாக்கள்', '2 இராஜாக்கள்', '1 நாளாகமம்', '2 நாளாகமம்', 'எஸ்றா',
      'நெகேமியா', 'எஸ்தர்', 'யோபு', 'சங்கீதம்', 'நீதிமொழிகள்',
      'பிரசங்கி', 'உன்னதப்பாட்டு', 'ஏசாயா', 'எரேமியா', 'புலம்பல்',
      'எசேக்கியேல்', 'தானியேல்', 'ஓசியா', 'யோவேல்', 'ஆமோஸ்',
      'ஒபதியா', 'யோனா', 'மீகா', 'நாகூம்', 'ஆபகூக்',
      'செப்பனியா', 'ஆகாய்', 'சகரியா', 'மல்கியா'
    ],
    NT: [
      'மத்தேயு', 'மாற்கு', 'லூக்கா', 'யோவான்', 'அப்போஸ்தலர்',
      'ரோமர்', '1 கொரிந்தியர்', '2 கொரிந்தியர்', 'கலாத்தியர்', 'எபேசியர்',
      'பிலிப்பியர்', 'கொலோசெயர்', '1 தெசலோனிக்கேயர்', '2 தெசலோனிக்கேயர்', '1 தீமோத்தேயு',
      '2 தீமோத்தேயு', 'தீத்து', 'பிலேமோன்', 'எபிரெயர்', 'யாக்கோபு',
      '1 பேதுரு', '2 பேதுரு', '1 யோவான்', '2 யோவான்', '3 யோவான்',
      'யூதா', 'வெளிப்படுத்தின விசேஷம்'
    ]
  },
  mr: {
    OT: [
      'उत्पत्ती', 'निर्गम', 'लेवीय', 'गणना', 'अनुवाद',
      'यहोशुआ', 'शास्ते', 'रूथ', '1 शमुवेल', '2 शमुवेल',
      '1 राजे', '2 राजे', '1 इतिहास', '2 इतिहास', 'एज्रा',
      'नहेम्याह', 'एस्तेर', 'इय्योब', 'स्तोत्रसंहिता', 'नीतिसूत्रे',
      'उपदेशक', 'गीतरत्न', 'यशायाह', 'यिर्मयाह', 'विलापगीत',
      'यहेज्केल', 'दानीएल', 'होशेय', 'योएल', 'आमोस',
      'ओबद्याह', 'योनाह', 'मीखाह', 'नहूम', 'हबक्कूक',
      'सफन्याह', 'हाग्गय', 'जखर्‍याह', 'मलाखी'
    ],
    NT: [
      'मत्तय', 'मार्क', 'लूक', 'योहान', 'प्रेषित',
      'रोमकरांस', '1 करिंथकरांस', '2 करिंथकरांस', 'गलातीकरांस', 'इफिसकरांस',
      'फिलिप्पैकरांस', 'कलस्सैकरांस', '1 थेस्सलनीकाकरांस', '2 थेस्सलनीकाकरांस', '1 तीमथ्य',
      '2 तीमथ्य', 'तीता', 'फिलेमोन', 'इब्री', 'याकोब',
      '1 पेत्र', '2 पेत्र', '1 योहान', '2 योहान', '3 योहान',
      'यहूदा', 'प्रकटीकरण'
    ]
  },
  ml: {
    OT: [
      'ഉൽപ്പത്തി', 'പുറപ്പാട്', 'ലേവ്യ', 'സംഖ്യാപുസ്തകം', 'ആവർത്തനം',
      'യോശുവ', 'ന്യായാധിപന്മാർ', 'രൂത്ത്', '1 ശമുവേൽ', '2 ശമുവേൽ',
      '1 രാജാക്കന്മാർ', '2 രാജാക്കന്മാർ', '1 ദിനവൃത്താന്തം', '2 ദിനവൃത്താന്തം', 'എസ്രാ',
      'നെഹെമ്യാവ്', 'എസ്ഥേർ', 'ഇയ്യോബ്', 'സങ്കീർത്തനങ്ങൾ', 'സദൃശവാക്യങ്ങൾ',
      'സഭാപ്രസംഗി', 'ഉത്തമഗീതം', 'യെശയ്യാവ്', 'യിരെമ്യാവ്', 'വിലാപങ്ങൾ',
      'യഹെസ്കേൽ', 'ദാനീയേൽ', 'ഹോശേയ', 'യോവേൽ', 'ആമോസ്',
      'ഓബദ്യാവ്', 'യോനാ', 'മീഖാ', 'നഹൂം', 'ഹബക്കൂക്ക്',
      'സെഫന്യാവ്', 'ഹഗ്ഗായി', 'സെഖര്യാവ്', 'മലാഖി'
    ],
    NT: [
      'മത്തായി', 'മർക്കോസ്', 'ലൂക്കോസ്', 'യോഹന്നാൻ', 'പ്രവൃത്തികൾ',
      'റോമർ', '1 കൊരിന്ത്യർ', '2 കൊരിന്ത്യർ', 'ഗലാത്യർ', 'എഫെസ്യർ',
      'ഫിലിപ്പിയർ', 'കൊലോസ്യർ', '1 തെസ്സലോനിക്യർ', '2 തെസ്സലോനിക്യർ', '1 തിമൊഥെയൊസ്',
      '2 തിമൊഥെയൊസ്', 'തീത്തൊസ്', 'ഫിലേമോൻ', 'എബ്രായർ', 'യാക്കോബ്',
      '1 പത്രോസ്', '2 പത്രോസ്', '1 യോഹന്നാൻ', '2 യോഹന്നാൻ', '3 യോഹന്നാൻ',
      'യൂദാ', 'വെളിപ്പാട്'
    ]
  },
  kn: {
    OT: [
      'ಆದಿಕಾಂಡ', 'ವಿಮೋಚನಕಾಂಡ', 'ಯಾಜಕಕಾಂಡ', 'ಅರಣ್ಯಕಾಂಡ', 'ಧರ್ಮೋಪದೇಶಕಾಂಡ',
      'ಯೆಹೋಶುವ', 'ನ್ಯಾಯಸ್ಥಾಪಕರು', 'ರೂತಳು', '1 ಸಮುವೇಲನು', '2 ಸಮುವೇಲನು',
      '1 ಅರಸುಗಳು', '2 ಅರಸುಗಳು', '1 ಪೂರ್ವಕಾಲದ ವೃತ್ತಾಂತಗಳು', '2 ಪೂರ್ವಕಾಲದ ವೃತ್ತಾಂತಗಳು', 'ಎಜ್ರನು',
      'ನೆಹೆಮಿಯನು', 'ಎಸ್ತೇರಳು', 'ಯೋಬನು', 'ಕೀರ್ತನೆಗಳು', 'ಜ್ಞಾನೋಕ್ತಿಗಳು',
      'ಉಪದೇಶಕನು', 'ಪರಮಗೀತ', 'ಯೆಶಾಯನು', 'ಯೆರೆಮಿಯನು', 'ಪ್ರಲಾಪಗಳು',
      'ಯೆಹೆಜ್ಕೇಲನು', 'ದಾನಿಯೇಲನು', 'ಹೋಶೇಾಯನು', 'ಯೋವೇಲನು', 'ಆಮೋಸನು',
      'ಓಬದ್ಯನು', 'ಯೋನನು', 'ಮೀಕಾಯನು', 'ನಹೂಮನು', 'ಹಬಕ್ಕೂಕನು',
      'ಚೆಫನ್ಯನು', 'ಹಗ್ಗಾಯನು', 'ಜೆಕರ್ಯನು', 'ಮಲಾಕಿಯನು'
    ],
    NT: [
      'ಮತ್ತಾಯನು', 'ಮಾರ್ಕನು', 'ಲೂಕನು', 'ಯೋಹಾನನು', 'ಅಪೊಸ್ತಲರ ಕೃತ್ಯಗಳು',
      'ರೋಮಾಪುರದವರಿಗೆ', '1 ಕೊರಿಂಥದವರಿಗೆ', '2 ಕೊರಿಂಥದವರಿಗೆ', 'ಗಲಾತ್ಯದವರಿಗೆ', 'ಎಫೆಸದವರಿಗೆ',
      'ಫಿಲಿಪ್ಪಿಯವರಿಗೆ', 'ಕೊಲೊಸ್ಸೆಯವರಿಗೆ', '1 ಥೆಸಲೋನಿಕದವರಿಗೆ', '2 ಥೆಸಲೋನಿಕದವರಿಗೆ', '1 ತಿಮೊಥೆಯನಿಗೆ',
      '2 ತಿಮೊಥೆಯನಿಗೆ', 'ತೀತನಿಗೆ', 'ಫಿಲೆಮೋನನಿಗೆ', 'ಇಬ್ರಿಯರಿಗೆ', 'ಯಾಕೋಬನು',
      '1 ಪೇತ್ರನು', '2 ಪೇತ್ರನು', '1 ಯೋಹಾನನು', '2 ಯೋಹಾನನು', '3 ಯೋಹಾನನು',
      'ಯೂದನು', 'ಪ್ರಕಟಣೆ'
    ]
  }
};

// Flattened lists of all 66 books per language
export const ALL_BOOKS_BY_LANG: Record<SupportedLanguage, string[]> = {
  en: [...BIBLE_BOOKS.en.OT, ...BIBLE_BOOKS.en.NT],
  te: [...BIBLE_BOOKS.te.OT, ...BIBLE_BOOKS.te.NT],
  hi: [...BIBLE_BOOKS.hi.OT, ...BIBLE_BOOKS.hi.NT],
  ta: [...BIBLE_BOOKS.ta.OT, ...BIBLE_BOOKS.ta.NT],
  mr: [...BIBLE_BOOKS.mr.OT, ...BIBLE_BOOKS.mr.NT],
  ml: [...BIBLE_BOOKS.ml.OT, ...BIBLE_BOOKS.ml.NT],
  kn: [...BIBLE_BOOKS.kn.OT, ...BIBLE_BOOKS.kn.NT]
};

// English abbreviations map for quick reference searching
const EN_ABBREVIATIONS: Record<string, number> = {
  gen: 0, genesis: 0,
  ex: 1, exo: 1, exodus: 1,
  lev: 2, leviticus: 2,
  num: 3, numbers: 3,
  deut: 4, dt: 4, de: 4, deuteronomy: 4,
  josh: 5, jos: 5, joshua: 5,
  judg: 6, jdg: 6, judges: 6,
  rut: 7, ruth: 7,
  '1sam': 8, '1samuel': 8, '1s': 8,
  '2sam': 9, '2samuel': 9, '2s': 9,
  '1ki': 10, '1kings': 10, '1k': 10,
  '2ki': 11, '2kings': 11, '2k': 11,
  '1chr': 12, '1chronicles': 12, '1ch': 12,
  '2chr': 13, '2chronicles': 13, '2ch': 13,
  ezr: 14, ezra: 14,
  neh: 15, nehemiah: 15,
  est: 16, esther: 16,
  job: 17,
  ps: 18, psa: 18, psalms: 18, psalm: 18,
  prov: 19, pr: 19, proverbs: 19,
  eccl: 20, ecc: 20, ecclesiastes: 20,
  song: 21, songs: 21, 'songofsolomon': 21,
  isa: 22, isaiah: 22,
  jer: 23, jeremiah: 23,
  lam: 24, lamentations: 24,
  ezek: 25, eze: 25, ezekiel: 25,
  dan: 26, daniel: 26,
  hos: 27, hosea: 27,
  joe: 28, joel: 28,
  amo: 29, amos: 29,
  ob: 30, obad: 30, obadiah: 30,
  jon: 31, jonah: 31,
  mic: 32, micah: 32,
  nah: 33, nahum: 33,
  hab: 34, habakkuk: 34,
  zeph: 35, zep: 35, zephaniah: 35,
  hag: 36, haggai: 36,
  zech: 37, zec: 37, zechariah: 37,
  mal: 38, malachi: 38,
  matt: 39, mat: 39, matthew: 39, mt: 39,
  mk: 40, mar: 40, mark: 40,
  lk: 41, luk: 41, luke: 41,
  jn: 42, joh: 42, john: 42,
  ac: 43, act: 43, acts: 43,
  rom: 44, romans: 44,
  '1cor': 45, '1corinthians': 45,
  '2cor': 46, '2corinthians': 46,
  gal: 47, galatians: 47,
  eph: 48, ephesians: 48,
  phil: 49, php: 49, philippians: 49,
  col: 50, colossians: 50,
  '1thess': 51, '1thessalonians': 51,
  '2thess': 52, '2thessalonians': 52,
  '1tim': 53, '1timothy': 53,
  '2tim': 54, '2timothy': 54,
  tit: 55, titus: 55,
  philem: 56, phm: 56, philemon: 56,
  heb: 57, hebrews: 57,
  jas: 58, james: 58,
  '1pet': 59, '1peter': 59,
  '2pet': 60, '2peter': 60,
  '1jn': 61, '1john': 61,
  '2jn': 62, '2john': 62,
  '3jn': 63, '3john': 63,
  jud: 64, jude: 64,
  rev: 65, revelation: 65
};

export const BibleService = {
  /**
   * Get localized book name by index (0..65)
   */
  getBookName(bookIndex: number, lang: SupportedLanguage = 'en'): string {
    const list = ALL_BOOKS_BY_LANG[lang] || ALL_BOOKS_BY_LANG.en;
    if (bookIndex >= 0 && bookIndex < list.length) {
      return list[bookIndex];
    }
    return ALL_BOOKS_BY_LANG.en[bookIndex] || `Book ${bookIndex + 1}`;
  },

  /**
   * Resolve 0-based book index (0..65) from any book name, abbreviation, or localized name
   */
  getBookIndex(nameOrQuery: string): number {
    if (!nameOrQuery) return 0;
    const clean = nameOrQuery.trim().toLowerCase().replace(/\s+/g, '');

    // 1. Check English abbreviations map
    if (EN_ABBREVIATIONS[clean] !== undefined) {
      return EN_ABBREVIATIONS[clean];
    }

    // 2. Check each language's full book list
    const languages: SupportedLanguage[] = ['en', 'te', 'hi', 'ta', 'mr', 'ml', 'kn'];
    for (const l of languages) {
      const books = ALL_BOOKS_BY_LANG[l];
      for (let i = 0; i < books.length; i++) {
        const b = books[i].toLowerCase().replace(/\s+/g, '');
        if (b === clean || b.startsWith(clean) || clean.startsWith(b)) {
          return i;
        }
      }
    }

    return 0;
  },

  /**
   * Get total number of chapters in book (1..150)
   */
  getChapterCount(bookIndex: number): number {
    if (bookIndex >= 0 && bookIndex < CHAPTER_COUNTS.length) {
      return CHAPTER_COUNTS[bookIndex];
    }
    return 20;
  },

  /**
   * Determine whether a book index is Old Testament or New Testament
   */
  getTestament(bookIndex: number): 'OT' | 'NT' {
    return bookIndex < 39 ? 'OT' : 'NT';
  },

  /**
   * Get standard USFM 3-letter code (e.g. 'GEN', 'JHN')
   */
  getUSFM(bookIndex: number): string {
    return BIBLE_BOOK_USFM[bookIndex] || 'GEN';
  },

  /**
   * Get appropriate TTS speech locale code for expo-speech
   */
  getTTSLanguageCode(lang: SupportedLanguage): string {
    switch (lang) {
      case 'te': return 'te-IN';
      case 'hi': return 'hi-IN';
      case 'ta': return 'ta-IN';
      case 'kn': return 'kn-IN';
      case 'ml': return 'ml-IN';
      case 'mr': return 'mr-IN';
      case 'en':
      default:
        return 'en-US';
    }
  },

  /**
   * Clean scripture text from Strong's numbers, notes, and html tags
   */
  cleanVerseText(text: string): string {
    if (!text) return '';
    return text
      .replace(/<S>\d*<\/S>/gi, '')
      .replace(/<sup[^>]*>.*?<\/sup>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  },

  /**
   * Fetch chapter verses in the requested language
   */
  async fetchChapterVerses(
    bookIndex: number,
    chapter: number,
    lang: SupportedLanguage,
    englishVersion: string = 'KJV'
  ): Promise<BibleVerse[]> {
    const bookId = bookIndex + 1;
    const usfm = BIBLE_BOOK_USFM[bookIndex] || 'GEN';

    // ─── 1. Telugu: Try local bundled JSON first for instant offline access ───
    if (lang === 'te') {
      try {
        if (LOCAL_TELUGU_BIBLE?.Book?.[bookIndex]?.Chapter?.[chapter - 1]?.Verse) {
          const rawVerses = LOCAL_TELUGU_BIBLE.Book[bookIndex].Chapter[chapter - 1].Verse;
          return rawVerses.map((v: any, i: number) => ({
            verse: i + 1,
            text: v.Verse
          }));
        }
      } catch (e) {
        console.warn('Local Telugu Bible read failed, falling back to online API', e);
      }
    }

    // ─── 2. Marathi: Fetch from helloao API (mar_cbi / mar_irv) ───
    if (lang === 'mr') {
      const mrTranslations = ['mar_cbi', 'mar_irv'];
      for (const tid of mrTranslations) {
        try {
          const url = `https://bible.helloao.org/api/${tid}/${usfm}/${chapter}.json`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            if (data?.chapter?.content && Array.isArray(data.chapter.content)) {
              const verses: BibleVerse[] = data.chapter.content
                .filter((c: any) => c.type === 'verse')
                .map((c: any) => ({
                  verse: c.number,
                  text: Array.isArray(c.content) ? c.content.filter((s: any) => typeof s === 'string').join(' ') : String(c.content || '')
                }));
              if (verses.length > 0) return verses;
            }
          }
        } catch (e) {
          console.warn(`Marathi fetch from ${tid} failed:`, e);
        }
      }
    }

    // ─── 3. English, Hindi, Tamil, Kannada, Malayalam (or Telugu fallback): Bolls API ───
    const versionMap: Record<SupportedLanguage, string[]> = {
      en: [englishVersion || 'KJV', 'KJV', 'ASV'],
      hi: ['HIOV'],
      ta: ['TBSI', 'TAMBL98', 'TAMOVR'],
      kn: ['KNCL', 'ERVKN'],
      ml: ['MOV'],
      te: ['TELBSI', 'BSITEL'],
      mr: []
    };

    const candidateVersions = versionMap[lang] || [];
    for (const v of candidateVersions) {
      try {
        const url = `https://bolls.life/get-text/${v}/${bookId}/${chapter}/`;
        const res = await fetch(url, { headers: { Accept: 'application/json' } });
        if (res.ok) {
          const result = await res.json();
          if (Array.isArray(result) && result.length > 0) {
            return result.map((item: any) => ({
              verse: item.verse,
              text: BibleService.cleanVerseText(item.text)
            }));
          }
        }
      } catch (e) {
        console.warn(`Bolls fetch (${v}) failed:`, e);
      }
    }

    // ─── 4. Universal Online Fallback (helloao IRV translations) ───
    const helloaoFallbackMap: Record<SupportedLanguage, string> = {
      te: 'tel_irv',
      hi: 'HINIRV',
      ta: 'tam_irv',
      kn: 'kan_irv',
      ml: 'mal_bib',
      mr: 'mar_irv',
      en: 'BSB'
    };

    const fallbackTid = helloaoFallbackMap[lang];
    if (fallbackTid) {
      try {
        const url = `https://bible.helloao.org/api/${fallbackTid}/${usfm}/${chapter}.json`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data?.chapter?.content && Array.isArray(data.chapter.content)) {
            const verses: BibleVerse[] = data.chapter.content
              .filter((c: any) => c.type === 'verse')
              .map((c: any) => ({
                verse: c.number,
                text: Array.isArray(c.content) ? c.content.filter((s: any) => typeof s === 'string').join(' ') : String(c.content || '')
              }));
            if (verses.length > 0) return verses;
          }
        }
      } catch (e) {
        console.warn(`helloao fallback (${fallbackTid}) failed:`, e);
      }
    }

    throw new Error('Scripture could not be loaded. Please check your internet connection and try again.');
  },

  /**
   * Search verses across translations
   */
  async searchBible(
    query: string,
    lang: SupportedLanguage,
    filters?: {
      testament?: 'All' | 'Old' | 'New';
      bookIndex?: number | null;
      chapter?: number | null;
      verse?: number | null;
    }
  ): Promise<any[]> {
    const q = query.trim();
    if (!q) return [];

    const activeTestament = filters?.testament || 'All';
    const activeBook = filters?.bookIndex ?? null;
    const activeChapter = filters?.chapter ?? null;
    const activeVerse = filters?.verse ?? null;

    // Filter checker
    const matchesFilter = (bIdx: number, cNum: number, vNum: number) => {
      if (activeTestament === 'Old' && bIdx >= 39) return false;
      if (activeTestament === 'New' && bIdx < 39) return false;
      if (activeBook !== null && bIdx !== activeBook) return false;
      if (activeChapter !== null && cNum !== activeChapter) return false;
      if (activeVerse !== null && vNum !== activeVerse) return false;
      return true;
    };

    // ─── 1. Telugu local search ───
    if (lang === 'te' && LOCAL_TELUGU_BIBLE?.Book) {
      const results: any[] = [];
      const books = LOCAL_TELUGU_BIBLE.Book;
      for (let b = 0; b < books.length; b++) {
        const chapters = books[b]?.Chapter || [];
        for (let c = 0; c < chapters.length; c++) {
          const verses = chapters[c]?.Verse || [];
          for (let v = 0; v < verses.length; v++) {
            if (!matchesFilter(b, c + 1, v + 1)) continue;
            const text: string = verses[v]?.Verse || '';
            if (text.includes(q)) {
              results.push({
                id: `te-${b + 1}-${c + 1}-${v + 1}`,
                bookIndex: b,
                book: BibleService.getBookName(b, 'te'),
                bookEn: BibleService.getBookName(b, 'en'),
                chapter: c + 1,
                verse: v + 1,
                text: text,
                highlight: q
              });
              if (results.length >= 60) return results;
            }
          }
        }
      }
      return results;
    }

    // ─── 2. Bolls Search API for English, Hindi, Tamil, Kannada, Malayalam ───
    const bollsTransMap: Record<string, string> = {
      en: 'KJV',
      hi: 'HIOV',
      ta: 'TBSI',
      kn: 'KNCL',
      ml: 'MOV'
    };

    const bollsVersion = bollsTransMap[lang];
    if (bollsVersion) {
      try {
        const url = `https://bolls.life/search/${bollsVersion}/?search=${encodeURIComponent(q)}&match_case=false&match_whole=false`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            return data
              .filter((item: any) => matchesFilter(item.book - 1, item.chapter, item.verse))
              .slice(0, 60)
              .map((item: any) => {
                const bIdx = item.book - 1;
                return {
                  id: `${lang}-${item.book}-${item.chapter}-${item.verse}`,
                  bookIndex: bIdx,
                  book: BibleService.getBookName(bIdx, lang),
                  bookEn: BibleService.getBookName(bIdx, 'en'),
                  chapter: item.chapter,
                  verse: item.verse,
                  text: BibleService.cleanVerseText(item.text),
                  highlight: q
                };
              });
          }
        }
      } catch (e) {
        console.warn(`Bolls search failed for ${lang}:`, e);
      }
    }

    return [];
  },

  /**
   * Translate / localize a reference string (e.g. "Psalms 78:52" -> "भजन संहिता 78:52")
   */
  getLocalizedReference(referenceStr: string, lang: SupportedLanguage = 'en'): string {
    if (!referenceStr) return '';
    if (lang === 'en') return referenceStr;
    const clean = referenceStr.trim();
    const match = clean.match(/^(.+?)\s+(\d+)\s*[:\.]\s*(\d+)(?:\s*[-–—]\s*(\d+))?$/);
    if (!match) return referenceStr;
    const [, rawBook, chapterStr, startVerseStr, endVerseStr] = match;
    const bookIndex = BibleService.getBookIndex(rawBook);
    const localizedBook = BibleService.getBookName(bookIndex, lang);
    return `${localizedBook} ${chapterStr}:${startVerseStr}${endVerseStr ? '-' + endVerseStr : ''}`;
  },

  /**
   * Fetch verse content and localized reference given a reference string (e.g. "Psalms 78:52" or "John 3:16")
   */
  async fetchVerseByReference(
    referenceStr: string,
    lang: SupportedLanguage
  ): Promise<{ verse: string; reference: string } | null> {
    if (!referenceStr) return null;
    const clean = referenceStr.trim();
    const match = clean.match(/^(.+?)\s+(\d+)\s*[:\.]\s*(\d+)(?:\s*[-–—]\s*(\d+))?$/);
    if (!match) return null;

    const [, rawBook, chapterStr, startVerseStr, endVerseStr] = match;
    const bookIndex = BibleService.getBookIndex(rawBook);
    const chapter = parseInt(chapterStr, 10);
    const startVerse = parseInt(startVerseStr, 10);
    const endVerse = endVerseStr ? parseInt(endVerseStr, 10) : undefined;

    const localizedReference = BibleService.getLocalizedReference(referenceStr, lang);

    try {
      const verses = await BibleService.fetchChapterVerses(bookIndex, chapter, lang);
      if (!verses || verses.length === 0) return null;

      if (endVerse && endVerse >= startVerse) {
        const range = verses.filter(v => v.verse >= startVerse && v.verse <= endVerse);
        if (range.length === 0) return null;
        const text = range.map(v => v.text).join(' ');
        return { verse: text, reference: localizedReference };
      } else {
        const single = verses.find(v => v.verse === startVerse);
        if (!single) return null;
        return { verse: single.text, reference: localizedReference };
      }
    } catch (e) {
      console.warn('[BibleService] Error in fetchVerseByReference:', e);
      return null;
    }
  }
};
