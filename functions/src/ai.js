import { onCall, HttpsError } from 'firebase-functions/v2/https';
export const generateSermonV9 = onCall({ enforceAppCheck: false, secrets: ['GROQ_API_KEY'] }, async (request) => {
    const data = request.data;
    try {
        const { topic, category, language, churchId } = data;
        if (!topic || !churchId) {
            throw new HttpsError('invalid-argument', 'Missing required fields');
        }
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            throw new HttpsError('failed-precondition', 'GROQ_API_KEY is not configured');
        }
        const systemPrompt = `You are an expert biblical theologian and experienced pastor with deep knowledge of the entire Holy Bible. You write sermons that are:
- BIBLICALLY ACCURATE: Every Bible reference must be a real verse that genuinely exists. Never invent or approximate verses. Double-check every reference before writing it.
- CORRECTLY NAMED: Use exact, correct Bible book names. Examples: "1 Corinthians" not "Corinthians", "Philippians" not "Phillipians", "Ecclesiastes" not "Ecclesiasticus".
- BILINGUAL BIBLE BOOK NAMES: When writing in Telugu or when the language is Telugu, always show Bible book names in BOTH Telugu and English side by side. Examples: "యోహాను (John) 3:16", "కీర్తనలు (Psalms) 23:1", "రోమీయులకు (Romans) 8:28", "ఆదికాండము (Genesis) 1:1", "యిర్మీయా (Jeremiah) 1:5", "ఎఫెసీయులకు (Ephesians) 2:10", "ఫిలిప్పీయులకు (Philippians) 4:13", "1 కొరింథీయులకు (1 Corinthians) 13:4".
- FORMAT: Always write references as BookName Chapter:Verse. For Telugu sermons use: తెలుగుపేరు (English) Chapter:Verse.
- NON-REPETITIVE: Each section must introduce new content. Never repeat a verse, point, or explanation already used in a prior section.
- WELL-STRUCTURED: Each of the 5 sections must be clearly distinct in purpose and content.
- PRACTICAL: Ground theological points in real-life application for modern Christian believers.`;
        const userPrompt = `Write a full, detailed sermon in ${language || 'English'} on the topic: "${topic}" for a ${category || 'Christian'} gathering.

Use EXACTLY this Markdown structure — do NOT add extra sections or merge sections:

# Sermon: [Creative Title Related to Topic]

## 1. Introduction
Write 2-3 paragraphs introducing the topic. Explain its biblical and spiritual significance. Do NOT quote Bible verses in this section — just set the context and engage the reader.

## 2. Key Bible Verses
List exactly 4 real Bible verses directly related to "${topic}". For each verse use this exact format:
**Book Chapter:Verse** — "Full verse text in quotes" — One sentence explaining its relevance to the topic.

(Use 4 different books if possible. Each verse must be 100% real and accurately quoted.)

## 3. Main Message
Present 3 distinct theological points. Each point must:
- Have its own sub-heading
- Introduce a NEW angle on the topic not already covered
- Reference 1 or 2 verses NOT already used in section 2
- End with a one-sentence practical takeaway

### Point 1: [Heading]

### Point 2: [Heading]

### Point 3: [Heading]

## 4. Practical Application
Write 3-4 practical ways a Christian can apply this sermon's message in their daily life. Keep it actionable. Do NOT repeat any verse or point already made.

## 5. Conclusion & Closing Prayer
Write one closing paragraph summarizing the heart of the sermon. Then write a short, heartfelt closing prayer (2-3 sentences).`;
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'openai/gpt-oss-20b',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.65,
                max_tokens: 1800
            })
        });
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Groq API Error: ${errText}`);
        }
        const resData = await response.json();
        return { success: true, text: resData.choices[0]?.message?.content || '' };
    }
    catch (error) {
        console.error('generateSermonV9 Error:', error);
        throw new HttpsError('internal', error.message);
    }
});
export const generateContentImage = onCall({ enforceAppCheck: false, secrets: ['HUGGINGFACE_API_KEY'] }, async (request) => {
    try {
        const { prompt, churchId, orientation, style, contentType } = request.data;
        if (!prompt || !churchId) {
            throw new HttpsError('invalid-argument', 'Missing prompt or churchId');
        }
        const hfKey = process.env.HUGGINGFACE_API_KEY;
        let buffer = null;
        let providerUsed = 'huggingface';
        // Map dimensions based on orientation
        let width = 1024;
        let height = 1024;
        if (orientation === 'Landscape') {
            width = 1024;
            height = 576;
        }
        else if (orientation === 'Portrait') {
            width = 576;
            height = 1024;
        }
        // Enhance prompt for clean church visual output
        const enhancedPrompt = `${prompt}, ${style || 'Modern'} Christian graphic design, clean composition, professional lighting, photorealistic, 4k, no watermark, high quality`;
        // 1. Try Hugging Face Inference API (SD3 Medium)
        if (hfKey) {
            try {
                console.log('Calling Hugging Face Inference API with SD3 Medium...');
                const hfRes = await fetch('https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-3-medium-diffusers', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${hfKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        inputs: enhancedPrompt
                    })
                });
                if (hfRes.ok) {
                    buffer = await hfRes.arrayBuffer();
                    console.log(`Hugging Face generation succeeded (${buffer.byteLength} bytes)`);
                }
                else {
                    const errText = await hfRes.text();
                    console.warn(`Hugging Face API returned ${hfRes.status}: ${errText.slice(0, 200)}`);
                }
            }
            catch (hfErr) {
                console.warn('Hugging Face fetch error:', hfErr);
            }
        }
        // 2. Fallback to clean, watermark-free high-res sacred photography
        if (!buffer || buffer.byteLength === 0) {
            providerUsed = 'sacred_visuals';
            console.log('Using high-res church visual fallback...');
            const fallbackUrl = 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=1280&q=85';
            const response = await fetch(fallbackUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch visual: ${response.statusText}`);
            }
            buffer = await response.arrayBuffer();
        }
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
        return { success: true, imageUrl: publicUrl, provider: providerUsed };
    }
    catch (error) {
        console.error('generateContentImage Error:', error);
        throw new HttpsError('internal', error.message);
    }
});
//# sourceMappingURL=ai.js.map