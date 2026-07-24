const { execSync } = require('child_process');

const CHAT1 = 'C:/Users/yraje/.gemini/antigravity-ide/brain/7d7dc0a8-7bc9-424b-8f83-cbf9c5590d4c/scratch';
const CHAT2 = 'C:/Users/yraje/.gemini/antigravity-ide/brain/e4115603-2fea-4251-a0eb-50352c677516/scratch';

function run(script) {
    try {
        const out = execSync(`node "${script}"`, { stdio: 'pipe' }).toString();
        console.log(`  ✓ ${script.split('/').pop()} - ${out.trim().substring(0, 80)}`);
    } catch(e) {
        const err = e.stderr ? e.stderr.toString() : e.message;
        console.log(`  ✗ ${script.split('/').pop()} - ERROR: ${err.substring(0, 120)}`);
    }
}

console.log('\n====== RESTORING ADMIN NOTIFICATIONS ======');
// Run in sequence to build up the redesign
run(`${CHAT2}/fixNotifications.js`);   // Injects COLORS + main redesign
run(`${CHAT2}/fixStylesClean.js`);     // Cleans up styles
run(`${CHAT2}/applyUIDesign.js`);      // Adds modal and UI
run(`${CHAT2}/applyUIDesign2.js`);     // More UI improvements
run(`${CHAT2}/fixHeroAndButtons.js`);  // Hero header + buttons
run(`${CHAT2}/fixBroadcastStatus.js`); // Status indicator
run(`${CHAT2}/fixTS.js`);              // TypeScript fixes
run(`${CHAT2}/fixTS2.js`);             // More TS fixes

console.log('\n====== RESTORING ADMIN EVENT LIST ======');
run(`${CHAT2}/refactorEventList.js`);       // Main event list redesign
run(`${CHAT2}/refactorEventListHero.js`);   // Hero section
run(`${CHAT2}/fixAdminEventListHero3.js`);  // Hero fix
run(`${CHAT2}/fixAdminEventListHero4.js`);  // More fixes
run(`${CHAT2}/fixAdminEventListHero5.js`);  // Final fixes
run(`${CHAT2}/fixEventHeroFinal.js`);       // Final hero
run(`${CHAT2}/fixEventHeroFinal2.js`);      // Tweaks
run(`${CHAT2}/fixEventHeroFinal3.js`);      // More tweaks
run(`${CHAT2}/fixTSEventList.js`);          // TS fixes

console.log('\n====== RESTORING ADMIN EVENT EDITOR ======');
run(`${CHAT2}/refactorEventEditor.js`);
run(`${CHAT2}/refactorEventEditorHero.js`);
run(`${CHAT2}/refactorEventEditorSafe.js`);
run(`${CHAT2}/refactorEventEditorSafe2.js`);
run(`${CHAT2}/fixEditorHero.js`);

console.log('\n====== CHAT1 FIXES ON TOP ======');
run(`${CHAT1}/refactor.js`);
run(`${CHAT1}/safe_refactor.js`);
run(`${CHAT1}/refactor_prayer.js`);
run(`${CHAT1}/final_refactor.js`);
run(`${CHAT1}/fix_hero_dropdown.js`);
run(`${CHAT1}/fix_styles.js`);
run(`${CHAT1}/fix_styles_2.js`);

console.log('\n✅ DONE!');
