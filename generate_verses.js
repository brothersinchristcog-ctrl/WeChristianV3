const https = require('https');
const fs = require('fs');

const fetchJSON = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const cleanData = data.replace(/^\uFEFF/, '');
          resolve(JSON.parse(cleanData));
        } catch (e) {
          console.error("Failed parsing URL:", url);
          console.error("First 100 chars of data:", data.substring(0, 100));
          reject(e);
        }
      });
    }).on('error', reject);
  });
};

const EN_URL = 'https://raw.githubusercontent.com/godlytalias/Bible-Database/master/English/bible.json';
const TE_URL = 'https://raw.githubusercontent.com/godlytalias/Bible-Database/master/Telugu/bible.json';

// Books we want to extract verses from (0-indexed in array)
// Genesis (0), Psalms (18), Proverbs (19), Isaiah (22), Matthew (39), Mark (40), Luke (41), John (42), Romans (44), Philippians (49)
const TARGET_BOOKS = [18, 19, 39, 42, 44, 49]; 
const BOOK_NAMES_EN = {
  18: "Psalms", 19: "Proverbs", 39: "Matthew", 42: "John", 44: "Romans", 49: "Philippians"
};
const BOOK_NAMES_TE = {
  18: "కీర్తనలు", 19: "సామెతలు", 39: "మత్తయి", 42: "యోహాను", 44: "రోమీయులకు", 49: "ఫిలిప్పీయులకు"
};

async function main() {
  try {
    console.log("Downloading English Bible...");
    const enBible = await fetchJSON(EN_URL);
    console.log("Downloading Telugu Bible...");
    const teBible = await fetchJSON(TE_URL);

    console.log("Extracting verses...");
    if (enBible.Book) console.log("EN Books count:", enBible.Book.length);
    if (teBible.Book) console.log("TE Books count:", teBible.Book.length);
    
    const combinedVerses = [];

    for (let bookIdx of TARGET_BOOKS) {
      const enBook = enBible.Book ? enBible.Book[bookIdx] : enBible[bookIdx];
      const teBook = teBible.Book ? teBible.Book[bookIdx] : teBible[bookIdx];
      
      if (!enBook || !teBook) continue;

      const nameEn = BOOK_NAMES_EN[bookIdx];
      const nameTe = BOOK_NAMES_TE[bookIdx];

      for (let c = 0; c < enBook.Chapter.length; c++) {
        const enChapter = enBook.Chapter[c];
        const teChapter = teBook.Chapter[c];
        
        if (!enChapter || !teChapter) continue;

        for (let v = 0; v < enChapter.Verse.length; v++) {
          const enVerseStr = enChapter.Verse[v].Verse.trim();
          let teVerseStr = '';
          
          if (teChapter.Verse && teChapter.Verse[v] && teChapter.Verse[v].Verse) {
             teVerseStr = teChapter.Verse[v].Verse.trim();
          }

          if (enVerseStr && teVerseStr && teVerseStr.length > 5) { // Ensure translation exists and isn't just whitespace
            combinedVerses.push({
              verseEn: enVerseStr,
              verseTe: teVerseStr,
              referenceEn: `${nameEn} ${c + 1}:${v + 1}`,
              referenceTe: `${nameTe} ${c + 1}:${v + 1}`
            });
          }
        }
      }
    }

    // Shuffle verses so they are mixed up when presented daily
    for (let i = combinedVerses.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [combinedVerses[i], combinedVerses[j]] = [combinedVerses[j], combinedVerses[i]];
    }

    console.log(`Generated ${combinedVerses.length} verses!`);
    fs.writeFileSync('bulk_verses.json', JSON.stringify(combinedVerses, null, 2));
    console.log("Saved to bulk_verses.json successfully.");

  } catch (err) {
    console.error("Error:", err);
  }
}

main();
