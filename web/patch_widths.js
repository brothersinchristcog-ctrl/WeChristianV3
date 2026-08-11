const fs = require('fs');
const path = require('path');

const screens = [
  'SermonsScreen.tsx',
  'SongsScreen.tsx',
  'PrayerWall.tsx',
  'GivingScreen.tsx',
  'EventsScreen.tsx',
  'ProfileScreen.tsx',
  'MemberDashboard.tsx'
];

screens.forEach(file => {
  const filePath = path.join('C:\\Users\\yraje\\WeChristian2\\web\\src\\screens', file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace the narrow phone width container with a wide, web-friendly container
    content = content.replace(/className="max-w-md mx-auto /g, 'className="max-w-7xl mx-auto w-full ');
    
    // Specifically for MemberDashboard where I might have changed it to max-w-6xl
    content = content.replace(/className="max-w-6xl mx-auto /g, 'className="max-w-7xl mx-auto w-full ');
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
});
