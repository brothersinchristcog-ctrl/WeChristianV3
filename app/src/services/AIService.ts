import functions from '@react-native-firebase/functions';

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
  private get fn() {
    return functions();
  }

  public async generateSermon(params: SermonParams): Promise<string> {
    try {
      const callable = this.fn.httpsCallable('generateSermonV5');
      const response = await callable(params);
      const data = response.data as { success: boolean; text: string };
      if (data.success) return data.text;
      throw new Error('Failed to generate sermon');
    } catch (error) {
      console.error('AIService generateSermon Error:', error);
      throw error;
    }
  }

  public async generateContentImage(params: ContentImageParams): Promise<string> {
    try {
      const callable = this.fn.httpsCallable('generateContentImage');
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
