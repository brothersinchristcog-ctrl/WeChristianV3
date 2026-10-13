import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore } from 'firebase-admin/firestore';
import axios from 'axios';
const THEMES = [
    'christian cross',
    'jesus light',
    'nature sunrise',
    'mountains sunset',
    'bible prayer',
    'heavenly clouds',
    'hope light',
    'peaceful water'
];
/**
 * Scheduled cron job to run every day at 11:00 PM (23:00) server time.
 * It fetches the next 3 days of verses and ensures they have a backgroundUrl.
 */
export const generateVerseBackgroundsV2 = onSchedule({
    schedule: '0 23 * * *',
    timeZone: 'America/New_York'
}, async (event) => {
    console.log('[generateVerseBackgroundsV2] Starting Unsplash fetch job...');
    const db = getFirestore();
    // We check metadata for total verses
    const metaDoc = await db.collection('daily_verses_meta').doc('metadata').get();
    if (!metaDoc.exists)
        return;
    const totalVerses = metaDoc.data()?.totalVerses || 0;
    if (totalVerses === 0)
        return;
    const today = new Date();
    const targetDates = [];
    // Target today + next 2 days to ensure we are ahead of schedule
    for (let i = 0; i < 3; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        targetDates.push(d);
    }
    const EPOCH = new Date('2024-01-01T00:00:00Z');
    const requiredIndices = new Set();
    targetDates.forEach(date => {
        const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const epochDate = new Date(EPOCH.getFullYear(), EPOCH.getMonth(), EPOCH.getDate());
        const daysSinceEpoch = Math.floor((localDate.getTime() - epochDate.getTime()) / (1000 * 60 * 60 * 24));
        requiredIndices.add((daysSinceEpoch * 4 + 0) % totalVerses);
        requiredIndices.add((daysSinceEpoch * 4 + 1) % totalVerses);
        requiredIndices.add((daysSinceEpoch * 4 + 2) % totalVerses);
        requiredIndices.add((daysSinceEpoch * 4 + 3) % totalVerses);
    });
    const missingIndices = Array.from(requiredIndices);
    if (missingIndices.length === 0)
        return;
    const snapshot = await db.collection('daily_verses').where('index', 'in', missingIndices).get();
    let updatedCount = 0;
    for (const doc of snapshot.docs) {
        const data = doc.data();
        if (!data.backgroundUrl) {
            // We need to fetch an image for this verse
            const randomTheme = THEMES[Math.floor(Math.random() * THEMES.length)];
            try {
                const res = await axios.get('https://api.unsplash.com/photos/random', {
                    params: {
                        query: randomTheme,
                        orientation: 'portrait',
                        content_filter: 'high'
                    },
                    headers: {
                        'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
                    }
                });
                const imageUrl = res.data?.urls?.regular;
                if (imageUrl) {
                    await doc.ref.update({
                        backgroundUrl: imageUrl,
                        unsplashPhotographer: res.data?.user?.name || 'Unsplash',
                        backgroundTheme: randomTheme
                    });
                    updatedCount++;
                    console.log(`[generateVerseBackgroundsV2] Added image to verse index ${data.index} (${randomTheme})`);
                }
            }
            catch (e) {
                console.error(`[generateVerseBackgroundsV2] Error fetching from Unsplash:`, e.response?.data || e.message);
            }
        }
    }
    console.log(`[generateVerseBackgroundsV2] Job finished. Updated ${updatedCount} verses.`);
});
//# sourceMappingURL=verseBackgrounds.js.map