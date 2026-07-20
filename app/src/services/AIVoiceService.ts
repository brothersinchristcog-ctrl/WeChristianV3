import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '';
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';

class AIVoiceService {
  private recording: Audio.Recording | null = null;

  async startRecording(): Promise<void> {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        throw new Error('Microphone permission not granted');
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      this.recording = recording;
    } catch (err) {
      console.error('Failed to start recording', err);
      throw err;
    }
  }

  async stopRecording(): Promise<string | null> {
    try {
      if (!this.recording) return null;
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.recording = null;
      return uri;
    } catch (err) {
      console.error('Failed to stop recording', err);
      throw err;
    }
  }

  async transcribeAudio(uri: string): Promise<string> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error('Audio file does not exist');
      }

      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);
      formData.append('model', 'whisper-large-v3');

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API Error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      return data.text;
    } catch (err) {
      console.error('Transcription error', err);
      throw err;
    }
  }

  async extractEventDetails(transcript: string): Promise<any> {
    const prompt = `
You are an AI assistant helping a pastor create a church event.
Extract the event details from the following transcript and return ONLY a valid JSON object.
Do not include any markdown formatting, explanation, or code blocks. Just the raw JSON.

Fields to extract (if available, otherwise leave as empty string ""):
- title: string (The name of the event, e.g. "Sunday Service", "Youth Meeting")
- eventType: string
- date: string (YYYY-MM-DD format, relative to today. Assume today is ${new Date().toISOString()})
- startTime: string (e.g. "10:00 AM")
- endTime: string (e.g. "12:00 PM")
- venue: string (e.g., "Calvary Temple")
- address: string
- pinCode: string
- description: string
- notes: string

Transcript: "${transcript}"
`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20240620',
          max_tokens: 1024,
          messages: [
            { role: 'user', content: prompt }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic API Error: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      const content = data.content[0].text;
      
      const cleanedContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(cleanedContent);
    } catch (err) {
      console.error('Extraction error', err);
      throw err;
    }
  }
}

export default new AIVoiceService();
