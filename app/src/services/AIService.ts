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

// Global memory of recently returned visual URLs to prevent repeating backgrounds
let lastReturnedVisualUrl = '';
let recentVisualUrls: string[] = [];

const CHURCH_VISUAL_GALLERY: Record<string, string[]> = {
  'bible': [
    'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=1280&q=85', // Open Bible on pulpit with warm candles
    'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=1280&q=85', // Open scripture on rustic wood, morning sun
    'https://images.unsplash.com/photo-1544717305-2782549b5136?w=1280&q=85', // Study desk with open scripture & soft rays
    'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=1280&q=85', // Antique Bible pages bathed in golden sun
  ],
  'communion': [
    'https://images.unsplash.com/photo-1510936111840-65e151ad71bb?w=1280&q=85', // Holy Communion bread & chalice with cross
    'https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=1280&q=85', // Sacred altar bread and wine table
    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=1280&q=85', // Cathedral light shining on holy communion
  ],
  'fasting': [
    'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=1280&q=85', // Solitary mountain cross at sunrise
    'https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=1280&q=85', // Reverent kneeling prayer silhouette
    'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=1280&q=85', // Open scripture in solemn morning light
    'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=1280&q=85', // Serene sunbeams in quiet prayer sanctuary
  ],
  'sermon': [
    'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1280&q=85', // Grand sanctuary auditorium
    'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=1280&q=85', // Church stage pulpit with cross
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1280&q=85', // Dynamic worship atmosphere
    'https://images.unsplash.com/photo-1477281765962-ef34e8bb0967?w=1280&q=85', // Church sanctuary in golden light
  ],
  'prayer': [
    'https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=1280&q=85', // Reverent praying hands
    'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=1280&q=85', // Serene heavenly light
    'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=1280&q=85', // Cross on mountain peak
    'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=1280&q=85', // Quiet prayer morning altar
  ],
  'youth': [
    'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1280&q=85', // Contemporary vibrant church stage
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1280&q=85', // Inspiring ambient youth worship lighting
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1280&q=85', // Modern creative Christian worship
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1280&q=85', // Uplifting celebration lighting
  ],
  'promise': [
    'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=1280&q=85', // Radiant mountain sunrise with divine light
    'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=1280&q=85', // Open Holy Bible bathed in warm morning light
    'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=1280&q=85', // Open scripture on rustic cedar with gentle sunrise rays
    'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=1280&q=85', // Heavenly sunbeams through green olive canopy
    'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?w=1280&q=85', // Peaceful calm morning dawn horizon over living waters
    'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=1280&q=85', // Glorious golden sunrise sky
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1280&q=85', // Serene golden mist over mountain valley
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1280&q=85', // Golden wheat field at morning dawn
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1280&q=85', // Majestic dawn light over mountain ridge
    'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1280&q=85', // Divine sunlight rays piercing forest mist
    'https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1280&q=85', // Golden light through majestic green trees
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1280&q=85', // Peaceful morning green landscape
    'https://images.unsplash.com/photo-1509021436665-8f07db76c61?w=1280&q=85', // Open Bible in warm ambient glow
    'https://images.unsplash.com/photo-1513002749550-c59d786b8e6c?w=1280&q=85', // Heavenly sunbeams through golden clouds
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1280&q=85', // Peaceful green meadow at golden sunrise
    'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=1280&q=85', // Mountain peak touched with radiant morning light
  ],
  'birthday': [
    'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=1280&q=85', // Elegant celebratory golden bokeh
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1280&q=85', // Festive golden ambient sparkle
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1280&q=85', // Joyful celebration lighting
  ],
  'event': [
    'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=1280&q=85', // Grand cathedral altar
    'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1280&q=85', // Grand sanctuary auditorium
    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=1280&q=85', // Cathedral stained glass sunlight
    'https://images.unsplash.com/photo-1477281765962-ef34e8bb0967?w=1280&q=85', // Golden cathedral architecture
  ],
  'default': [
    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=1280&q=85',
    'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=1280&q=85',
    'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=1280&q=85',
    'https://images.unsplash.com/photo-1544427920-c49ccfb85579?w=1280&q=85',
  ]
};

const getFreshCuratedVisual = (categoryKey: string, excludeUrl?: string): string => {
  const pool = CHURCH_VISUAL_GALLERY[categoryKey] || CHURCH_VISUAL_GALLERY['default'];
  
  const clean = (u?: string) => (u ? u.split('&sig=')[0].split('?')[0].trim() : '');
  const excludeBases = new Set([
    clean(excludeUrl),
    clean(lastReturnedVisualUrl),
    ...recentVisualUrls.map(clean)
  ]);
  excludeBases.delete('');

  // Filter pool excluding recent ones to guarantee a fresh background every time
  let available = pool.filter(url => !excludeBases.has(clean(url)));
  if (available.length === 0) {
    const immediateLast = clean(excludeUrl) || clean(lastReturnedVisualUrl);
    available = pool.filter(url => clean(url) !== immediateLast);
    if (available.length === 0) available = pool;
    recentVisualUrls = [];
  }

  const randomIndex = Math.floor(Math.random() * available.length);
  const selected = available[randomIndex];
  lastReturnedVisualUrl = selected;
  recentVisualUrls.push(selected);
  if (recentVisualUrls.length > 12) recentVisualUrls.shift();

  return `${selected}&sig=${Date.now()}_${Math.random().toString(36).substring(5)}`;
};

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
    
    // Dynamic camera angle & lighting variation for unique outputs each time
    const COMPOSITIONS = [
      'dramatic wide-angle view of holy sanctuary, soft depth of field',
      'close-up cinematic focus with golden ambient bokeh',
      'morning volumetric sunlight rays streaming through stained glass',
      'overhead reverent view of holy scripture and altar',
      'warm atmospheric sanctuary lighting with solemn spiritual glow',
      'ethereal heavenly illumination with serene composition',
      'intimate candlelight glow with rich sacred depth and texture'
    ];
    const chosenComposition = COMPOSITIONS[Math.floor(Math.random() * COMPOSITIONS.length)];
    const randomSeed = Math.floor(Math.random() * 2147483647);

    // Tailored church background prompt without any text or watermarks
    let subject = params.prompt || 'sacred church sanctuary, holy altar, warm spiritual light';
    const cType = (params.contentType || '').toLowerCase();
    let categoryKey = 'default';

    if (cType.includes('bible')) {
      categoryKey = 'bible';
      if (!params.prompt) subject = 'aesthetic open Holy Bible on wooden pulpit, warm candlelight glow, sacred church scripture atmosphere';
    } else if (cType.includes('communion')) {
      categoryKey = 'communion';
      if (!params.prompt) subject = 'holy communion bread and sacred chalice cup on communion table, glowing cross, reverent worship atmosphere';
    } else if (cType.includes('fasting')) {
      categoryKey = 'fasting';
      if (!params.prompt) subject = 'reverent fasting prayer, open Bible, glowing silhouette cross, deep spiritual worship atmosphere';
    } else if (cType.includes('sermon') || cType.includes('worship')) {
      categoryKey = 'sermon';
      if (!params.prompt) subject = 'cinematic church auditorium stage, glowing golden cross, dramatic worship lighting';
    } else if (cType.includes('prayer')) {
      categoryKey = 'prayer';
      if (!params.prompt) subject = 'serene praying hands, golden heavenly morning rays, peaceful sanctuary';
    } else if (cType.includes('youth')) {
      categoryKey = 'youth';
      if (!params.prompt) subject = 'contemporary Christian worship stage, glowing ambient lighting, modern aesthetic church';
    } else if (cType.includes('promise') || cType.includes('verse')) {
      categoryKey = 'promise';
      if (!params.prompt) subject = 'peaceful radiant morning golden sunrise over wheat field and green olive trees, open Holy Bible bathed in morning dawn light rays, sacred promise of long life divine health peace Psalm 91:16';
    } else if (cType.includes('birthday') || cType.includes('anniversary') || cType.includes('celebration')) {
      categoryKey = 'birthday';
      if (!params.prompt) subject = 'grand sacred church architecture, festive golden bokeh, elegant Christian celebration';
    } else if (cType.includes('event')) {
      categoryKey = 'event';
      if (!params.prompt) subject = 'grand cathedral architecture, sacred sanctuary, inspirational church atmosphere';
    }

    const colorMood = params.color ? `bathed in rich ${params.color} ambient lighting, ` : '';
    const hfPrompt = `${subject}, ${chosenComposition}, ${colorMood}${params.topic ? `theme "${params.topic}", ` : ''}${params.style || 'Professional'} Christian visual aesthetic, clean background photography, 8k resolution, cinematic lighting, photorealistic, elegant, no text, no letters, no watermark, no logo, clean image`;

    // 1. Primary: Direct Hugging Face Inference API with Unique Random Seed
    if (hfKey) {
      try {
        console.log('[AIService] Generating unique background visual via Hugging Face with seed:', randomSeed);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);
        const res = await fetch('https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-3-medium-diffusers', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${hfKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            inputs: hfPrompt,
            parameters: {
              seed: randomSeed,
            }
          }),
          signal: controller.signal
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
            console.log('[AIService] Fresh Hugging Face background saved to:', localUri);
            lastReturnedVisualUrl = localUri;
            return localUri;
          }
        } else {
          const errText = await res.text();
          console.warn('[AIService] Hugging Face returned status:', res.status, errText.slice(0, 150));
        }
      } catch (hfErr) {
        console.warn('[AIService] Hugging Face fetch error:', hfErr);
      }
    }

    // 2. Fallback: Curated High-Resolution Church Gallery (Guaranteed Unique Every Click)
    console.log('[AIService] Providing fresh curated church visual from gallery for:', categoryKey);
    return getFreshCuratedVisual(categoryKey, params.excludeUrl);
  }
}

export default new AIService();

