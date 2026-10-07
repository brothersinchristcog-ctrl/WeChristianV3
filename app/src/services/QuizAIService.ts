import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { QuizDifficulty, QuizQuestion, QuizQuestionType } from '../types/Quiz';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash'];

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface DocumentUploadAsset {
  uri: string;
  name: string;
  mimeType?: string;
  size?: number;
}

export interface GeneratedQuizPayload {
  title: string;
  description: string;
  category: string;
  difficulty: QuizDifficulty;
  language: string;
  questions: QuizQuestion[];
  sourceFileName?: string;
  isFallback?: boolean;
}

export class QuizAIService {
  /**
   * Intelligently detect the language of document content or fallback.
   * Priority: Actual text content ALWAYS takes precedence over filename.
   */
  static detectLanguage(text: string, preferredLang?: string, fileName?: string): string {
    const cleanText = (text || '').trim();

    if (cleanText.length > 0) {
      const teluguChars = (cleanText.match(/[\u0C00-\u0C7F]/g) || []).length;
      const tamilChars = (cleanText.match(/[\u0B80-\u0BFF]/g) || []).length;
      const hindiChars = (cleanText.match(/[\u0900-\u097F]/g) || []).length;
      const kannadaChars = (cleanText.match(/[\u0C80-\u0CFF]/g) || []).length;
      const malayalamChars = (cleanText.match(/[\u0D00-\u0D7F]/g) || []).length;
      const englishWords = (cleanText.match(/[a-zA-Z]{2,}/g) || []).length;

      console.log(`[QuizAIService] DetectLanguage: TeluguChars=${teluguChars}, EnglishWords=${englishWords}, Tamil=${tamilChars}, Hindi=${hindiChars}`);

      // Clear Telugu script in text
      if (teluguChars > 5 || (teluguChars > 0 && teluguChars > englishWords)) {
        return 'te';
      }
      if (tamilChars > 5) return 'ta';
      if (hindiChars > 5) return 'hi';
      if (kannadaChars > 5) return 'kn';
      if (malayalamChars > 5) return 'ml';

      // English words or no Indic script present -> 100% English
      if (englishWords > 0 || teluguChars === 0) {
        return 'en';
      }
    }

    // If text was empty (e.g. scanned image PDF), check filename without false positives
    const fLower = (fileName || '').toLowerCase();
    if (/[\u0C00-\u0C7F]/.test(fLower) || fLower.includes('telugu') || fLower.startsWith('te-') || fLower.startsWith('te_')) {
      return 'te';
    }
    if (/[\u0B80-\u0BFF]/.test(fLower) || fLower.includes('tamil')) return 'ta';
    if (/[\u0900-\u097F]/.test(fLower) || fLower.includes('hindi')) return 'hi';

    // Fall back to preferred language from UI or default to English
    return preferredLang || 'en';
  }

  /**
   * Read raw text or base64 data from an uploaded file asset.
   */
  static async readFile(asset: DocumentUploadAsset): Promise<{ textContent: string; base64Data?: string; mimeType: string }> {
    const filename = (asset.name || '').toLowerCase();
    let mime = asset.mimeType || 'text/plain';

    if (filename.endsWith('.pdf')) mime = 'application/pdf';
    else if (filename.endsWith('.csv')) mime = 'text/csv';
    else if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    else if (filename.endsWith('.docx') || filename.endsWith('.doc')) mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (filename.endsWith('.txt')) mime = 'text/plain';

    let textContent = '';
    let base64Data: string | undefined;

    try {
      // 1. Web HTML5 File Object (Highest reliability on Web)
      if (Platform.OS === 'web') {
        const fileObj = (asset as any).file;
        if (fileObj && typeof fileObj.text === 'function') {
          textContent = await fileObj.text();
        } else if (asset.uri) {
          const resp = await fetch(asset.uri);
          if (mime === 'application/pdf' || mime.includes('spreadsheet') || mime.includes('word')) {
            const blob = await resp.blob();
            base64Data = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                const res = (reader.result as string) || '';
                const base64 = res.split(',')[1] || res;
                resolve(base64);
              };
              reader.readAsDataURL(blob);
            });
            try {
              textContent = await resp.clone().text();
            } catch {}
          } else {
            textContent = await resp.text();
          }
        }
      } else {
        // 2. Native Expo FileSystem
        if (mime === 'application/pdf' || mime.includes('word') || mime.includes('spreadsheet')) {
          try {
            base64Data = await FileSystem.readAsStringAsync(asset.uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
          } catch {}
          try {
            textContent = await FileSystem.readAsStringAsync(asset.uri, {
              encoding: FileSystem.EncodingType.UTF8,
            });
          } catch {}
        } else {
          // Notepad / TXT / CSV
          try {
            textContent = await FileSystem.readAsStringAsync(asset.uri, {
              encoding: FileSystem.EncodingType.UTF8,
            });
          } catch {
            // Native fallback: fetch() can read local file:// and content:// URIs in React Native
            try {
              const resp = await fetch(asset.uri);
              textContent = await resp.text();
            } catch {}
          }
        }
      }

      // If textContent was base64 encoded by DocumentPicker
      if (!textContent && (asset as any).base64) {
        try {
          if (typeof atob === 'function') {
            textContent = decodeURIComponent(escape(atob((asset as any).base64)));
          }
        } catch {}
      }
    } catch (err: any) {
      console.warn('[QuizAIService] Error reading file directly:', err?.message || err);
    }

    console.log(`[QuizAIService] Successfully read "${asset.name}". Size=${textContent.length} chars. Sample: "${textContent.slice(0, 100).replace(/\n/g, ' ')}"`);
    return { textContent, base64Data, mimeType: mime };
  }

  /**
   * Generate Quiz Questions from an uploaded document or text.
   */
  static async generateQuizFromFile(
    asset: DocumentUploadAsset,
    options: {
      category?: string;
      difficulty?: QuizDifficulty;
      language?: string;
      questionCount?: number;
    } = {}
  ): Promise<GeneratedQuizPayload> {
    const fileResult = await this.readFile(asset);
    const detectedLang = QuizAIService.detectLanguage(fileResult.textContent, options.language, asset.name);

    console.log(`[QuizAIService] generateQuizFromFile: File "${asset.name}" detected language -> "${detectedLang}"`);

    return this.generateQuizFromContent({
      textContent: fileResult.textContent,
      base64Data: fileResult.base64Data,
      mimeType: fileResult.mimeType,
      fileName: asset.name,
      category: options.category || 'Bible Study',
      difficulty: options.difficulty || 'medium',
      language: detectedLang,
      questionCount: options.questionCount || 10,
    });
  }

  /**
   * Main AI generator taking text or base64 file data.
   */
  static async generateQuizFromContent(params: {
    textContent?: string;
    base64Data?: string;
    mimeType?: string;
    fileName?: string;
    topic?: string;
    category: string;
    difficulty: QuizDifficulty;
    language: string;
    questionCount: number;
  }): Promise<GeneratedQuizPayload> {
    const {
      textContent = '',
      base64Data,
      mimeType = 'text/plain',
      fileName = 'document',
      topic = '',
      category,
      difficulty,
      language,
      questionCount,
    } = params;

    // Use robust detectLanguage prioritizing actual text content
    const actualLang = QuizAIService.detectLanguage(textContent, language, fileName);
    const isTelugu = actualLang === 'te';

    console.log(`[QuizAIService] generateQuizFromContent: Target language is "${actualLang}" (isTelugu=${isTelugu})`);

    const langLabel = actualLang === 'te'
      ? 'Telugu (తెలుగు లిపి)'
      : actualLang === 'ta'
      ? 'Tamil (தமிழ்)'
      : actualLang === 'hi'
      ? 'Hindi (हिन्दी)'
      : actualLang === 'kn'
      ? 'Kannada (ಕನ್ನಡ)'
      : actualLang === 'ml'
      ? 'Malayalam (മലയാളം)'
      : 'English';

    const systemPrompt = isTelugu
      ? `You are an expert biblical scholar and Christian quiz architect for Telugu-speaking believers.
Generate a comprehensive, doctrinally sound Bible quiz based on the provided study material or topic.
Difficulty Level: "${difficulty}" (Intermediate to Moderate Bible knowledge; avoid overly simplistic trivia).
LANGUAGE REQUIREMENT: 100% TELUGU SCRIPT ONLY (తెలుగు లిపి).

CRITICAL TELUGU RULES:
1. EVERY SINGLE FIELD MUST BE WRITTEN IN AUTHENTIC TELUGU SCRIPT (తెలుగు లిపి):
   - "title": inspiring title in pure Telugu script (e.g. "పరిశుద్ధ గ్రంథ బైబిల్ క్విజ్" or specific to the topic)
   - "description": concise 1-sentence description in Telugu script
   - "question": clear, grammatically sound question in pure Telugu script
   - "options": exactly 4 distinct choices in pure Telugu script
   - "correctAnswer": exact matching string of one of the 4 Telugu options
   - "bibleReference": exact Bible citation in official Telugu Bible book names (e.g. "న్యాయాధిపతులు 16:28", "యోహాను 3:16", "ఆదికాండము 1:1"). NEVER write fabricated words like "నాధులు" - for Judges always write "న్యాయాధిపతులు"!
   - "explanation": concise biblical insight in pure Telugu script
2. DO NOT OUTPUT IN ENGLISH! DO NOT TRANSLATE TO ENGLISH!
3. TELUGU BIBLE BOOK CANON: Use official names only: ఆదికాండము, నిర్గమకాండము, లేవీయకాండము, సంఖ్యాకాండము, ద్వితీయోపదేశకాండము, యెహోషువ, న్యాయాధిపతులు, రూతు, 1 సమూయేలు, 2 సమూయేలు, 1 రాజులు, 2 రాజులు, 1 దినవృత్తాంతములు, 2 దినవృత్తాంతములు, ఎజ్రా, నెహెమ్యా, ఎస్తేరు, యోబు, కీర్తనలు, సామెతలు, ప్రసంగి, పరమగీతము, యెషయా, యిర్మియా, విలాపవాక్యములు, యెహెజ్కేలు, దానియేలు, హోషేయ, యోవేలు, ఆమోసు, ఓబద్యా, యోనా, మీకా, నహూము, హబక్కూకు, జెఫన్యా, హగ్గయి, జెకర్యా, మలాకీ, మత్తయి, మార్కు, లూకా, యోహాను, అపొస్తలుల కార్యములు, రోమీయులకు, 1 కొరింథీయులకు, 2 కొరింథీయులకు, గలతీయులకు, ఎఫెసీయులకు, ఫిలిప్పీయులకు, కొలొస్సయులకు, 1 థెస్సలొనీకయులకు, 2 థెస్సలొనీకయులకు, 1 తిమోతి, 2 తిమోతి, తీతుకు, ఫిలేమోనుకు, హెబ్రీయులకు, యాకోబు, 1 పేతురు, 2 పేతురు, 1 యోహాను, 2 యోహాను, 3 యోహాను, యూదా, ప్రకటన.
4. Provide exactly ${questionCount} questions.
5. Keep each question clear, each option concise, and each explanation limited to 1-2 sentences so all questions fit cleanly without truncation.
6. Respond ONLY with valid, raw JSON with NO markdown code fences:
{
  "title": "తెలుగు టైటిల్",
  "description": "వివరణ...",
  "category": "${category}",
  "difficulty": "${difficulty}",
  "language": "te",
  "questions": [
    {
      "question": "తెలుగు ప్రశ్న...?",
      "options": ["ఆప్షన్ A", "ఆప్షన్ B", "ఆప్షన్ C", "ఆప్షన్ D"],
      "correctAnswer": "ఆప్షన్ A",
      "bibleReference": "యోహాను 3:16",
      "explanation": "ఎందుకు ఈ సమాధానం సరైనదో వివరణ..."
    }
  ]
}`
      : `You are an expert biblical scholar and Christian quiz architect. 
Generate a comprehensive, doctrinally accurate Bible quiz based on the provided material or topic.
Difficulty Level: "${difficulty}" (Intermediate to Moderate Bible knowledge).

LANGUAGE REQUIREMENT: 100% ENGLISH ONLY.
All questions, all 4 options, the correct answer, Bible citations, and explanations MUST be written in clear English.
DO NOT OUTPUT IN TELUGU OR ANY OTHER SCRIPT!
Provide exactly ${questionCount} questions.
Keep each question clear, each option concise, and each explanation limited to 1-2 sentences so all questions fit cleanly.

Respond ONLY with valid, raw JSON with NO markdown code fences:
{
  "title": "${category} Quiz",
  "description": "Bible study quiz",
  "category": "${category}",
  "difficulty": "${difficulty}",
  "language": "en",
  "questions": [
    {
      "question": "Question text in English?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "bibleReference": "Book Chapter:Verse",
      "explanation": "Why this answer is correct..."
    }
  ]
}`;

    let userPromptText = `Source File: "${fileName}".\nCategory: "${category}".\nDifficulty: "${difficulty}".\n`;
    if (topic) {
      userPromptText += `Topic / Focus: ${topic}\n`;
    }
    if (isTelugu) {
      userPromptText += `⚠️ MANDATORY REQUIREMENT: This quiz MUST be written 100% in TELUGU SCRIPT (తెలుగు లిపి). All questions, options, and explanations must be in Telugu script. Do NOT output in English.\n`;
    } else {
      userPromptText += `⚠️ MANDATORY REQUIREMENT: This quiz MUST be written 100% in ENGLISH. All questions, options, and explanations must be in English. Do NOT output in Telugu or any other language.\n`;
    }
    if (textContent && textContent.trim().length > 0) {
      const truncated = textContent.slice(0, 15000);
      userPromptText += `\nDOCUMENT CONTENT:\n${truncated}\n\nGenerate ${questionCount} intermediate-level Bible quiz questions based on this document.`;
    } else {
      userPromptText += `\nGenerate ${questionCount} intermediate Bible quiz questions based on this study file.`;
    }

    // 1. Try Gemini Models in order: 'gemini-3.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest'
    if (GEMINI_API_KEY) {
      for (const modelName of GEMINI_MODELS) {
        try {
          console.log(`[QuizAIService] Requesting Gemini (${modelName}) for Quiz Generation in ${actualLang}...`);
          const parts: any[] = [];

          // If PDF base64 is available, attach inlineData
          if (base64Data && mimeType === 'application/pdf') {
            parts.push({
              inlineData: {
                mimeType: 'application/pdf',
                data: base64Data,
              },
            });
          }

          parts.push({ text: userPromptText });

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000);
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${GEMINI_API_KEY}`;
          const geminiRes = await fetch(endpoint, {
            method: 'POST',
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemPrompt }] },
              contents: [{ parts }],
              generationConfig: {
                maxOutputTokens: 8192,
                temperature: 0.3,
                responseMimeType: 'application/json',
              },
            }),
          });
          clearTimeout(timeoutId);

          if (geminiRes.ok) {
            const data = await geminiRes.json();
            const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (raw) {
              const parsed = this.parseCleanJson(raw, category, difficulty, actualLang, fileName);
              if (parsed && !parsed.isFallback && parsed.questions.length > 0) {
                console.log(`[QuizAIService] Gemini (${modelName}) successfully generated ${parsed.questions.length} questions in ${parsed.language}!`);
                return parsed;
              } else {
                console.warn(`[QuizAIService] Gemini (${modelName}) produced unparseable JSON, trying next model/fallback...`);
              }
            }
          } else {
            const errTxt = await geminiRes.text();
            console.warn(`[QuizAIService] Gemini (${modelName}) returned error, falling back:`, errTxt.slice(0, 200));
          }
        } catch (geminiErr: any) {
          console.warn(`[QuizAIService] Gemini (${modelName}) exception:`, geminiErr?.message || geminiErr);
        }
      }
    }

    // 2. Fallback to Groq
    if (GROQ_API_KEY) {
      try {
        console.log('[QuizAIService] Fallback to Groq for Quiz Generation...');
        const groqController = new AbortController();
        const groqTimeoutId = setTimeout(() => groqController.abort(), 12000);
        const groqRes = await fetch(GROQ_URL, {
          method: 'POST',
          signal: groqController.signal,
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPromptText },
            ],
            temperature: 0.3,
            max_tokens: 6000,
          }),
        });
        clearTimeout(groqTimeoutId);

        if (groqRes.ok) {
          const data = await groqRes.json();
          const raw = data.choices?.[0]?.message?.content;
          if (raw) {
            const parsed = this.parseCleanJson(raw, category, difficulty, actualLang, fileName);
            if (parsed && !parsed.isFallback && parsed.questions.length > 0) {
              console.log(`[QuizAIService] Groq successfully generated ${parsed.questions.length} questions in ${parsed.language}!`);
              return parsed;
            }
          }
        }
      } catch (groqErr: any) {
        console.warn('[QuizAIService] Groq exception:', groqErr?.message || groqErr);
      }
    }

    // 3. Fallback: Generate curated template if network unavailable
    return this.createFallbackQuiz(category, difficulty, actualLang, fileName, questionCount);
  }

  /**
   * Attempt to repair truncated or partially cut-off JSON stream from AI model.
   */
  private static repairTruncatedQuizJson(text: string): any {
    try {
      // Find where questions array begins
      const qIdx = text.indexOf('"questions"');
      if (qIdx === -1) return null;

      // Find the last complete closing curly brace for an individual question item
      const lastBrace = text.lastIndexOf('}');
      if (lastBrace > qIdx) {
        const candidate = text.slice(0, lastBrace + 1);
        const candidatesToTry = [
          candidate + '\n]}',
          candidate + '\n}',
          candidate + ']}',
          candidate + '}',
        ];
        for (const att of candidatesToTry) {
          try {
            const parsed = JSON.parse(att);
            if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
              return parsed;
            }
          } catch {}
        }
      }

      // Regex fallback: extract any fully closed question blocks
      const qBlockRegex = /\{[^{}]*"question"\s*:\s*"[^"]+"[^{}]*"options"\s*:\s*\[[^\]]+\][^{}]*\}/g;
      const matches = text.match(qBlockRegex);
      if (matches && matches.length > 0) {
        const extracted: any[] = [];
        for (const m of matches) {
          try {
            const parsedQ = JSON.parse(m);
            if (parsedQ && parsedQ.question && Array.isArray(parsedQ.options)) {
              extracted.push(parsedQ);
            }
          } catch {}
        }
        if (extracted.length > 0) {
          return {
            title: 'Bible Quiz',
            description: 'Study quiz',
            questions: extracted,
          };
        }
      }
    } catch {}
    return null;
  }

  /**
   * Safely parse raw JSON and standardize questions.
   */
  private static parseCleanJson(
    rawText: string,
    category: string,
    difficulty: QuizDifficulty,
    language: string,
    fileName?: string
  ): GeneratedQuizPayload {
    try {
      const cleaned = rawText
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      let obj: any;
      try {
        obj = JSON.parse(cleaned);
      } catch (parseErr) {
        // Try repairing truncated JSON stream
        obj = this.repairTruncatedQuizJson(cleaned);
        if (!obj) {
          throw parseErr;
        }
      }

      const questions: QuizQuestion[] = (obj.questions || []).map((q: any, idx: number) => {
        const opts = Array.isArray(q.options) && q.options.length >= 2 ? q.options : ['Option A', 'Option B', 'Option C', 'Option D'];
        const correct = q.correctAnswer || opts[0];

        return {
          id: `gen_q_${Date.now()}_${idx + 1}`,
          order: idx + 1,
          questionType: 'single_choice' as QuizQuestionType,
          question: q.question || `Question ${idx + 1}`,
          options: opts,
          correctAnswer: correct,
          bibleReference: q.bibleReference || '',
          explanation: q.explanation || '',
          marks: 1,
        };
      });

      if (questions.length === 0) {
        throw new Error('No valid questions found in model output');
      }

      // Detect if questions contain Telugu characters
      const sampleText = questions.map(q => q.question + ' ' + (q.options || []).join(' ') + ' ' + (q.explanation || '')).join(' ');
      const isTeQuestions = /[\u0C00-\u0C7F]/.test(sampleText) || /[\u0C00-\u0C7F]/.test(obj.title || '');
      const finalLang = isTeQuestions ? 'te' : (obj.language || language || 'en');

      // Sanitize biblical references to ensure canonical book names
      questions.forEach(q => {
        q.bibleReference = QuizAIService.sanitizeBibleReference(q.bibleReference || '', finalLang);
      });

      return {
        title: obj.title || (finalLang === 'te' ? `${category} బైబిల్ క్విజ్` : `${category} Quiz - Study Material`),
        description: obj.description || `Generated from ${fileName || 'study material'}`,
        category: obj.category || category,
        difficulty: (obj.difficulty as QuizDifficulty) || difficulty,
        language: finalLang,
        questions,
        sourceFileName: fileName,
        isFallback: false,
      };
    } catch (parseErr) {
      console.warn('[QuizAIService] Failed to parse AI JSON, attempting fallback quiz:', rawText.slice(0, 200));
      return {
        ...this.createFallbackQuiz(category, difficulty, language, fileName, 10),
        isFallback: true,
      };
    }
  }

  /**
   * Normalize and fix AI hallucinations in Bible book citations.
   * e.g. converts "నాధులు 16:28" -> "న్యాయాధిపతులు 16:28" (Judges 16:28)
   */
  static sanitizeBibleReference(ref: string, language?: string): string {
    if (!ref) return '';
    let cleaned = ref.trim();
    // Correct corrupted names for Judges (న్యాయాధిపతులు)
    cleaned = cleaned.replace(/^నా[ధద]ులు\b/gi, 'న్యాయాధిపతులు');
    cleaned = cleaned.replace(/^న్యాయాధిపతి\b/gi, 'న్యాయాధిపతులు');
    cleaned = cleaned.replace(/^న్యాధులు\b/gi, 'న్యాయాధిపతులు');
    cleaned = cleaned.replace(/^Judges\b/gi, language === 'te' ? 'న్యాయాధిపతులు' : 'Judges');
    // Other common Telugu abbreviations
    cleaned = cleaned.replace(/^ఆది\b/gi, 'ఆదికాండము');
    cleaned = cleaned.replace(/^నిర్గమ\b/gi, 'నిర్గమకాండము');
    cleaned = cleaned.replace(/^లేవీయ\b/gi, 'లేవీయకాండము');
    cleaned = cleaned.replace(/^సంఖ్యా\b/gi, 'సంఖ్యాకాండము');
    cleaned = cleaned.replace(/^ద్వితీయో\b/gi, 'ద్వితీయోపదేశకాండము');
    cleaned = cleaned.replace(/^కీర్తన\b/gi, 'కీర్తనలు');
    return cleaned;
  }

  /**
   * Safe biblical fallback questions if AI service is offline.
   */
  private static createFallbackQuiz(
    category: string,
    difficulty: QuizDifficulty,
    language: string,
    fileName?: string,
    count: number = 10
  ): GeneratedQuizPayload {
    const isTe = language === 'te';
    const templates: QuizQuestion[] = [
      {
        id: `fb_1_${Date.now()}`,
        order: 1,
        questionType: 'single_choice',
        question: isTe ? 'అబ్రాహాముకు దేవుడు వాగ్దానం చేసిన కుమారుని పేరేమిటి?' : 'Who was the promised son given to Abraham by God?',
        options: isTe ? ['ఇస్సాకు', 'ఇష్మాయేలు', 'యాకోబు', 'యోసేపు'] : ['Isaac', 'Ishmael', 'Jacob', 'Joseph'],
        correctAnswer: isTe ? 'ఇస్సాకు' : 'Isaac',
        bibleReference: 'Genesis 21:3',
        explanation: isTe ? 'దేవుని వాగ్దానము చొప్పున శారా ఇస్సాకును కనెను.' : 'Sarah bore Abraham a son in his old age, whom Abraham named Isaac.',
        marks: 1,
      },
      {
        id: `fb_2_${Date.now()}`,
        order: 2,
        questionType: 'single_choice',
        question: isTe ? 'సాలెము రాజు మరియు సర్వోన్నతుడైన దేవుని యాజకుడు ఎవరు?' : 'Who was the king of Salem and priest of God Most High?',
        options: isTe ? ['మెల్కీసెదెకు', 'ఆహరోను', 'ఏలీ', 'సమూయేలు'] : ['Melchizedek', 'Aaron', 'Eli', 'Samuel'],
        correctAnswer: isTe ? 'మెల్కీసెదెకు' : 'Melchizedek',
        bibleReference: 'Hebrews 7:1-2',
        explanation: isTe ? 'మెల్కీసెదెకు నీతికిని సమాధానమునకును రాజై యుండెను.' : 'Melchizedek met Abraham returning from the slaughter of kings and blessed him.',
        marks: 1,
      },
      {
        id: `fb_3_${Date.now()}`,
        order: 3,
        questionType: 'single_choice',
        question: isTe ? 'పరిశుద్ధాత్మ ఫలాలలో మొదటిది ఏది?' : 'Which of the following is the first fruit of the Spirit listed in Galatians?',
        options: isTe ? ['ప్రేమ', 'సంతోషము', 'సమాధానము', 'విశ్వాసము'] : ['Love', 'Joy', 'Peace', 'Faithfulness'],
        correctAnswer: isTe ? 'ప్రేమ' : 'Love',
        bibleReference: 'Galatians 5:22',
        explanation: isTe ? 'ఆత్మ ఫలమేమనగా: ప్రేమ, సంతోషము, సమాధానము...' : 'The fruit of the Spirit is love, joy, peace, longsuffering, kindness...',
        marks: 1,
      },
      {
        id: `fb_4_${Date.now()}`,
        order: 4,
        questionType: 'single_choice',
        question: isTe ? 'దామస్కు మార్గములో ప్రభువైన యేసు ఎవరికి ప్రత్యక్షమాయెను?' : 'To whom did Jesus appear on the road to Damascus?',
        options: isTe ? ['సౌలు (పౌలు)', 'పేతురు', 'బర్నబా', 'తిమోతి'] : ['Saul (Paul)', 'Peter', 'Barnabas', 'Timothy'],
        correctAnswer: isTe ? 'సౌలు (పౌలు)' : 'Saul (Paul)',
        bibleReference: 'Acts 9:3-5',
        explanation: isTe ? 'సౌలు దామస్కు సమీపించినప్పుడు ఆకాశమునుండి వెలుగు ప్రకాశించెను.' : 'As Saul neared Damascus, suddenly a light from heaven flashed around him.',
        marks: 1,
      },
      {
        id: `fb_5_${Date.now()}`,
        order: 5,
        questionType: 'single_choice',
        question: isTe ? 'బేతేలు అనగా అర్థమేమిటి?' : 'What is the biblical meaning of the name "Bethel"?',
        options: isTe ? ['దేవుని నివాసము', 'శాంతి నగరము', 'బండ', 'పరిశుద్ధ స్థలము'] : ['House of God', 'City of Peace', 'Holy Rock', 'Divine Refuge'],
        correctAnswer: isTe ? 'దేవుని నివాసము' : 'House of God',
        bibleReference: 'Genesis 28:19',
        explanation: isTe ? 'యాకోబు ఆ స్థలమునకు బేతేలు అని పేరు పెట్టెను.' : 'Jacob called the name of that place Bethel, meaning House of God.',
        marks: 1,
      },
      {
        id: `fb_6_${Date.now()}`,
        order: 6,
        questionType: 'single_choice',
        question: isTe ? 'దావీదు గొల్యాతును జయించడానికి ఎన్నుకున్న గులకరాళ్ల సంఖ్య ఎంత?' : 'How many smooth stones did David choose from the brook to fight Goliath?',
        options: isTe ? ['5 గులకరాళ్లు', '3 గులకరాళ్లు', '7 గులకరాళ్లు', '1 గులకరాయి'] : ['5 smooth stones', '3 smooth stones', '7 smooth stones', '1 smooth stone'],
        correctAnswer: isTe ? '5 గులకరాళ్లు' : '5 smooth stones',
        bibleReference: '1 Samuel 17:40',
        explanation: isTe ? 'దావీదు వాగులోనుండి అయిదు నునుపైన గులకరాళ్లను ఏరుకొని తన సంచిలో వేసుకొనెను.' : 'David chose five smooth stones from the brook and put them in his shepherd bag.',
        marks: 1,
      },
      {
        id: `fb_7_${Date.now()}`,
        order: 7,
        questionType: 'single_choice',
        question: isTe ? 'యేసుక్రీస్తు చేసిన మొదటి అద్భుతము ఎక్కడ జరిగింది?' : 'Where did Jesus perform His first recorded miracle?',
        options: isTe ? ['కానా వివాహములో', 'కపెర్నహూములో', 'బెత్సయిదాలో', 'నజరేతులో'] : ['Wedding at Cana', 'Capernaum', 'Bethsaida', 'Nazareth'],
        correctAnswer: isTe ? 'కానా వివాహములో' : 'Wedding at Cana',
        bibleReference: 'John 2:11',
        explanation: isTe ? 'గలిలయలోని కానాలో యేసు నీళ్లను ద్రాక్షారసముగా మార్చి తన మహిమను ప్రత్యక్షపరచెను.' : 'This beginning of signs Jesus did in Cana of Galilee, and manifested His glory.',
        marks: 1,
      },
      {
        id: `fb_8_${Date.now()}`,
        order: 8,
        questionType: 'single_choice',
        question: isTe ? 'మోషే ద్వారా దేవుడు సీనాయి పర్వతముపై ఇచ్చిన ఆజ్ఞలు ఎన్ని?' : 'How many Commandments did God give to Moses on Mount Sinai?',
        options: isTe ? ['10 ఆజ్ఞలు', '12 ఆజ్ఞలు', '7 ఆజ్ఞలు', '15 ఆజ్ఞలు'] : ['10 Commandments', '12 Commandments', '7 Commandments', '15 Commandments'],
        correctAnswer: isTe ? '10 ఆజ్ఞలు' : '10 Commandments',
        bibleReference: 'Exodus 20:1-17',
        explanation: isTe ? 'సీనాయి పర్వతముపై దేవుడు పది ఆజ్ఞలను రాతి పలకలపై లిఖించి ఇచ్చెను.' : 'God delivered the Ten Commandments to Moses written on tablets of stone.',
        marks: 1,
      },
      {
        id: `fb_9_${Date.now()}`,
        order: 9,
        questionType: 'single_choice',
        question: isTe ? 'బైబిల్ గ్రంథములో అతి పెద్ద అధ్యాయము ఏది?' : 'Which is the longest chapter in the Bible?',
        options: isTe ? ['కీర్తనలు 119', 'కీర్తనలు 23', 'యెషయా 53', 'కీర్తనలు 150'] : ['Psalm 119', 'Psalm 23', 'Isaiah 53', 'Psalm 150'],
        correctAnswer: isTe ? 'కీర్తనలు 119' : 'Psalm 119',
        bibleReference: 'Psalm 119',
        explanation: isTe ? 'కీర్తన 119 లో 176 వచనాలు ఉన్నవి, ఇది బైబిల్ లోనే అతి పొడవైన అధ్యాయము.' : 'Psalm 119 consists of 176 verses, making it the longest chapter in the Bible.',
        marks: 1,
      },
      {
        id: `fb_10_${Date.now()}`,
        order: 10,
        questionType: 'single_choice',
        question: isTe ? 'పరలోక ప్రార్థనలో యేసు మనకు నేర్పిన మొదటి వాక్యము ఏది?' : 'What is the opening address taught by Jesus in the Lord’s Prayer?',
        options: isTe ? ['పరలోకమందున్న మా తండ్రీ', 'సర్వశక్తిమంతుడవైన దేవా', 'పరిశుద్ధుడవైన ప్రభువా', 'దయగల రాజా'] : ['Our Father in heaven', 'Almighty God', 'Holy Lord', 'Gracious King'],
        correctAnswer: isTe ? 'పరలోకమందున్న మా తండ్రీ' : 'Our Father in heaven',
        bibleReference: 'Matthew 6:9',
        explanation: isTe ? 'యేసు ప్రభువు: పరలోకమందున్న మా తండ్రీ, నీ నామము పరిశుద్ధపరచబడును గాక అని ప్రార్థింపవలెను అనెను.' : 'Jesus taught His disciples to pray: "Our Father in heaven, hallowed be Your name."',
        marks: 1,
      },
    ];

    return {
      title: `${category} Bible Quiz`,
      description: fileName ? `Created based on ${fileName}` : `Intermediate study quiz on ${category}`,
      category,
      difficulty,
      language,
      questions: templates.slice(0, count),
      sourceFileName: fileName,
      isFallback: true,
    };
  }
}
