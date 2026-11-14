const fs = require('fs');
const content = fs.readFileSync('app/src/services/quiz/FamilyQuestionBank.ts', 'utf8');

const regex = /id":\s*"([^"]+)",\s*"order":\s*(\d+),\s*"questionType":\s*"single_choice",\s*"question":\s*"([^"]+)"/g;
let m;
const items = [];
while ((m = regex.exec(content)) !== null) {
  items.push({ id: m[1], order: m[2], q: m[3] });
}
console.log('Total items found:', items.length);
console.log('First 3 items:');
console.log(items.slice(0, 3));
console.log('Items 50-53 (Growth start):');
console.log(items.slice(50, 53));
console.log('Items 150-153 (Medium start):');
console.log(items.slice(150, 153));
console.log('Items 300-303 (Hard start):');
console.log(items.slice(300, 303));
console.log('Last 3 items:');
console.log(items.slice(-3));
