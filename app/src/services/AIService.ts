// ─── AI Engine Configuration ──────────────────────────────────────────────────
// Primary: Google Gemini Flash (Native Indic/Telugu quality, 100% free on Google AI Studio)
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_MODEL   = 'gemini-3.6-flash';
const GEMINI_URL     = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// Fallback: Groq (Ultra-fast failover if Gemini is unreachable)
const GROQ_API_KEY   = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const GROQ_MODEL     = 'qwen/qwen3.8-27b';
const GROQ_URL       = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `You are an expert biblical theologian and experienced pastor with deep knowledge of the entire Holy Bible. You write clean, elegant sermons for a mobile app:
- BIBLICALLY ACCURATE: Every Bible reference must be a real verse that genuinely exists. Never invent or approximate verses.
- CORRECTLY NAMED: Use exact, correct Bible book names (e.g. "1 Corinthians", "Philippians", "Ecclesiastes").
- BILINGUAL REFERENCES: Always write Bible references in BOTH English and Telugu side by side, e.g. "John 3:16 – యోహాను 3:16", "Psalm 23:1 – కీర్తనలు 23:1", "Romans 8:28 – రోమీయులకు 8:28".
- NO TABLES OR PIPES: NEVER output markdown tables, pipe characters (|), or grid columns. The mobile app cannot render tables. Use clean paragraphs and bullet points only.
- NO DUPLICATION: Never repeat a Bible verse, quote, or reference twice. State each scripture strictly once.
- NON-REPETITIVE: Each section must introduce new content. Never repeat a verse or point already made.
- WELL-STRUCTURED: Each of the 5 sections must be clearly distinct in purpose and content.
- PRACTICAL: Ground theological points in real-life application for modern Christian believers.`;

function buildUserPrompt(topic: string, language: string, category: string): string {
  return `Write an inspiring, well-structured sermon in ${language} on: "${topic}" for a ${category} gathering.

IMPORTANT FORMAT RULES:
- Do NOT use markdown tables or pipes (|).
- Do NOT repeat any scripture or verse twice. Mention each verse strictly once.
- Format each scripture as a simple, clean bullet point.

Structure:
# Sermon: [Creative Title in ${language}]

## 1. Introduction
1-2 paragraphs setting the biblical and spiritual context.

## 2. Key Scriptures
List 3 key Bible verses. Do NOT use tables or pipes. Format strictly as:
• **English Ref – Telugu Ref**
  "Full verse text in ${language}"
  Insight: Brief practical explanation in ${language}.

## 3. Main Message
### Point 1: [Core Biblical Truth]
Theological truth + practical takeaway.

### Point 2: [Core Biblical Truth]
Theological truth + practical takeaway.

### Point 3: [Core Biblical Truth]
Theological truth + practical takeaway.

## 4. Practical Application
3 actionable bullet points for daily Christian life.

## 5. Conclusion & Closing Prayer
One concluding paragraph and a heartfelt 2-3 sentence prayer in ${language}.`;
}

function cleanSermonText(text: string): string {
  if (!text) return '';
  const lines = text.split('\n');
  const cleanedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip table divider rows: |---|---|
    if (/^\|?(\s*[-:]+\s*\|?)+$/.test(line)) {
      continue;
    }

    // If it's a markdown table row with pipes
    if (line.startsWith('|') || (line.includes('|') && line.endsWith('|'))) {
      const cells = line
        .split('|')
        .map(c => c.trim())
        .filter(c => c.length > 0);

      // Skip table header row
      if (cells.some(c => /ref|verse|scripture|insight|explanation|reference/i.test(c))) {
        continue;
      }

      if (cells.length >= 2) {
        const ref = cells[0];
        let remaining = cells.slice(1);

        // If col 2 duplicates the verse from col 1 or has the same verse number
        const refVerseMatch = ref.match(/(\d?\s*[a-zA-Z]+\s*\d+:\d+)/);
        if (refVerseMatch && remaining.length > 1) {
          const verseNum = refVerseMatch[1].toLowerCase().replace(/\s+/g, '');
          if (remaining[0].toLowerCase().replace(/\s+/g, '').includes(verseNum) && ref.includes('—')) {
            remaining.shift();
          }
        }

        cleanedLines.push(`• ${ref}`);
        remaining.forEach(r => {
          cleanedLines.push(`  ${r}`);
        });
        continue;
      }
    }

    // Remove any remaining stray pipe symbols
    const cleanLine = line.replace(/\|/g, '').trim();
    if (cleanLine.length > 0) {
      cleanedLines.push(cleanLine);
    }
  }

  return cleanedLines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

export interface SermonParams {
  topic: string;
  category: string;
  language?: string;
  churchId: string;
}

export interface ContentImageParams {
  prompt: string;
  churchId: string;
  topic?: string;
  orientation?: 'Landscape' | 'Portrait' | 'Square';
  style?: string;
  contentType?: string;
  color?: string;
  excludeUrl?: string;
}

// ─── Per-session registry: track every URL already used this session ──────────
// This guarantees NO repeat until the entire category pool is exhausted.
const sessionUsedUrls: Set<string> = new Set();
// Track the very last returned URL for instant-repeat protection
let lastReturnedVisualUrl = '';

// ─── Expanded Curated Gallery ─────────────────────────────────────────────────
// Every category has 10+ images so the admin can click many times without repeats.
const CHURCH_VISUAL_GALLERY: Record<string, string[]> = {
  'bible': [
    'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=1280&q=85',
    'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=1280&q=85',
    'https://images.unsplash.com/photo-1544717305-2782549b5136?w=1280&q=85',
    'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=1280&q=85',
    'https://images.unsplash.com/photo-1509021436665-8f07db76c61?w=1280&q=85',
    'https://images.unsplash.com/photo-1519817914152-22d216bb9170?w=1280&q=85',
    'https://images.unsplash.com/photo-1535016120720-40c646be5580?w=1280&q=85',
    'https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=1280&q=85',
    'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=1280&q=85',
    'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=1280&q=85',
    'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=1280&q=85',
    'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1280&q=85',
  ],
  'communion': [
    'https://images.unsplash.com/photo-1510936111840-65e151ad71bb?w=1280&q=85',
    'https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=1280&q=85',
    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=1280&q=85',
    'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=1280&q=85',
    'https://images.unsplash.com/photo-1477281765962-ef34e8bb0967?w=1280&q=85',
    'https://images.unsplash.com/photo-1488345979593-09db0f85545f?w=1280&q=85',
    'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=1280&q=85',
    'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1280&q=85',
    'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=1280&q=85',
    'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=1280&q=85',
  ],
  'fasting': [
    'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=1280&q=85',
    'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=1280&q=85',
    'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=1280&q=85',
    'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1280&q=85',
    'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1280&q=85',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1280&q=85',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1280&q=85',
    'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=1280&q=85',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1280&q=85',
    'https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?w=1280&q=85',
    'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=1280&q=85',
  ],
  'sermon': [
    'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1280&q=85',
    'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=1280&q=85',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1280&q=85',
    'https://images.unsplash.com/photo-1477281765962-ef34e8bb0967?w=1280&q=85',
    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=1280&q=85',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1280&q=85',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1280&q=85',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1280&q=85',
    'https://images.unsplash.com/photo-1488345979593-09db0f85545f?w=1280&q=85',
    'https://images.unsplash.com/photo-1519817914152-22d216bb9170?w=1280&q=85',
    'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=1280&q=85',
    'https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=1280&q=85',
  ],
  'prayer': [
    'https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=1280&q=85',
    'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=1280&q=85',
    'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=1280&q=85',
    'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=1280&q=85',
    'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1280&q=85',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1280&q=85',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1280&q=85',
    'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=1280&q=85',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1280&q=85',
    'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1280&q=85',
    'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=1280&q=85',
    'https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?w=1280&q=85',
  ],
  'youth': [
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1280&q=85',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1280&q=85',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1280&q=85',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1280&q=85',
    'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=1280&q=85',
    'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1280&q=85',
    'https://images.unsplash.com/photo-1477281765962-ef34e8bb0967?w=1280&q=85',
    'https://images.unsplash.com/photo-1488345979593-09db0f85545f?w=1280&q=85',
    'https://images.unsplash.com/photo-1519817914152-22d216bb9170?w=1280&q=85',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1280&q=85',
  ],
  'promise': [
    'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=1280&q=85',
    'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=1280&q=85',
    'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=1280&q=85',
    'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=1280&q=85',
    'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?w=1280&q=85',
    'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=1280&q=85',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1280&q=85',
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1280&q=85',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1280&q=85',
    'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1280&q=85',
    'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1280&q=85',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1280&q=85',
    'https://images.unsplash.com/photo-1509021436665-8f07db76c61?w=1280&q=85',
    'https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?w=1280&q=85',
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1280&q=85',
    'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=1280&q=85',
    'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=1280&q=85',
    'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=1280&q=85',
    'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1280&q=85',
    'https://images.unsplash.com/photo-1530908295418-a12e326966ba?w=1280&q=85',
  ],
  'birthday': [
    'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=1280&q=85',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1280&q=85',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1280&q=85',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1280&q=85',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1280&q=85',
    'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=1280&q=85',
    'https://images.unsplash.com/photo-1477281765962-ef34e8bb0967?w=1280&q=85',
    'https://images.unsplash.com/photo-1519817914152-22d216bb9170?w=1280&q=85',
    'https://images.unsplash.com/photo-1488345979593-09db0f85545f?w=1280&q=85',
    'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=1280&q=85',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1280&q=85',
  ],
  'event': [
    'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=1280&q=85',
    'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1280&q=85',
    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=1280&q=85',
    'https://images.unsplash.com/photo-1477281765962-ef34e8bb0967?w=1280&q=85',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1280&q=85',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1280&q=85',
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1280&q=85',
    'https://images.unsplash.com/photo-1519817914152-22d216bb9170?w=1280&q=85',
    'https://images.unsplash.com/photo-1488345979593-09db0f85545f?w=1280&q=85',
    'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=1280&q=85',
    'https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=1280&q=85',
    'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=1280&q=85',
  ],
  'worship': [
    'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1280&q=85',
    'https://images.unsplash.com/photo-1477281765962-ef34e8bb0967?w=1280&q=85',
    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=1280&q=85',
    'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=1280&q=85',
    'https://images.unsplash.com/photo-1510936111840-65e151ad71bb?w=1280&q=85',
    'https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=1280&q=85',
    'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=1280&q=85',
    'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=1280&q=85',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1280&q=85',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1280&q=85',
    'https://images.unsplash.com/photo-1488345979593-09db0f85545f?w=1280&q=85',
    'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=1280&q=85',
  ],
  'nature': [
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1280&q=85',
    'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1280&q=85',
    'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1280&q=85',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1280&q=85',
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1280&q=85',
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1280&q=85',
    'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=1280&q=85',
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1280&q=85',
    'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=1280&q=85',
    'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=1280&q=85',
    'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?w=1280&q=85',
    'https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?w=1280&q=85',
    'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1280&q=85',
    'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=1280&q=85',
    'https://images.unsplash.com/photo-1530908295418-a12e326966ba?w=1280&q=85',
  ],
  'default': [
    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=1280&q=85',
    'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=1280&q=85',
    'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=1280&q=85',
    'https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=1280&q=85',
    'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1280&q=85',
    'https://images.unsplash.com/photo-1477281765962-ef34e8bb0967?w=1280&q=85',
    'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=1280&q=85',
    'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=1280&q=85',
    'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=1280&q=85',
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1280&q=85',
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1280&q=85',
    'https://images.unsplash.com/photo-1488345979593-09db0f85545f?w=1280&q=85',
  ],
};

// ─── Complete content-type → gallery category mapping ─────────────────────────
const CONTENT_TYPE_TO_CATEGORY: Record<string, string> = {
  'bible study':             'bible',
  'bible verse card':        'bible',
  'holy bible':              'bible',
  'holy communion':          'communion',
  'communion':               'communion',
  'fasting prayer':          'fasting',
  "women's fasting prayer":  'fasting',
  'womens fasting prayer':   'fasting',
  'prayer meeting':          'prayer',
  'prayer':                  'prayer',
  'sunday worship':          'worship',
  'worship':                 'worship',
  'church service':          'worship',
  'sermon':                  'sermon',
  'youth meeting':           'youth',
  'youth':                   'youth',
  'daily promise card':      'promise',
  'promise card':            'promise',
  'bible verse':             'promise',
  'birthday':                'birthday',
  'wedding anniversary':     'birthday',
  'baptism anniversary':     'birthday',
  'church anniversary':      'event',
  'anniversary':             'birthday',
  'celebration':             'birthday',
  'special event':           'event',
  'announcement':            'event',
  'event':                   'event',
  'other':                   'nature',
};

// ─── Resolve content type string → gallery key ─────────────────────────────────
const getCategoryKey = (contentType: string): string => {
  const lower = (contentType || '').toLowerCase().trim();
  // Exact match first
  if (CONTENT_TYPE_TO_CATEGORY[lower]) return CONTENT_TYPE_TO_CATEGORY[lower];
  // Partial match
  for (const [key, cat] of Object.entries(CONTENT_TYPE_TO_CATEGORY)) {
    if (lower.includes(key) || key.includes(lower)) return cat;
  }
  // Keyword fallback
  if (lower.includes('bible') || lower.includes('scripture') || lower.includes('verse')) return 'bible';
  if (lower.includes('prayer') || lower.includes('fasting')) return 'prayer';
  if (lower.includes('worship') || lower.includes('sunday')) return 'worship';
  if (lower.includes('youth')) return 'youth';
  if (lower.includes('promise')) return 'promise';
  if (lower.includes('birth') || lower.includes('anniversary') || lower.includes('celebr')) return 'birthday';
  if (lower.includes('event') || lower.includes('announce')) return 'event';
  if (lower.includes('sermon') || lower.includes('preach')) return 'sermon';
  if (lower.includes('communion') || lower.includes('holy')) return 'communion';
  return 'default';
};

// ─── True-shuffle Fisher-Yates ────────────────────────────────────────────────
const shuffleArray = <T>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

// ─── Fresh curated visual — guaranteed different every click ──────────────────
const getFreshCuratedVisual = (categoryKey: string, excludeUrl?: string): string => {
  const pool = CHURCH_VISUAL_GALLERY[categoryKey] || CHURCH_VISUAL_GALLERY['default'];

  const base = (u?: string) => (u || '').split('?')[0].split('&sig=')[0].trim();

  // Build exclusion set: caller-provided exclude + last returned + full session history
  const excludeBases = new Set<string>([
    base(excludeUrl),
    base(lastReturnedVisualUrl),
    ...Array.from(sessionUsedUrls).map(base),
  ]);
  excludeBases.delete('');

  // 1st pass: exclude everything already used this session
  let candidates = pool.filter(url => !excludeBases.has(base(url)));

  // 2nd pass: if pool is exhausted reset session history (keep excluding just the last one)
  if (candidates.length === 0) {
    sessionUsedUrls.clear();
    const lastBase = base(excludeUrl) || base(lastReturnedVisualUrl);
    candidates = pool.filter(url => base(url) !== lastBase);
    if (candidates.length === 0) candidates = pool;
  }

  // True-shuffle the candidates and pick the first element — statistically maximises variety
  const shuffled = shuffleArray(candidates);
  const selected = shuffled[0];

  // Update session registry
  lastReturnedVisualUrl = selected;
  sessionUsedUrls.add(selected);

  // Append a unique cache-buster so CDN/browser never serves a cached copy
  return `${selected}&sig=${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// ─── Composition modifiers pool (large) — rotate to enrich HF prompts ─────────
const COMPOSITIONS = [
  'dramatic wide-angle view of holy sanctuary, soft cinematic depth of field',
  'close-up macro focus with warm golden bokeh, rich spiritual atmosphere',
  'morning volumetric sunlight rays streaming through cathedral stained glass',
  'overhead reverent bird-eye view of holy scripture on altar, symmetrical',
  'warm atmospheric sanctuary lighting with solemn spiritual glow and mist',
  'ethereal heavenly illumination, serene dreamy composition, soft clouds',
  'intimate candlelight glow with rich sacred textures and deep shadows',
  'panoramic wide landscape of rolling green hills at sunrise, divine rays',
  'cinematic low-angle shot of cross silhouette against radiant golden sky',
  'misty peaceful forest path with dappled sunlight and soft sacred ambiance',
  'aerial mountain sunrise with golden light sweeping across valley mist',
  'dramatic storm clearing with rays of divine light breaking through clouds',
  'serene lakeside reflection at dawn with still water and gentle morning fog',
  'silhouette of praying figure against blazing orange sunset horizon',
  'intimate pew shot of empty sacred church interior, glowing altar candles',
  'sweeping wheat field at golden hour, warm harvest light and gentle breeze',
  'ancient stone chapel exterior at sunrise with ivy and soft lens flare',
  'gentle waterfall in forest with golden light streaming through green canopy',
];

class AIService {
  public async generateSermon(params: SermonParams): Promise<string> {
    const { topic, category, language = 'Telugu' } = params;
    const userPrompt = buildUserPrompt(topic, language, category);

    // ── 1. PRIMARY: Google Gemini Flash ──
    try {
      console.log('[AIService] Calling Google Gemini Flash...');
      const geminiRes = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: {
            maxOutputTokens: 2048,
            temperature: 0.5,
          },
        }),
      });

      if (geminiRes.ok) {
        const data = await geminiRes.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text && text.trim().length > 0) {
          console.log('[AIService] Gemini Flash SUCCESS! Length:', text.length);
          return cleanSermonText(text);
        }
      } else {
        const errText = await geminiRes.text();
        console.warn('[AIService] Gemini Flash error, falling back to Groq:', errText);
      }
    } catch (geminiErr: any) {
      console.warn('[AIService] Gemini call error, falling back to Groq:', geminiErr?.message);
    }

    // ── 2. FALLBACK: Groq ──
    console.log('[AIService] Running Groq fallback...');
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await fetch(GROQ_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user',   content: userPrompt },
            ],
            temperature: 0.6,
            max_tokens: 1200,
          }),
        });

        const raw = await response.text();

        if (!response.ok) {
          if (response.status === 429 || response.status === 503 || raw.includes('overloaded') || raw.includes('intermittent')) {
            if (attempt < 3) {
              await new Promise(r => setTimeout(r, 2000 * attempt));
              continue;
            }
            throw new Error('AI service is temporarily busy. Please wait a moment and try again.');
          }
          throw new Error(`Groq Error: ${raw}`);
        }

        const data = JSON.parse(raw);
        const text = data.choices?.[0]?.message?.content ?? '';
        if (!text) throw new Error('No content in response. Please try again.');
        return cleanSermonText(text);

      } catch (err: any) {
        if (attempt === 3) {
          console.error('AIService Groq Fallback Error:', err);
          throw err;
        }
        if (err.message?.includes('overloaded') || err.message?.includes('busy') || err.message?.includes('intermittent')) {
          await new Promise(r => setTimeout(r, 2000 * attempt));
        } else {
          throw err;
        }
      }
    }

    throw new Error('Failed to generate sermon. Please try again.');
  }

  public async generateContentImage(params: ContentImageParams): Promise<string> {
    const hfKey = process.env.EXPO_PUBLIC_HUGGINGFACE_API_KEY || '';

    // ── Pick a completely random composition from the large pool ──
    const shuffledComps = shuffleArray(COMPOSITIONS);
    const chosenComposition = shuffledComps[0];

    // ── Truly random seed: combine timestamp + random for collision-proof uniqueness ──
    const randomSeed = Math.floor(Math.random() * 2147483647) ^ (Date.now() & 0xFFFFFF);

    // ── Resolve category ──
    const categoryKey = getCategoryKey(params.contentType || '');

    // ── Build subject from prompt ──
    let subject = params.prompt || 'sacred church sanctuary, holy altar, warm spiritual light';

    const colorMood = params.color
      ? `bathed in rich ${params.color} ambient lighting, `
      : '';

    // ── Every call gets a unique random flavour modifier to further diversify results ──
    const flavours = [
      'soft morning mist and golden rays',
      'dramatic dramatic chiaroscuro lighting',
      'warm harvest bokeh and serene atmosphere',
      'ethereal diffused heavenly glow',
      'deep cinematic shadows with bright divine highlight',
      'luminous golden hour with long soft shadows',
      'peaceful blue-hour twilight with warm candle accents',
      'vibrant sunrise spectrum with radiant lens flare',
      'misty atmospheric depth with layered light',
    ];
    const chosenFlavour = shuffleArray(flavours)[0];

    const hfPrompt = [
      subject,
      chosenComposition,
      colorMood,
      params.topic ? `theme "${params.topic}"` : '',
      chosenFlavour,
      params.style || 'Professional',
      'Christian visual aesthetic, clean background photography, 8k resolution, cinematic lighting, photorealistic, elegant, no text, no letters, no watermark, no logo, clean image',
    ].filter(Boolean).join(', ');

    // ── 1. Primary: Hugging Face with unique seed ──
    if (hfKey) {
      try {
        console.log(`[AIService] Generating unique HF background | seed:${randomSeed} | composition:"${chosenComposition.slice(0, 40)}..."`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const res = await fetch('https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-3-medium-diffusers', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${hfKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: hfPrompt,
            parameters: { seed: randomSeed },
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const buf = await res.arrayBuffer();
          if (buf && buf.byteLength > 1000) {
            const { Buffer } = require('buffer');
            const b64 = Buffer.from(buf).toString('base64');
            const FileSystem = require('expo-file-system/legacy');
            const localUri = `${FileSystem.cacheDirectory}hf_bg_${Date.now()}_${randomSeed}.jpg`;
            await FileSystem.writeAsStringAsync(localUri, b64, { encoding: FileSystem.EncodingType.Base64 });
            console.log('[AIService] Fresh HF background saved:', localUri);
            lastReturnedVisualUrl = localUri;
            sessionUsedUrls.add(localUri);
            return localUri;
          }
        } else {
          const errText = await res.text();
          console.warn('[AIService] HF status:', res.status, errText.slice(0, 150));
        }
      } catch (hfErr) {
        console.warn('[AIService] HF fetch error:', hfErr);
      }
    }

    // ── 2. Free AI Generator Fallback: Pollinations AI (Unlimited, Free, HD 16:9) ──
    try {
      console.log(`[AIService] Generating unique Pollinations AI background | seed:${randomSeed}`);
      const cleanPrompt = encodeURIComponent(hfPrompt.slice(0, 280));
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1280&height=720&nologo=true&seed=${randomSeed}`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      const pollRes = await fetch(pollinationsUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (pollRes.ok) {
        const buf = await pollRes.arrayBuffer();
        if (buf && buf.byteLength > 1000) {
          const { Buffer } = require('buffer');
          const b64 = Buffer.from(buf).toString('base64');
          const FileSystem = require('expo-file-system/legacy');
          const localUri = `${FileSystem.cacheDirectory}poll_bg_${Date.now()}_${randomSeed}.jpg`;
          await FileSystem.writeAsStringAsync(localUri, b64, { encoding: FileSystem.EncodingType.Base64 });
          console.log('[AIService] Fresh Pollinations AI background saved:', localUri);
          lastReturnedVisualUrl = localUri;
          sessionUsedUrls.add(localUri);
          return localUri;
        }
      }
    } catch (pollErr) {
      console.warn('[AIService] Pollinations fetch error:', pollErr);
    }

    // ── 3. Fallback: Curated gallery — guaranteed unique every click ──
    console.log(`[AIService] Using curated gallery fallback for category: ${categoryKey}`);
    return getFreshCuratedVisual(categoryKey, params.excludeUrl);
  }
}

export default new AIService();
