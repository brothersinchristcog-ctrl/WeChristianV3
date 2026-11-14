const fs = require('fs');
const path = require('path');
const { normalize } = require('./bank_builder.js');

function extractQuestions(relPath) {
  const fullPath = path.resolve(__dirname, '..', relPath);
  if (!fs.existsSync(fullPath)) return [];
  const content = fs.readFileSync(fullPath, 'utf8');
  const questions = [];
  const regex = /"question":\s*"([^"]+)"/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    questions.push(m[1]);
  }
  return questions;
}

const banks = [
  { name: 'Family', file: 'FamilyQuestionBank.ts' },
  { name: 'Friends', file: 'banks/FriendsQuestionBank.ts' },
  { name: 'Mother', file: 'banks/MotherQuestionBank.ts' },
  { name: 'Father', file: 'banks/FatherQuestionBank.ts' },
  { name: 'Love', file: 'banks/LoveQuestionBank.ts' },
  { name: 'Care', file: 'banks/CareQuestionBank.ts' },
  { name: 'Hope', file: 'banks/HopeQuestionBank.ts' },
  { name: 'Failure', file: 'banks/FailureQuestionBank.ts' },
  { name: 'Fear', file: 'banks/FearQuestionBank.ts' },
  { name: 'Peace', file: 'banks/PeaceQuestionBank.ts' },
  { name: 'Life', file: 'banks/LifeQuestionBank.ts' },
  { name: 'Wisdom', file: 'banks/WisdomQuestionBank.ts' }
];

const loaded = [];
for (const b of banks) {
  const qs = extractQuestions(b.file);
  if (qs.length > 0) {
    const normSet = new Set(qs.map(normalize));
    loaded.push({ name: b.name, raw: qs, set: normSet });
    console.log(`${b.name}: ${qs.length} questions, ${normSet.size} unique`);
  }
}

console.log('\n--- Cross-Bank Collision Matrix ---');
let totalCollisions = 0;
for (let i = 0; i < loaded.length; i++) {
  for (let j = i + 1; j < loaded.length; j++) {
    const a = loaded[i];
    const b = loaded[j];
    let shared = 0;
    for (const q of a.raw) {
      if (b.set.has(normalize(q))) {
        shared++;
      }
    }
    if (shared > 0) {
      console.log(`Collision between ${a.name} and ${b.name}: ${shared} identical questions!`);
      totalCollisions += shared;
    } else {
      console.log(`✓ ${a.name} vs ${b.name}: 0 shared`);
    }
  }
}

console.log(`\nTotal Cross-Bank Collisions: ${totalCollisions}`);
