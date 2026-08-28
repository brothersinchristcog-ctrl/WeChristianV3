const fs = require('fs');
const path = require('path');

const gradlePath = path.join(__dirname, '../node_modules/react-native-razorpay/android/build.gradle');

if (fs.existsSync(gradlePath)) {
  let content = fs.readFileSync(gradlePath, 'utf8');
  if (!content.includes('mavenCentral()')) {
    content = content.replace(
      /repositories\s*\{/,
      "repositories {\n        mavenCentral()"
    );
    fs.writeFileSync(gradlePath, content);
    console.log('Successfully patched react-native-razorpay build.gradle');
  }
} else {
  console.log('react-native-razorpay build.gradle not found, skipping patch.');
}
