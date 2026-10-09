const admin = require('firebase-admin');
const axios = require('axios');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccount = require('../key.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const UNSPLASH_ACCESS_KEY = 'ppd4mBIqu8573rS42D9fobzAipdPsYdKkfOD0A5yiQc';

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

async function runTest() {
  console.log('Fetching Unsplash backgrounds for TODAY and FUTURE 5 DAYS...');
  
  const metaDoc = await db.collection('daily_verses_meta').doc('metadata').get();
  if (!metaDoc.exists) {
      console.log('No metadata');
      return process.exit(0);
  }
  const totalVerses = metaDoc.data().totalVerses || 0;
  if (totalVerses === 0) {
      console.log('Total verses 0');
      return process.exit(0);
  }

  const today = new Date();
  const targetDates = [];
  
  // Today + future 5 days to prevent this happening at midnight again
  for (let i = 0; i <= 5; i++) {
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
  console.log('Target indices:', missingIndices);

  if (missingIndices.length === 0) return process.exit(0);

  const snapshot = await db.collection('daily_verses').where('index', 'in', missingIndices).get();
  
  let updatedCount = 0;
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (!data.backgroundUrl) {
      const randomTheme = THEMES[Math.floor(Math.random() * THEMES.length)];
      console.log(`Fetching image for verse ${data.index} with theme: ${randomTheme}`);
      
      try {
        const res = await axios.get('https://api.unsplash.com/photos/random', {
          params: {
            query: randomTheme,
            orientation: 'portrait',
            content_filter: 'high'
          },
          headers: {
            'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`
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
          console.log(`SUCCESS: Added image to verse index ${data.index}`);
        }
      } catch (e) {
        console.error(`ERROR: Failed to fetch from Unsplash for verse ${data.index}:`, e.response?.data || e.message);
      }
    } else {
        console.log(`Verse ${data.index} already has an image.`);
    }
  }
  
  console.log(`Finished. Updated ${updatedCount} verses.`);
  process.exit(0);
}

runTest();
