const fs = require('fs');
const path = require('path');

const transcriptPath = 'C:/Users/yraje/.gemini/antigravity-ide/brain/38c5f503-779f-4a96-b74d-9e250ff4b8c2/.system_generated/logs/transcript_full.jsonl';

const transcript = fs.readFileSync(transcriptPath, 'utf8');
const lines = transcript.split('\n');

let foundScripts = {};

for (const line of lines) {
    if (!line.trim()) continue;
    try {
        const obj = JSON.parse(line);
        if (obj.tool_calls) {
            for (const call of obj.tool_calls) {
                if (call.name === 'write_to_file') {
                    const args = call.arguments;
                    if (args && args.TargetFile && args.TargetFile.endsWith('.js')) {
                        const filename = path.basename(args.TargetFile);
                        if (filename.includes('refactor') || filename.includes('fix') || filename.includes('restore')) {
                            foundScripts[filename] = args.CodeContent;
                        }
                    }
                }
            }
        }
    } catch (e) {}
}

for (const [filename, content] of Object.entries(foundScripts)) {
    fs.writeFileSync(filename, content, 'utf8');
    console.log('Recovered ' + filename);
}
