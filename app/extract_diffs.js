const fs = require('fs');

function extractAllDiffs(transcriptPath) {
    const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(Boolean);
    const fileChanges = {};
    
    for (const line of lines) {
        try {
            const obj = JSON.parse(line);
            const content = obj.content || '';
            
            if (obj.type === 'CODE_ACTION' && content.includes('changes were made')) {
                // Extract the file path
                const fileMatch = content.match(/changes were made by the \S+ tool to: ([^\.\n]+(?:\.tsx|\.ts|\.js))/);
                if (!fileMatch) continue;
                const filePath = fileMatch[1].trim();
                
                if (!fileChanges[filePath]) fileChanges[filePath] = [];
                fileChanges[filePath].push(content);
            }
        } catch(e) {}
    }
    
    return fileChanges;
}

const chat1Path = 'C:/Users/yraje/.gemini/antigravity-ide/brain/7d7dc0a8-7bc9-424b-8f83-cbf9c5590d4c/.system_generated/logs/transcript_full.jsonl';
const chat2Path = 'C:/Users/yraje/.gemini/antigravity-ide/brain/e4115603-2fea-4251-a0eb-50352c677516/.system_generated/logs/transcript_full.jsonl';

const chat1Changes = extractAllDiffs(chat1Path);
const chat2Changes = extractAllDiffs(chat2Path);

console.log('=== Chat 7d7dc0a8 (Refactoring WeCelebrations - 3hrs ago) ===');
Object.keys(chat1Changes).forEach(f => {
    console.log(`  ${f}: ${chat1Changes[f].length} change(s)`);
});

console.log('\n=== Chat e4115603 (Managing Admin Celebrations - 6hrs ago) ===');
Object.keys(chat2Changes).forEach(f => {
    console.log(`  ${f}: ${chat2Changes[f].length} change(s)`);
});

// Save for use in restoration
fs.writeFileSync('chat1_changes.json', JSON.stringify(chat1Changes, null, 2));
fs.writeFileSync('chat2_changes.json', JSON.stringify(chat2Changes, null, 2));
console.log('\nSaved change data to chat1_changes.json and chat2_changes.json');
