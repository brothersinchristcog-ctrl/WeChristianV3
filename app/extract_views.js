const fs = require('fs');

// Extract the LAST VIEW_FILE content for each admin file
// The last view gives us the final state of each file in that session
function extractLastViewedContent(transcriptPath) {
    const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(Boolean);
    const lastViewed = {};
    
    for (const line of lines) {
        try {
            const obj = JSON.parse(line);
            if (obj.type === 'VIEW_FILE' && obj.content) {
                const content = obj.content;
                // Extract file path
                const pathMatch = content.match(/File Path: `file:\/\/\/([^`]+)`/);
                if (pathMatch) {
                    const filePath = pathMatch[1].replace(/\//g, '\\');
                    if (filePath.includes('admin') || filePath.includes('Admin')) {
                        lastViewed[filePath] = content;
                    }
                }
            }
        } catch(e) {}
    }
    
    return lastViewed;
}

const chat1Path = 'C:/Users/yraje/.gemini/antigravity-ide/brain/7d7dc0a8-7bc9-424b-8f83-cbf9c5590d4c/.system_generated/logs/transcript_full.jsonl';
const chat2Path = 'C:/Users/yraje/.gemini/antigravity-ide/brain/e4115603-2fea-4251-a0eb-50352c677516/.system_generated/logs/transcript_full.jsonl';

const chat1Views = extractLastViewedContent(chat1Path);
const chat2Views = extractLastViewedContent(chat2Path);

console.log('=== Last viewed files in chat1 ===');
Object.keys(chat1Views).forEach(f => {
    const lineCount = chat1Views[f].split('\n').length;
    console.log(`  ${f}: ${lineCount} lines`);
});

console.log('\n=== Last viewed files in chat2 ===');
Object.keys(chat2Views).forEach(f => {
    const lineCount = chat2Views[f].split('\n').length;
    console.log(`  ${f}: ${lineCount} lines`);
});
