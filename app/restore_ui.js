const fs = require('fs');
const transcriptPath = 'C:/Users/yraje/.gemini/antigravity-ide/brain/38c5f503-779f-4a96-b74d-9e250ff4b8c2/.system_generated/logs/transcript_full.jsonl';
const lines = fs.readFileSync(transcriptPath, 'utf-8').trim().split('\n');

function normalize(str) {
    return str.replace(/\s+/g, ' ').trim();
}

let modifications = {};

// We collect all multi_replace_file_content calls for Admin screens up to step 380 (before Dark Mode)
// Wait, AdminSubscriptionScreen redesign was in step 393! It wasn't Dark Mode, it was UI redesign!
// Actually, let's just collect ALL UI redesigns from the entire transcript. But how do we distinguish them from the Dark Mode changes?
// The Dark Mode changes were mostly done via `refactor_theme.js`. The only multi_replace for Dark Mode was `ThemeContext.tsx`.
// So if we just run this script for ANY file in `src/screens/admin/` excluding `ThemeContext.tsx`, we get all the UI redesigns!
// Wait! I did manually use multi_replace for AdminSubscriptionScreen and AdminChurchSettings in this session!
// Yes, and those are UI redesigns we WANT to restore!
// Were there any other multi_replace calls? No, all other 42 files were updated via the `refactor_theme.js` script (which doesn't use multi_replace)!
// This means EVERY multi_replace_file_content call targeting `src/screens/admin/` in the transcript is a UI redesign change we want to keep!

for (let i = 0; i < lines.length; i++) {
    try {
        const step = JSON.parse(lines[i]);
        
        if (step.tool_calls) {
            for (const call of step.tool_calls) {
                if (call.name === 'multi_replace_file_content') {
                    const args = call.args;
                    const targetFile = args.TargetFile;
                    
                    if (targetFile && (targetFile.includes('src/screens/admin/'))) {
                        if (!modifications[targetFile]) modifications[targetFile] = [];
                        modifications[targetFile].push(...args.ReplacementChunks);
                    }
                }
            }
        }
    } catch(e) {}
}

let restoredCount = 0;

for (const targetFile of Object.keys(modifications)) {
    let content = '';
    try {
        content = fs.readFileSync(targetFile, 'utf-8');
    } catch(e) { continue; }
    
    let originalContent = content;
    
    for (const chunk of modifications[targetFile]) {
        if (content.includes(chunk.TargetContent)) {
            content = content.replace(chunk.TargetContent, chunk.ReplacementContent);
        } else {
            const normTarget = normalize(chunk.TargetContent);
            const regexStr = normTarget.split(' ').map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('\\s+');
            const regex = new RegExp(regexStr);
            if (regex.test(content)) {
                content = content.replace(regex, chunk.ReplacementContent);
            }
        }
    }
    
    if (content !== originalContent) {
        fs.writeFileSync(targetFile, content);
        restoredCount++;
        console.log('Restored UI redesign in', targetFile.split('/').pop());
    }
}

console.log('Successfully applied fuzzy patches to ' + restoredCount + ' files.');
