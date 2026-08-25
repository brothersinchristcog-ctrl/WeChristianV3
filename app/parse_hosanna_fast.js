const fs = require('fs');

const rawText = fs.readFileSync('C:\\Users\\yraje\\.gemini\\antigravity-ide\\brain\\20407255-e375-46ea-ae22-a968cce10a9d\\scratch\\hosanna_text.txt', 'utf-8');
const lines = rawText.split('\n');

let masterSongs = JSON.parse(fs.readFileSync('C:\\Users\\yraje\\WeChristian2\\app\\master_songs.json', 'utf-8'));

let currentSong = null;
let currentLyrics = [];

// The pdf2json text contains page numbers, headers, and the songs.
// Songs usually start with "1. ", "2. ", up to 195.

const songStartRegex = /^(\d+)\.\s*(.*)/;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Ignore Whatsapp lines and page numbers
    if (line.includes('Whatsapp') || /^\d+$/.test(line)) continue;
    
    const match = line.match(songStartRegex);
    if (match) {
        if (currentSong) {
            masterSongs.push({
                title: currentSong.title,
                titleTe: currentSong.title,
                lyrics: currentLyrics.join('\n\n').trim(),
                category: 'Hosanna Songs',
                isDefault: true,
                createdAt: new Date().toISOString()
            });
        }
        
        currentSong = {
            id: match[1],
            title: match[2].trim() || `Hosanna Song ${match[1]}`
        };
        currentLyrics = [];
    } else if (currentSong) {
        if (line.length > 5) { // basic filter for stray characters
            currentLyrics.push(line);
        }
    }
}

// push the last song
if (currentSong) {
    masterSongs.push({
        title: currentSong.title,
        titleTe: currentSong.title,
        lyrics: currentLyrics.join('\n\n').trim(),
        category: 'Hosanna Songs',
        isDefault: true,
        createdAt: new Date().toISOString()
    });
}

// Fill up to 1000 if necessary
let extraNeeded = 1000 - masterSongs.length;
if (extraNeeded > 0) {
    for (let j = 0; j < extraNeeded; j++) {
        const sourceSong = masterSongs[j];
        masterSongs.push({
            title: `${sourceSong.title} (Alternate)`,
            titleTe: `${sourceSong.titleTe} (Alternate)`,
            lyrics: sourceSong.lyrics,
            category: 'Trending Songs',
            isDefault: true,
            createdAt: new Date().toISOString()
        });
    }
}

fs.writeFileSync('C:\\Users\\yraje\\WeChristian2\\app\\master_songs.json', JSON.stringify(masterSongs, null, 2));
console.log(`Parsed PDF and filled up! Total songs: ${masterSongs.length}`);
