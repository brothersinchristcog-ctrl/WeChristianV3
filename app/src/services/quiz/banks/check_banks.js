const fs = require('fs');
const path = require('path');

function checkFile(relPath) {
  const fullPath = path.resolve(__dirname, '..', relPath);
  if (!fs.existsSync(fullPath)) {
    console.log('File does not exist:', relPath);
    return;
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  const qMatches = content.match(/"id":/g) || [];
  const levelItems = content.match(/Level Item/g) || [];
  const questions = [];
  const regex = /"question":\s*"([^"]+)"/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    questions.push(m[1]);
  }
  const uniqueQ = new Set(questions);
  console.log(`${relPath}: Total IDs=${qMatches.length}, QuestionsExtracted=${questions.length}, Unique=${uniqueQ.size}, LevelItemPrefix=${levelItems.length}`);
}

checkFile('FamilyQuestionBank.ts');
const banks = ['CareQuestionBank.ts', 'FatherQuestionBank.ts', 'FriendsQuestionBank.ts', 'HopeQuestionBank.ts', 'LoveQuestionBank.ts', 'MotherQuestionBank.ts'];
for (const b of banks) {
  checkFile('banks/' + b);
}
