const { execSync } = require('child_process');
const CHAT2 = 'C:/Users/yraje/.gemini/antigravity-ide/brain/e4115603-2fea-4251-a0eb-50352c677516/scratch';
const CHAT1 = 'C:/Users/yraje/.gemini/antigravity-ide/brain/7d7dc0a8-7bc9-424b-8f83-cbf9c5590d4c/scratch';

function run(script) {
    try {
        console.log('Running ' + script);
        execSync(`node "${script}"`, { stdio: 'pipe' });
    } catch(e) {}
}

// Prayer
run(`${CHAT1}/refactor_prayer.js`);

// EventEditor
run(`${CHAT2}/refactorEventEditor.js`);
run(`${CHAT2}/refactorEventEditorHero.js`);
run(`${CHAT2}/refactorEventEditorSafe.js`);
run(`${CHAT2}/refactorEventEditorSafe2.js`);
run(`${CHAT2}/fixEditorHero.js`);
run(`${CHAT1}/safe_refactor.js`);
