const fs = require('fs');
let content = fs.readFileSync('C:/Users/yraje/.gemini/antigravity-ide/brain/7d7dc0a8-7bc9-424b-8f83-cbf9c5590d4c/scratch/refactor_prayer.js', 'utf8');
content = content.replace(
    /const targetFile = path\.resolve\(__dirname, '\.\.\/\.\.\/app\/src\/screens\/admin\/AdminPrayerModeration\.tsx'\);/,
    "const targetFile = 'c:/Users/yraje/WeChristian2/app/src/screens/admin/AdminPrayerModeration.tsx';"
);
fs.writeFileSync('C:/Users/yraje/.gemini/antigravity-ide/brain/7d7dc0a8-7bc9-424b-8f83-cbf9c5590d4c/scratch/refactor_prayer.js', content);
