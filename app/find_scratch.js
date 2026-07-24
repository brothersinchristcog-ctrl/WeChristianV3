const fs = require('fs');

// The key insight: CODE_ACTION diffs show what CHANGED
// We need to understand what the FINAL state looked like from the diffs
// The most reliable way is to look at the scratch files that were saved during the sessions

// Check for scratch files
const scratchDir1 = 'C:/Users/yraje/.gemini/antigravity-ide/brain/7d7dc0a8-7bc9-424b-8f83-cbf9c5590d4c/scratch';
const scratchDir2 = 'C:/Users/yraje/.gemini/antigravity-ide/brain/e4115603-2fea-4251-a0eb-50352c677516/scratch';

function listDir(dir) {
    try {
        if (!fs.existsSync(dir)) { console.log('Dir not found:', dir); return; }
        const files = fs.readdirSync(dir, { recursive: true });
        files.forEach(f => {
            const full = dir + '/' + f;
            const stat = fs.statSync(full);
            if (stat.isFile()) {
                console.log(`  ${f} (${stat.size} bytes)`);
            }
        });
    } catch(e) { console.log('Error:', e.message); }
}

console.log('=== Chat1 Scratch Files ===');
listDir(scratchDir1);
console.log('\n=== Chat2 Scratch Files ===');
listDir(scratchDir2);
