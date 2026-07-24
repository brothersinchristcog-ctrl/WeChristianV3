const { execSync } = require('child_process');
const CHAT2 = 'C:/Users/yraje/.gemini/antigravity-ide/brain/e4115603-2fea-4251-a0eb-50352c677516/scratch';

function run(script) {
    try {
        execSync(`node "${script}"`, { stdio: 'pipe' });
    } catch(e) {}
}

run(`${CHAT2}/fixAdminEventListHero3.js`);
run(`${CHAT2}/fixAdminEventListHero4.js`);
run(`${CHAT2}/fixAdminEventListHero5.js`);
run(`${CHAT2}/fixEventHeroFinal.js`);
run(`${CHAT2}/fixEventHeroFinal2.js`);
run(`${CHAT2}/fixEventHeroFinal3.js`);
run(`${CHAT2}/fixTSEventList.js`);
