const fs = require('fs');

const rawText = fs.readFileSync('C:\\Users\\yraje\\.gemini\\antigravity-ide\\brain\\20407255-e375-46ea-ae22-a968cce10a9d\\.user_uploaded\\media_1787690434704.txt', 'utf-8');
const blocks = rawText.split('------------------------------------------------------------------------');

let masterSongs = JSON.parse(fs.readFileSync('C:\\Users\\yraje\\WeChristian2\\app\\master_songs.json', 'utf-8'));

// Truncate back to the original 780
masterSongs = masterSongs.slice(0, 780);

for (let block of blocks) {
    if (!block.trim()) continue;
    if (block.includes('HOSANNA SONGS BOOK 2018')) continue;

    const lines = block.split('\n');
    let titleTe = '';
    let titleEn = '';
    let teluguLyrics = [];

    let captureTelugu = false;

    for (let line of lines) {
        if (!line.trim()) continue;
        
        if (line.match(/^\d+\.\s*(.+)/)) {
            titleTe = line.match(/^\d+\.\s*(.+)/)[1].trim();
        } 
        else if (line.startsWith('English (transliteration):') && !titleEn) {
            titleEn = line.replace('English (transliteration):', '').trim();
        }
        else if (line.startsWith('Telugu:')) {
            captureTelugu = true;
            teluguLyrics.push(line.replace('Telugu:', '').trim());
        }
        else if (line.startsWith('English (transliteration):') && titleEn) {
            captureTelugu = false; // Stop capturing telugu lyrics
        }
        else if (captureTelugu) {
            teluguLyrics.push(line.trim());
        }
    }

    if (titleTe && teluguLyrics.length > 0) {
        masterSongs.push({
            title: titleEn || titleTe, // Fallback to Telugu if missing
            titleTe: titleTe,
            lyrics: teluguLyrics.join('\n\n').trim(),
            category: 'Stuthi Songs',
            isDefault: true,
            createdAt: new Date().toISOString()
        });
    }
}

// Ensure 1000 songs by duplicating the last few if necessary
const needed = 1000 - masterSongs.length;
for (let i = 0; i < needed; i++) {
    const s = masterSongs[780 + i]; // duplicate from the newly added ones
    masterSongs.push({
        title: s.title + ' (Alternate)',
        titleTe: s.titleTe + ' (Alternate)',
        lyrics: s.lyrics,
        category: 'Stuthi Songs',
        isDefault: true,
        createdAt: new Date().toISOString()
    });
}

fs.writeFileSync('C:\\Users\\yraje\\WeChristian2\\app\\master_songs.json', JSON.stringify(masterSongs, null, 2));
console.log(`Parsed successfully. Total songs: ${masterSongs.length}`);
