const fs = require('fs');
const path = require('path');

const BANK_FILES = [
  { topic: 'Family', file: '../FamilyQuestionBank.ts' },
  { topic: 'Friends', file: './FriendsQuestionBank.ts' },
  { topic: 'Mother', file: './MotherQuestionBank.ts' },
  { topic: 'Father', file: './FatherQuestionBank.ts' },
  { topic: 'Love', file: './LoveQuestionBank.ts' },
  { topic: 'Care', file: './CareQuestionBank.ts' },
  { topic: 'Hope', file: './HopeQuestionBank.ts' },
  { topic: 'Failure', file: './FailureQuestionBank.ts' },
  { topic: 'Fear', file: './FearQuestionBank.ts' },
  { topic: 'Peace', file: './PeaceQuestionBank.ts' },
  { topic: 'Life', file: './LifeQuestionBank.ts' },
  { topic: 'Wisdom', file: './WisdomQuestionBank.ts' },
];

console.log('====================================================');
console.log('       FULL 12-TOPIC BIBLE QUIZ VERIFICATION        ');
console.log('====================================================\n');

let grandTotalQuestions = 0;
const allQuestionsMap = new Map(); // normalized question -> topic
let placeholderErrors = 0;
let answerValidationErrors = 0;

for (const b of BANK_FILES) {
  const filePath = path.resolve(__dirname, b.file);
  if (!fs.existsSync(filePath)) {
    console.error(`ERROR: File missing: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  
  // Extract all questions
  const qMatches = [...content.matchAll(/"question":\s*"([^"]+)"/g)].map(m => m[1]);
  const teMatches = [...content.matchAll(/"questionTelugu":\s*"([^"]+)"/g)].map(m => m[1]);
  const ansMatches = [...content.matchAll(/"correctAnswer":\s*"([^"]+)"/g)].map(m => m[1]);
  const refMatches = [...content.matchAll(/"bibleReference":\s*"([^"]+)"/g)].map(m => m[1]);
  const expMatches = [...content.matchAll(/"explanation":\s*"([^"]+)"/g)].map(m => m[1]);
  const expTeMatches = [...content.matchAll(/"explanationTelugu":\s*"([^"]+)"/g)].map(m => m[1]);

  console.log(`[${b.topic}]`);
  console.log(`  File: ${path.basename(filePath)} (${(fs.statSync(filePath).size / 1024).toFixed(1)} KB)`);
  console.log(`  Questions extracted: ${qMatches.length}`);
  console.log(`  Telugu questions extracted: ${teMatches.length}`);
  console.log(`  Answers extracted: ${ansMatches.length}`);
  console.log(`  Scripture references: ${refMatches.length}`);

  if (qMatches.length !== 450) {
    console.error(`  ERROR: Expected exactly 450 questions, found ${qMatches.length}!`);
    process.exit(1);
  }

  // Check for placeholders like (Item X) or (Level Item X)
  for (let i = 0; i < qMatches.length; i++) {
    const q = qMatches[i];
    if (/\(Level Item|\(Item\s*\d+\)/i.test(q)) {
      console.error(`  Placeholder error in ${b.topic}: ${q}`);
      placeholderErrors++;
    }
  }

  // Check intra-bank duplicates
  const localSet = new Set();
  let localDups = 0;
  for (const q of qMatches) {
    const norm = q.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (localSet.has(norm)) {
      localDups++;
    }
    localSet.add(norm);
  }

  if (localDups > 0) {
    console.error(`  ERROR: ${localDups} internal duplicate questions found in ${b.topic}!`);
    process.exit(1);
  } else {
    console.log(`  ✓ Internal Uniqueness: 450 / 450 unique questions (0 duplicates)`);
  }

  // Cross-bank registration
  for (const q of qMatches) {
    const norm = q.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (allQuestionsMap.has(norm)) {
      const existing = allQuestionsMap.get(norm);
      console.error(`  CROSS COLLISION: Question in ${b.topic} already exists in ${existing}: "${q}"`);
      process.exit(1);
    }
    allQuestionsMap.set(norm, b.topic);
  }

  grandTotalQuestions += qMatches.length;
}

console.log('\n====================================================');
console.log('                 FINAL RESULTS                      ');
console.log('====================================================');
console.log(`Total Topics Verified: ${BANK_FILES.length} / 12`);
console.log(`Grand Total Questions: ${grandTotalQuestions} (Exactly 12 x 450 = 5,400)`);
console.log(`Total Global Unique Questions: ${allQuestionsMap.size} / 5,400`);
console.log(`Total Cross-Bank Collisions: 0`);
console.log(`Total Placeholder Errors: ${placeholderErrors}`);

if (placeholderErrors === 0 && grandTotalQuestions === 5400 && allQuestionsMap.size === 5400) {
  console.log('\n>>> ALL 12 TOPICS VERIFIED: 100% PRODUCTION READY WITH ZERO OVERLAP! <<<');
} else {
  console.error('\n>>> VERIFICATION FAILED! <<<');
  process.exit(1);
}
