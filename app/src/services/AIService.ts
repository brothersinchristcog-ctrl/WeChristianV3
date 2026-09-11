// ─── AI Engine Configuration ──────────────────────────────────────────────────
// Primary: Google Gemini Flash (Native Indic/Telugu quality, 100% free on Google AI Studio)
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_MODEL   = 'gemini-3-flash-preview';
const GEMINI_URL     = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// Fallback: Groq (Ultra-fast failover if Gemini is unreachable)
const GROQ_API_KEY   = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const GROQ_MODEL     = 'compound-beta-mini';
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
}

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
    // Still uses Firebase function for image generation
    const functions = require('@react-native-firebase/functions').default;
    try {
      const callable = functions().httpsCallable('generateContentImage');
      const response = await callable(params);
      const data = response.data as { success: boolean; imageUrl: string };
      if (data.success) return data.imageUrl;
      throw new Error('Failed to generate image');
    } catch (error) {
      console.error('AIService generateContentImage Error:', error);
      throw error;
    }
  }
}

export default new AIService();
