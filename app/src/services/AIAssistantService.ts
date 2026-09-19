import { Platform } from 'react-native';

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '';

export interface ExtractedEventData {
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // "09:00 AM"
  endTime?: string; // "10:00 AM"
  venue: string;
  address?: string;
  description: string;
  notes?: string;
}

class AIAssistantService {
  async transcribeAudio(audioUri: string): Promise<string> {
    const formData = new FormData();
    
    // We need to pass the file correctly
    const filename = audioUri.split('/').pop() || 'recording.m4a';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `audio/${match[1]}` : `audio/m4a`;

    // React Native FormData accepts an object with uri, name, type
    formData.append('file', {
      uri: Platform.OS === 'android' ? audioUri : audioUri.replace('file://', ''),
      name: filename,
      type,
    } as any);
    
    formData.append('model', 'whisper-large-v3');
    
    const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Groq API Error:', errText);
      throw new Error(`Groq API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.text;
  }

  async extractEventDetails(transcript: string): Promise<ExtractedEventData> {
    const todayStr = new Date().toISOString().split('T')[0];
    const prompt = `You are an AI assistant for a church management app. Your job is to extract event details from a pastor's voice transcript. The transcript might be in English or Telugu.
    
    If the language is Telugu, translate the 'title' and 'description' to English, but feel free to put original language notes in 'notes'.
    
    Return ONLY a raw valid JSON object (without markdown wrappers like \`\`\`json) with the following structure:
    {
      "title": "Short descriptive event title",
      "date": "YYYY-MM-DD" (guess the date based on context, today is ${todayStr}, if they say "tomorrow" calculate it, if they just say a day like "Sunday", pick the upcoming Sunday),
      "startTime": "HH:MM AM/PM" (e.g. "09:00 AM", default to "10:00 AM" if not specified),
      "endTime": "HH:MM AM/PM" (optional, leave empty if not mentioned),
      "venue": "Venue name" (e.g. "Main Auditorium" or "Church", default to "Main Church" if not mentioned),
      "address": "Full address if mentioned",
      "description": "A short summary of the event",
      "notes": "Any other instructions or original Telugu text"
    }

    Transcript:
    "${transcript}"
    `;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.8-27b',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Groq AI Error:', errText);
      throw new Error(`Groq AI Error: ${response.status}`);
    }

    const data = await response.json();
    let text = data.choices[0].message.content;
    
    // Clean up potential markdown formatting
    if (text.startsWith('```json')) text = text.replace('```json', '');
    if (text.startsWith('```')) text = text.replace('```', '');
    if (text.endsWith('```')) text = text.substring(0, text.length - 3);
    
    return JSON.parse(text.trim());
  }
}

export default new AIAssistantService();
