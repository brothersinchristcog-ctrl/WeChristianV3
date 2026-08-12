const fs = require('fs');
const path = require('path');

const homePath = path.join(__dirname, 'src', 'screens', 'HomeScreen.tsx');
let homeContent = fs.readFileSync(homePath, 'utf8');

// Remove pan responder from the Animated.View
homeContent = homeContent.replace(
  "{...panResponder.panHandlers}",
  ""
);

homeContent = homeContent.replace(
  "{ transform: [{ translateX: pan.x as any }, { translateY: pan.y as any }] }",
  "{}"
);

// Add elevation to container
homeContent = homeContent.replace(
  "zIndex: 999,",
  "zIndex: 999,\n    elevation: 1000,"
);

fs.writeFileSync(homePath, homeContent, 'utf8');
console.log('Removed pan responder transform and added elevation');
