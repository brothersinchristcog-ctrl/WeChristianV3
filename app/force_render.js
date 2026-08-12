const fs = require('fs');
const path = require('path');

const homePath = path.join(__dirname, 'src', 'screens', 'HomeScreen.tsx');
let homeContent = fs.readFileSync(homePath, 'utf8');

// Force floating button to render
homeContent = homeContent.replace(
  "{liveCelebrations.length > 0 && (",
  "{(true) && ("
);

// Also reset the session variable for the popup so it shows again on hot reload!
homeContent = homeContent.replace(
  "let hasShownCelebrationThisSession = false;",
  "let hasShownCelebrationThisSession = false; // Reset by script"
);

// Actually, resetting the global in code won't trigger unless the file is evaluated. 
// Adding a comment changes the file, which triggers a full fast refresh, which re-evaluates the file and resets the global!
homeContent = homeContent.replace(
  "let hasShownCelebrationThisSession = false;",
  "let hasShownCelebrationThisSession = false; /* forced refresh */"
);

fs.writeFileSync(homePath, homeContent, 'utf8');
console.log('Forced floating button to render and triggered hot refresh');
