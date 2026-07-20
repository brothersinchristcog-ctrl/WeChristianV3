export interface EventDraft {
  title?: string;
  eventType?: string;
  startDateTime?: string;
  endDateTime?: string;
  durationMinutes?: number;
  venueName?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  notes?: string;
  isReadyForConfirmation?: boolean;
}

export interface Message {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string | null;
  tool_calls?: any[];
  tool_call_id?: string;
}

// ---------------------------------------------------------------------------
// Client-side date normalizer — guarantees YYYY-MM-DD regardless of AI output
// ---------------------------------------------------------------------------
const MONTH_MAP: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
  january: 1, february: 2, march: 3, april: 4, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
  // Telugu month names
  '\u0c1c\u0c28\u0c35\u0c30\u0c3f': 1, '\u0c2b\u0c3f\u0c2c\u0c4d\u0c30\u0c35\u0c30\u0c3f': 2, '\u0c2e\u0c3e\u0c30\u0c4d\u0c1a\u0c3f': 3,
  '\u0c0f\u0c2a\u0c4d\u0c30\u0c3f\u0c32\u0c4d': 4, '\u0c2e\u0c47': 5, '\u0c1c\u0c42\u0c28\u0c4d': 6,
  '\u0c1c\u0c42\u0c32\u0c48': 7, '\u0c06\u0c17\u0c38\u0c4d\u0c1f\u0c41': 8, '\u0c38\u0c46\u0c2a\u0c4d\u0c1f\u0c46\u0c02\u0c2c\u0c30\u0c4d': 9,
  '\u0c05\u0c15\u0c4d\u0c1f\u0c4b\u0c2c\u0c30\u0c4d': 10, '\u0c28\u0c35\u0c02\u0c2c\u0c30\u0c4d': 11, '\u0c21\u0c3f\u0c38\u0c46\u0c02\u0c2c\u0c30\u0c4d': 12,
};

const normalizeDate = (raw: string | undefined, baseDate: Date = new Date()): string | undefined => {
  if (!raw) return undefined;

  const today = baseDate;
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1-indexed

  // Already strict ISO YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss — strip time part
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  // Handle plain day number like "5" or "8" → current month + year
  const plainDayMatch = raw.trim().match(/^(\d{1,2})$/);
  if (plainDayMatch) {
    const day = parseInt(plainDayMatch[1], 10);
    if (day >= 1 && day <= 31) {
      return `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // Handle "Month Day" like "July 5" or "July 5th" or "July 2026 5"
  const monthDayMatch = raw.match(/([a-z\u0C00-\u0C7F]+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s+(\d{4}))?/i);
  if (monthDayMatch) {
    const monthKey = monthDayMatch[1].toLowerCase();
    const day = parseInt(monthDayMatch[2], 10);
    const year = monthDayMatch[3] ? parseInt(monthDayMatch[3], 10) : currentYear;
    const month = MONTH_MAP[monthKey];
    if (month && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // Handle "Day Month" like "5 July" or "5th July 2026"
  const dayMonthMatch = raw.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([a-z\u0C00-\u0C7F]+)(?:\s+(\d{4}))?/i);
  if (dayMonthMatch) {
    const day = parseInt(dayMonthMatch[1], 10);
    const monthKey = dayMonthMatch[2].toLowerCase();
    const year = dayMonthMatch[3] ? parseInt(dayMonthMatch[3], 10) : currentYear;
    const month = MONTH_MAP[monthKey];
    if (month && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // Handle DD/MM/YYYY or MM/DD/YYYY — assume DD/MM/YYYY for church context
  const slashMatch = raw.match(/^(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?$/);
  if (slashMatch) {
    const d = parseInt(slashMatch[1], 10);
    const m = parseInt(slashMatch[2], 10);
    const y = slashMatch[3] ? parseInt(slashMatch[3], 10) : currentYear;
    const fullYear = y < 100 ? 2000 + y : y;
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${fullYear}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  // Fall back — return as-is and let the app handle it
  return raw;
};

const normalizeDateTime = (raw: string | undefined, baseDate: Date = new Date()): string | undefined => {
  if (!raw) return undefined;

  // If already has time component, normalize just the date part
  const withTimeMatch = raw.match(/^(.+?)[T\s](\d{2}:\d{2}(?::\d{2})?)/);
  if (withTimeMatch) {
    const dateNorm = normalizeDate(withTimeMatch[1], baseDate);
    if (dateNorm) return `${dateNorm}T${withTimeMatch[2].length === 5 ? withTimeMatch[2] + ':00' : withTimeMatch[2]}`;
  }

  // No time — just normalize the date
  return normalizeDate(raw, baseDate);
};


const getSystemPrompt = (currentDraft: EventDraft, conflicts: string[] = [], selectedLang: 'en' | 'te' = 'en') => {
  const now = new Date();
  const currentDayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
  const currentDateStr = now.toISOString().split('T')[0];
  const currentTimeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed

  const isTelugu = selectedLang === 'te';

  const langInstructions = isTelugu ? `
CRITICAL LANGUAGE RULE (HIGHEST PRIORITY):
- You MUST write all your response messages (questions, summaries, confirmations) strictly and ONLY in natural, easily understandable, everyday Telugu. Do NOT use English translations.
- Do NOT use broken, robotic, or overly formal bookish Telugu. Speak like a helpful church assistant speaking to a pastor.
- You MUST save all event details (title, venue, notes, etc.) exactly in Telugu inside the <updateDraft> JSON block.
- Address the Pastor as "పాస్టర్ గారు".
` : `
CRITICAL LANGUAGE RULE (HIGHEST PRIORITY):
- You MUST write all your response messages (questions, summaries, confirmations) strictly and ONLY in English. Do NOT use Telugu.
- You MUST save all event details (title, venue, notes, etc.) in English inside the <updateDraft> JSON block.
- Address the Pastor as "Pastor".
`;

  const exampleConversation = isTelugu ? `
### updateDraft ఫార్మాట్ ఉదాహరణ (ఇవి ఉదాహరణ మాత్రమే, వాడకండి):
మీ ప్రతి సందేశం చివరలో ఇలాంటి JSON బ్లాక్ జోడించండి:
<updateDraft>{"title": "[user చెప్పిన పేరు]", "startDateTime": "2026-MM-DDThh:mm:ss", "endDateTime": "2026-MM-DDThh:mm:ss", "venueName": "[user చెప్పిన వేదిక]", "city": "[user చెప్పిన పట్టణం]", "address": "[user చెప్పిన చిరునామా]"}</updateDraft>
` : `
### updateDraft Format (format guide only — do not use these values):
At the end of every message, include a JSON block like this with ONLY the values the user actually said:
<updateDraft>{"title": "[actual title from user]", "startDateTime": "2026-MM-DDThh:mm:ss", "endDateTime": "2026-MM-DDThh:mm:ss", "venueName": "[actual venue from user]", "city": "[actual city from user]", "address": "[actual address from user]"}</updateDraft>
`;

  return `
You are an AI assistant that helps users create church events through a natural conversation.

${langInstructions}

CRITICAL DATE RULES (STRICT):
- Today's Date is: ${currentDateStr} (Year: ${currentYear}, Month: ${currentMonth})
- Today is: ${currentDayOfWeek}
- Current Time is: ${currentTimeStr}

DATE HANDLING — READ CAREFULLY:
- The user will say dates naturally: "July 5", "June 30", "8", "next Sunday", "జూలై 5", "రేపు". ACCEPT ALL OF THESE. NEVER ask the user to type a date in any specific format.
- Your job is to SILENTLY CONVERT the date the user says into YYYY-MM-DD inside the <updateDraft> block only. The user never sees this.
- Default Year: If the user does not say a year, use ${currentYear}. Example: "July 5" → save "2026-07-05" in <updateDraft>.
- Default Month: If user says only a number like "5" or "8", assume CURRENT month (${currentMonth}) and year (${currentYear}). Example: "8" → "${currentYear}-${String(currentMonth).padStart(2,'0')}-08".
- Telugu months: జనవరి=01, ఫిబ్రవరి=02, మార్చి=03, ఏప్రిల్=04, మే=05, జూన్=06, జూలై=07, ఆగస్టు=08, సెప్టెంబర్=09, అక్టోబర్=10, నవంబర్=11, డిసెంబర్=12.
- If the user says a year explicitly, use that year.
- Relative: "tomorrow"/"రేపు" → ${new Date(Date.now()+86400000).toISOString().split('T')[0]}. "next Sunday" → calculate from today.
- In your conversational reply you can say things like "Got it, July 5th!" — but in <updateDraft> always write "2026-07-05".

### Conversation Rules
1. Ask only one question at a time.
2. After the user answers, remember the information and use it in your next response.
3. Never ask for information that has already been provided.
4. Every new question should include the details collected so far, so the user knows what has been recorded.
5. Maintain a running summary of the event as the conversation progresses.
6. If the user provides multiple details in one response, extract all of them and skip the questions for those fields.
7. ALWAYS output an <updateDraft> JSON block at the end of your response to silently save ANY newly provided details.
8. When all required details are collected, show a final summary, add "isReadyForConfirmation": true to your <updateDraft> block, and ask "Would you like me to create this event?".
9. IMPORTANT: DO NOT use Markdown formatting like bold (**text**) or asterisks (*) for bullets. The app's text component does not support Markdown. Use simple plain text and unicode bullet points (•) for lists.
10. TECHNICAL RULE (CRITICAL): Under NO circumstances should you translate the XML tag names <updateDraft> and </updateDraft>. They are part of the app's software parsing system and must always be printed exactly as <updateDraft> and </updateDraft> in standard English ASCII characters.

### Required Fields
* Event Name (title)
* Date, Start Time, End Time
* Venue Name (venueName)
* Town / Village (city)
* Full Address (address)

### SHORT ANSWER RULES (VERY IMPORTANT):
- Venue Name: Accept ANY short answer as-is. "CSI Church", "Church of God", "Bethel Church", "School Hall" are ALL perfectly valid. NEVER ask the user to be more specific about the venue name.
- Town/Village (city): A single word like "Kurnool", "Hyderabad", "Guntur", "Bangalore", "Koilakuntla" is a COMPLETE, VALID answer. Save it immediately. Do NOT ask for the district or state.
- Full Address: Accept short or brief answers. "Near bus stand", "Main road", "Beside school", "Near junction" are ALL valid addresses. Save them as-is. Do NOT say the address is incomplete.
- GENERAL RULE: If the user gives any answer (even one word) for a question you asked, ACCEPT IT and move on to the next missing field. NEVER say "Could you be more specific?" or ask for clarification unless the answer is completely blank or unintelligible.

### Optional Fields
* Audience, Speaker, Notes, Recurrence (save these into "notes" if provided)

CURRENT DRAFT STATUS (Internal tracking - DO NOT repeat this exact JSON to the user):
${JSON.stringify(currentDraft, null, 2)}
${conflicts.length > 0 ? `\nCRITICAL WARNING: The user's requested date/time conflicts with the following existing events: ${conflicts.join(', ')}.\nYou MUST politely warn the user about this conflict and ask if they are sure they want to proceed.` : ''}

### <updateDraft> format:
At the very end of your message, you MUST include a JSON block exactly like this to update the app's state:
<updateDraft>
{
  "title": "Youth Meeting",
  "startDateTime": "2026-07-12T18:00:00",
  "endDateTime": "2026-07-12T20:30:00",
  "venueName": "Church of God",
  "city": "Koilakuntla",
  "notes": "Invite all youth members. Bring a Bible.",
  "isReadyForConfirmation": false
}
</updateDraft>

${exampleConversation}
`;
};

const withRetry = async <T>(operation: () => Promise<T>, maxRetries = 2): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      if (error.message && error.message.includes('429') && i < maxRetries - 1) {
        let delayMs = 2000; // default 2s wait if parsing fails
        const waitMatch = error.message.match(/try again in ([\d\.]+)s/);
        if (waitMatch && waitMatch[1]) {
          delayMs = (parseFloat(waitMatch[1]) * 1000) + 500;
        } else {
          delayMs = delayMs * Math.pow(1.5, i);
        }
        delayMs = Math.min(delayMs, 5000); // Never wait more than 5 seconds
        console.warn(`Groq API 429 Rate Limit. Retrying in ${Math.round(delayMs)}ms...`);
        await new Promise(res => setTimeout(res, delayMs));
      } else {
        throw error;
      }
    }
  }
  throw new Error("Max retries exceeded");
};

export const sendToGroq = async (
  messages: Message[],
  currentDraft: EventDraft,
  onToolCall: (draftUpdate: Partial<EventDraft>) => void,
  conflicts: string[] = [],
  selectedLang: 'en' | 'te' = 'en'
): Promise<string> => {
  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('Groq API key is missing');
  }

  // Send the last 10 messages so the AI actually has context of the conversation
  const formattedMessages: any[] = [
    { role: 'system', content: getSystemPrompt(currentDraft, conflicts, selectedLang) },
    ...messages.filter(m => m.role !== 'system').slice(-10).map(m => ({
      role: m.role,
      content: m.content || '',
    }))
  ];

  const makeRequest = async (msgs: any[]) => {
    return withRetry(async () => {
      const systemMsg = msgs.find(m => m.role === 'system');
      const userMsgs = msgs.filter(m => m.role !== 'system');

      const providers = [
        {
          name: 'Groq',
          run: async () => {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
              },
              body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: msgs,
                max_tokens: 1000
              })
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Groq ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            return data.choices[0].message;
          }
        },
        {
          name: 'Gemini',
          run: async () => {
            const key = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
            if (!key) throw new Error('Gemini API key missing');
            
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${key}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                systemInstruction: systemMsg ? { parts: [{ text: systemMsg.content }] } : undefined,
                contents: userMsgs.map(m => ({
                  role: m.role === 'assistant' ? 'model' : 'user',
                  parts: [{ text: m.content }]
                })),
                generationConfig: { maxOutputTokens: 1000 }
              })
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Gemini ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            return { role: 'assistant', content: data.candidates[0].content.parts[0].text };
          }
        },
        {
          name: 'Sarvam',
          run: async () => {
            const key = process.env.EXPO_PUBLIC_SARVAM_API_KEY;
            if (!key) throw new Error('Sarvam API key missing');
            
            const response = await fetch('https://api.sarvam.ai/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'api-subscription-key': key
              },
              body: JSON.stringify({
                model: 'sarvam-30b',
                messages: msgs,
                max_tokens: 1000
              })
            });

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`Sarvam ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            return data.choices[0].message;
          }
        },
      ];

      let lastError: any = null;
      for (const provider of providers) {
        try {
          return await provider.run();
        } catch (e: any) {
          lastError = e;
          const isMissingKey = e.message?.includes('key missing');
          
          console.warn(`${provider.name} unavailable (${isMissingKey ? 'Not Configured' : e.message}), trying next provider...`);
        }
      }
      
      throw lastError;
    });
  };

  try {
    let responseMessage = await makeRequest(formattedMessages);
    let rawContent = responseMessage.content || "";
    let finalContent = rawContent;
    let draftUpdated = false;
    let latestDraft = { ...currentDraft };

    // Extract custom JSON tool call
    let toolMatch = finalContent.match(/<updateDraft>([\s\S]*?)<\/updateDraft>/i);
    let jsonToParse = null;
    
    if (toolMatch && toolMatch[1]) {
      jsonToParse = toolMatch[1];
    } else {
      // Fallback: Model might output raw JSON without tags — only match if it is ONLY JSON (starts with {)
      const trimmed = finalContent.trim();
      if (trimmed.startsWith('{') && trimmed.includes('"')) {
        jsonToParse = trimmed;
      }
    }

    if (jsonToParse) {
      try {
        let jsonStr = jsonToParse.trim();
        jsonStr = jsonStr.replace(/^```json/i, '').replace(/```$/i, '').trim();
        
        const firstBrace = jsonStr.indexOf('{');
        const lastBrace = jsonStr.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
          jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
        }
        
        jsonStr = jsonStr.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (m: string, g: string) => g ? "" : m);
        
        const stripTrailingCommas = (json: string): string => {
          let insideString = false;
          let result = '';
          let lastCommaIdx = -1;
          
          for (let i = 0; i < json.length; i++) {
            const char = json[i];
            if (char === '"' && (i === 0 || json[i-1] !== '\\')) {
              insideString = !insideString;
            }
            if (!insideString) {
              if (char === ',') {
                lastCommaIdx = result.length;
              } else if ((char === '}' || char === ']') && lastCommaIdx !== -1) {
                const slice = result.slice(lastCommaIdx + 1);
                if (slice.trim() === '') {
                  result = result.slice(0, lastCommaIdx) + slice;
                }
                lastCommaIdx = -1;
              } else if (!/\s/.test(char)) {
                lastCommaIdx = -1;
              }
            }
            result += char;
          }
          return result;
        };

        const cleanedJson = stripTrailingCommas(jsonStr);
        const args = JSON.parse(cleanedJson);
        if (args.startDateTime) args.startDateTime = normalizeDateTime(args.startDateTime) ?? args.startDateTime;
        if (args.endDateTime) args.endDateTime = normalizeDateTime(args.endDateTime) ?? args.endDateTime;
        onToolCall(args);
        latestDraft = { ...latestDraft, ...args };
        draftUpdated = true;
      } catch (e) {
        console.error("Failed to parse tool JSON", e, "Raw string:", jsonToParse);
      }
    }

    // Clean up the text by removing the tag block and any residual broken tags
    finalContent = finalContent.replace(/<updateDraft>[\s\S]*?<\/updateDraft>/gi, '').trim();
    finalContent = finalContent.replace(/<updateDraft>[\s\S]*/gi, '').trim();
    
    if (!finalContent) {
      const askNext = (en: string, te: string) => selectedLang === 'te' ? te : en;

      if (draftUpdated) {
        // Smart fallback: ask the next missing field
        if (!latestDraft.title) {
          return askNext("What is the name of the event?", "ఈవెంట్ పేరు ఏమిటి?");
        } else if (!latestDraft.startDateTime) {
          return askNext(`Great! "${latestDraft.title}" noted. What date should I schedule it?`, `చాలా బాగుంది! "${latestDraft.title}" నోట్ చేసాను. ఏ తేదీన schedule చేయాలి?`);
        } else if (!latestDraft.endDateTime) {
          return askNext("Got the date! What time does it start, and when does it end?", "తేదీ నోట్ చేసాను! ఏ సమయానికి మొదలవుతుంది మరియు ఎప్పుడు ముగుస్తుంది?");
        } else if (!latestDraft.venueName) {
          return askNext("Great! What is the venue name?", "చాలా బాగుంది! వేదిక పేరు ఏమిటి?");
        } else if (!latestDraft.city) {
          return askNext("Which town or village is the venue in?", "వేదిక ఏ పట్టణంలో లేదా గ్రామంలో ఉంది?");
        } else if (!latestDraft.address) {
          return askNext("What is the full address of the venue?", "వేదిక పూర్తి చిరునామా ఏమిటి?");
        } else {
          return askNext("Got it! Would you like to add any notes?", "అర్థమైంది! ఏమైనా నోట్స్ చేర్చాలా?");
        }
      } else {
        // ── RESCUE INTERCEPTOR ──────────────────────────────────────────────
        // AI returned nothing useful. Detect what was just asked and save directly.
        const userAnswer = messages[messages.length - 1]?.content?.trim() || '';
        const lastAiMsg = [...messages].reverse().find(m => m.role === 'assistant')?.content?.toLowerCase() || '';

        if (userAnswer) {
          const askedVenue = lastAiMsg.includes('venue') || lastAiMsg.includes('వేదిక పేరు') || lastAiMsg.includes('church name');
          const askedCity  = lastAiMsg.includes('town') || lastAiMsg.includes('village') || lastAiMsg.includes('పట్టణం') || lastAiMsg.includes('గ్రామం') || lastAiMsg.includes('city');
          const askedAddr  = lastAiMsg.includes('address') || lastAiMsg.includes('చిరునామా') || lastAiMsg.includes('full address');
          const askedTitle = lastAiMsg.includes('name of the event') || lastAiMsg.includes('ఈవెంట్ పేరు') || lastAiMsg.includes('event name');
          const askedNotes = lastAiMsg.includes('notes') || lastAiMsg.includes('నోట్స్');

          if (askedVenue && !currentDraft.venueName) {
            onToolCall({ venueName: userAnswer });
            return askNext(`Got it! Venue is "${userAnswer}". Which town or village is it in?`, `అర్థమైంది! వేదిక "${userAnswer}". ఇది ఏ పట్టణంలో లేదా గ్రామంలో ఉంది?`);
          } else if (askedCity && !currentDraft.city) {
            onToolCall({ city: userAnswer });
            return askNext(`Got it! Location is ${userAnswer}. What is the full address?`, `అర్థమైంది! ${userAnswer}లో ఉంది. పూర్తి చిరునామా ఏమిటి?`);
          } else if (askedAddr && !currentDraft.address) {
            onToolCall({ address: userAnswer });
            return askNext("Got it! Would you like to add any notes?", "అర్థమైంది! ఏమైనా నోట్స్ చేర్చాలా?");
          } else if (askedTitle && !currentDraft.title) {
            onToolCall({ title: userAnswer });
            return askNext(`Great! "${userAnswer}" noted. What date should I schedule it?`, `చాలా బాగుంది! "${userAnswer}" నోట్ చేసాను. ఏ తేదీన schedule చేయాలి?`);
          } else if (askedNotes) {
            onToolCall({ notes: userAnswer });
            return askNext("Got it! Anything else to add?", "అర్థమైంది! ఇంకేమైనా చేర్చాలా?");
          }
        }

        // Absolute last resort
        return selectedLang === 'te' ? "దయచేసి కొంచెం వివరంగా చెప్పగలరా?" : "Could you tell me a bit more?";
      }
    }
    
    return finalContent;
  } catch (error) {
    console.error('Error communicating with Groq:', error);
    throw error;
  }
};

export const transcribeAudio = async (fileUri: string, selectedLang: 'en' | 'te' = 'en'): Promise<string> => {
  const apiKey = process.env.EXPO_PUBLIC_GROQ_API_KEY;
  if (!apiKey) throw new Error('Groq API key missing');

  const formData = new FormData();
  formData.append('file', {
    uri: fileUri,
    type: 'audio/m4a',
    name: 'audio.m4a'
  } as any);
  formData.append('model', 'whisper-large-v3');
  
  if (selectedLang === 'te') {
    formData.append('language', 'te');
    formData.append('prompt', 'నమస్కారం, దయచేసి ఈ ఆడియోను తెలుగులో రాయండి.');
  } else {
    formData.append('language', 'en');
    formData.append('prompt', 'Hello, please transcribe this audio accurately in English.');
  }

  try {
    return await withRetry(async () => {
      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        const err = await response.text();
        console.error('Whisper error:', err);
        throw new Error(`Whisper transcription failed (HTTP ${response.status}): ${err}`);
      }

      const data = await response.json();
      return data.text;
    });
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw error;
  }
};
