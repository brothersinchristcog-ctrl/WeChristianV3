const { execSync } = require('child_process');
const CHAT2 = 'C:/Users/yraje/.gemini/antigravity-ide/brain/e4115603-2fea-4251-a0eb-50352c677516/scratch';

function run(script) {
    try {
        console.log('Running ' + script);
        execSync(`node "${script}"`, { stdio: 'pipe' });
    } catch(e) {}
}

// EventEditor scripts from chat2
run(`${CHAT2}/refactorEventEditor.js`);
run(`${CHAT2}/refactorEventEditorHero.js`);
run(`${CHAT2}/refactorEventEditorSafe.js`);
run(`${CHAT2}/refactorEventEditorSafe2.js`);
run(`${CHAT2}/fixEditorHero.js`);
