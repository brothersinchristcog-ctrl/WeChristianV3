import { onCall, HttpsError } from 'firebase-functions/v2/https';
export const generateSermonV5 = onCall({ enforceAppCheck: false, secrets: ['GROQ_API_KEY'] }, async (request) => {
    try {
        const { topic, category, language, churchId } = request.data;
        if (!topic || !churchId) {
            throw new HttpsError('invalid-argument', 'Missing required fields');
        }
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            throw new HttpsError('failed-precondition', 'GROQ_API_KEY is not configured');
        }
        const prompt = `Write a detailed, structured sermon in ${language || 'English'} about "${topic}" suitable for a ${category || 'spiritual'} gathering. Format it in Markdown with sections for Introduction, Key Bible Verses, Main Message, and Conclusion.`;
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'openai/gpt-oss-20b',
                messages: [{ role: 'user', content: prompt }]
            })
        });
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Groq API Error: ${errText}`);
        }
        const data = await response.json();
        return { success: true, text: data.choices[0]?.message?.content || '' };
    }
    catch (error) {
        console.error('generateSermonV5 Error:', error);
        throw new HttpsError('internal', error.message);
    }
});
export const generateContentImage = onCall({ enforceAppCheck: false }, async (request) => {
    try {
        const { prompt, churchId } = request.data;
        if (!prompt || !churchId) {
            throw new HttpsError('invalid-argument', 'Missing prompt or churchId');
        }
        // Call Pollinations.ai
        const encodedPrompt = encodeURIComponent(prompt);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error(`Failed to generate image: ${response.statusText}`);
        }
        const buffer = await response.arrayBuffer();
        const { getStorage } = await import('firebase-admin/storage');
        const { randomUUID } = await import('crypto');
        const fileName = `churches/${churchId}/ai_content/img_${Date.now()}_${randomUUID()}.jpg`;
        const file = getStorage().bucket().file(fileName);
        const downloadToken = randomUUID();
        await file.save(Buffer.from(buffer), {
            contentType: 'image/jpeg',
            metadata: { metadata: { firebaseStorageDownloadTokens: downloadToken } }
        });
        const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${file.bucket.name}/o/${encodeURIComponent(file.name)}?alt=media&token=${downloadToken}`;
        return { success: true, imageUrl: publicUrl };
    }
    catch (error) {
        console.error('generateContentImage Error:', error);
        throw new HttpsError('internal', error.message);
    }
});
//# sourceMappingURL=ai.js.map