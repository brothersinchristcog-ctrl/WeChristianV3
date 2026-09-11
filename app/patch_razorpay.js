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

// Patch react-native-share to prevent double activity stack
const waShareFiles = [
  path.join(__dirname, '../node_modules/react-native-share/android/src/main/java/cl/json/social/WhatsAppShare.java'),
  path.join(__dirname, '../node_modules/react-native-share/android/src/main/java/cl/json/social/WhatsAppBusinessShare.java')
];

for (const waFile of waShareFiles) {
  if (fs.existsSync(waFile)) {
    let content = fs.readFileSync(waFile, 'utf8');
    if (content.includes('START_CONVERSATION_CLASS')) {
      content = content.replace(
        /\s*if \(options\.hasKey\("whatsAppNumber"\)\) \{[\s\S]*?Thread\.sleep\(START_ACTIVITY_TIME_GAP_MS\);\s*\}\s*catch[^{]*\{[^}]*\}\s*\}/g,
        ''
      );
      fs.writeFileSync(waFile, content);
      console.log(`Successfully patched ${path.basename(waFile)}`);
    }
  }
}
