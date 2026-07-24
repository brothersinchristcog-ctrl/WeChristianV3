const fs = require('fs');

function getFilesFromTranscript(transcriptPath) {
    if (!fs.existsSync(transcriptPath)) {
        console.log('Not found:', transcriptPath);
        return [];
    }
    const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(Boolean);
    console.log('Lines:', lines.length);
    
    const filesChanged = new Set();
    for (const line of lines) {
        try {
            const obj = JSON.parse(line);
            // Check all string values in the object recursively
            const checkValue = (val) => {
                if (typeof val === 'string') {
                    if ((val.endsWith('.tsx') || val.endsWith('.ts')) && val.includes('WeChristian2')) {
                        filesChanged.add(val);
                    }
                } else if (val && typeof val === 'object') {
                    Object.values(val).forEach(checkValue);
                }
            };
            checkValue(obj);
        } catch(e) {}
    }
    return Array.from(filesChanged);
}

console.log('=== Chat 7d7dc0a8 (Refactoring WeCelebrations - 3hrs ago) ===');
const chat1 = getFilesFromTranscript('C:/Users/yraje/.gemini/antigravity-ide/brain/7d7dc0a8-7bc9-424b-8f83-cbf9c5590d4c/.system_generated/logs/transcript_full.jsonl');
chat1.forEach(f => console.log(' -', f));

console.log('\n=== Chat e4115603 (Managing Admin Celebrations - 6hrs ago) ===');
const chat2 = getFilesFromTranscript('C:/Users/yraje/.gemini/antigravity-ide/brain/e4115603-2fea-4251-a0eb-50352c677516/.system_generated/logs/transcript_full.jsonl');
chat2.forEach(f => console.log(' -', f));
