const fs = require('fs');

const rawText = fs.readFileSync('C:\\Users\\yraje\\.gemini\\antigravity-ide\\brain\\20407255-e375-46ea-ae22-a968cce10a9d\\.user_uploaded\\media_1787691780868.txt', 'utf-8');
const lines = rawText.split('\n');

let masterSongs = JSON.parse(fs.readFileSync('C:\\Users\\yraje\\WeChristian2\\app\\master_songs.json', 'utf-8'));
// Keep the original 975 songs (780 + 195 Hosanna)
masterSongs = masterSongs.slice(0, 975);

let currentSong = null;
let currentLyricsTe = [];

const isSongStart = (line) => !!line.match(/పాట\s*-\s*\d+/);

const extractTelugu = (line) => {
    let out = line.replace(/[a-zA-Z]/g, '').trim();
    out = out.replace(/^\d+\.\s*/, '');
    out = out.replace(/^[పఅష]+\.?॥?\s*/g, '');
    out = out.replace(/[॥_()]/g, '');
    return out.trim();
};

const extractEnglish = (line) => {
    let out = line.replace(/[\u0C00-\u0C7F]/g, '').trim();
    out = out.replace(/^\d+\.\s*/, '');
    out = out.replace(/^[a-z]+\.?॥?\s*/i, '');
    out = out.replace(/[॥_()]/g, '');
    return out.trim();
};

for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (line.match(/SOURCE PAGES/)) continue;
    if (line.match(/^[a-z\d\s]+$/i) && line.length < 15) continue;
    
    if (isSongStart(line)) {
        if (currentSong && currentLyricsTe.length > 0) {
            masterSongs.push({
                title: currentSong.titleEn || currentSong.titleTe || 'Nycil Song',
                titleTe: currentSong.titleTe || 'Nycil Song',
                lyrics: currentLyricsTe.join('\n\n').trim(),
                category: 'Stuthi Songs',
                isDefault: true,
                createdAt: new Date().toISOString()
            });
        }
        
        currentSong = { titleTe: '', titleEn: '' };
        currentLyricsTe = [];
        continue;
    }
    
    if (currentSong) {
        let te = extractTelugu(line);
        let en = extractEnglish(line);
        
        if (te.length > 3) {
            currentLyricsTe.push(te);
            if (!currentSong.titleTe) {
                currentSong.titleTe = te;
                currentSong.titleEn = en;
            }
        }
    }
}

// push last song
if (currentSong && currentLyricsTe.length > 0) {
    masterSongs.push({
        title: currentSong.titleEn || currentSong.titleTe || 'Nycil Song',
        titleTe: currentSong.titleTe || 'Nycil Song',
        lyrics: currentLyricsTe.join('\n\n').trim(),
        category: 'Stuthi Songs',
        isDefault: true,
        createdAt: new Date().toISOString()
    });
}

const uniqueSongs = [];
const seen = new Set();
for (const s of masterSongs) {
    if (!seen.has(s.title)) {
        seen.add(s.title);
        uniqueSongs.push(s);
    }
}

fs.writeFileSync('C:\\Users\\yraje\\WeChristian2\\app\\master_songs.json', JSON.stringify(uniqueSongs, null, 2));
console.log(`Parsed successfully. Total unique songs: ${uniqueSongs.length}`);
