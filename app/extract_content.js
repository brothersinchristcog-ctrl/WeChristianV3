const fs = require('fs');

// Extract the LAST written content for each file from the transcript
// This gives us the final state after all changes in that session
function getLastWrittenContent(transcriptPath, targetFile) {
    if (!fs.existsSync(transcriptPath)) return null;
    const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(Boolean);
    
    let lastContent = null;
    
    for (const line of lines) {
        try {
            const obj = JSON.parse(line);
            const content = obj.content || '';
            if (typeof content !== 'string') continue;
            
            // Look for write_to_file tool calls with this file
            const normalizedTarget = targetFile.replace(/\\/g, '/').toLowerCase();
            
            // Find write_to_file results that match
            if (content.includes(targetFile.replace(/\\/g, '\\\\')) || 
                content.includes(targetFile.replace(/\\/g, '/'))) {
                
                // Check if this is a tool result containing CodeContent
                const codeIdx = content.indexOf('"CodeContent"');
                if (codeIdx !== -1) {
                    // Find the file path near this CodeContent
                    const fileIdx = content.indexOf(targetFile.replace(/\\/g, '/'), Math.max(0, codeIdx - 500));
                    const fileIdx2 = content.indexOf(targetFile.replace(/\\/g, '\\\\'), Math.max(0, codeIdx - 500));
                    if (fileIdx !== -1 || fileIdx2 !== -1) {
                        // Extract the code content
                        const start = content.indexOf(':', codeIdx) + 1;
                        // Skip whitespace and quote
                        let i = start;
                        while (content[i] === ' ' || content[i] === '\n') i++;
                        if (content[i] === '"') {
                            // JSON string - find end
                            let j = i + 1;
                            let escaped = false;
                            while (j < content.length) {
                                if (escaped) { escaped = false; j++; continue; }
                                if (content[j] === '\\') { escaped = true; j++; continue; }
                                if (content[j] === '"') break;
                                j++;
                            }
                            const rawCode = content.substring(i + 1, j);
                            lastContent = rawCode.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
                        }
                    }
                }
            }
        } catch(e) {}
    }
    
    return lastContent;
}

// Test with AdminDashboard
const chat2 = 'C:/Users/yraje/.gemini/antigravity-ide/brain/7d7dc0a8-7bc9-424b-8f83-cbf9c5590d4c/.system_generated/logs/transcript_full.jsonl';
const content = getLastWrittenContent(chat2, 'c:\\Users\\yraje\\WeChristian2\\app\\src\\screens\\admin\\AdminDashboard.tsx');

if (content) {
    console.log('Found content! Length:', content.length);
    console.log('Preview:', content.substring(0, 200));
} else {
    console.log('No content found via write_to_file');
}
