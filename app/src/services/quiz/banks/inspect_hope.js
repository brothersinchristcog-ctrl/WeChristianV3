const fs = require('fs');
const content = fs.readFileSync('gen_hope_bank.js', 'utf8');

function extractArray(name) {
  const match = content.match(new RegExp(`function ${name}\\(\\)[\\s\\S]*?const data = \\[([\\s\\S]*?)\\];\\s*return data`));
  if (!match) return [];
  const items = match[1].split(/\n\s*\[/).slice(1);
  return items.map(it => {
    const refMatch = it.match(/"([^"]+)"\s*,\s*"[^"]+"\s*,\s*"([^"]+)"/);
    return refMatch ? { title: refMatch[1], ref: refMatch[2] } : null;
  }).filter(Boolean);
}

const g = extractArray('buildHopeGrowth');
const m = extractArray('buildHopeMastery');
console.log('Growth count:', g.length);
console.log('Mastery count:', m.length);
console.log('Growth refs:', g.map(x => x.ref));
console.log('Mastery refs:', m.map(x => x.ref));
