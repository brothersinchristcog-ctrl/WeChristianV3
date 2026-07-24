const { execSync } = require('child_process');
const CHAT2 = 'C:/Users/yraje/.gemini/antigravity-ide/brain/e4115603-2fea-4251-a0eb-50352c677516/scratch';

function run(script) {
    try {
        const out = execSync(`node "${script}"`, { stdio: 'pipe' }).toString();
        console.log(`  ✓ ${script.split('/').pop()} - ${out.trim().substring(0, 80)}`);
    } catch(e) {
        const err = e.stderr ? e.stderr.toString() : e.message;
        console.log(`  ✗ ${script.split('/').pop()} - ERROR: ${err.substring(0, 120)}`);
    }
    
    // Check TS
    try {
        execSync('npx tsc --noEmit', { stdio: 'pipe' });
        console.log('    TS: OK');
    } catch(e) {
        console.log('    TS: ERROR');
        throw new Error('TS Failed after ' + script);
    }
}

try {
    run(`${CHAT2}/fixNotifications.js`);
    run(`${CHAT2}/fixStylesClean.js`);
    run(`${CHAT2}/applyUIDesign.js`);
    run(`${CHAT2}/applyUIDesign2.js`);
    run(`${CHAT2}/fixHeroAndButtons.js`);
    run(`${CHAT2}/fixBroadcastStatus.js`);
    run(`${CHAT2}/fixTS.js`);
    run(`${CHAT2}/fixTS2.js`);
} catch (e) {
    console.log(e.message);
}
