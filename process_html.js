const fs = require('fs');
const https = require('https');

const url = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBKNARIhYXBwX2NvbXBhbmlvbl91c2VyX3VwbG9hZGVkX2ZpbGVzGmgKM3VzZXJfdXBsb2FkZWRfaHRtbF8wMDA2NTY3ZWMxZjk4OTBmMDJkM2ZkYzQ4NzFjMDcyMRILEgcQ5u_X6e4dGAGSASMKCnByb2plY3RfaWQSFUITODQ2OTE0NTY5NTAyMDQwMzQzOA&filename=&opi=89354086";

https.get(url, (res) => {
  let html = '';
  res.on('data', chunk => html += chunk);
  res.on('end', () => {
    processHtml(html);
  });
});

function processHtml(html) {

// Clean up CSS for .phone and .notch
html = html.replace(/\.phone\{[^}]+\}/, '.phone{ position: relative; width: 100%; height: 100%; overflow: hidden; display: flex; flex-direction: column; background: var(--ivory); }');
html = html.replace(/\.notch\{[^}]+\}/, '.notch{ display: none; }');
html = html.replace(/\.statusbar\{[^}]+\}/, '.statusbar{ display: none; }');
html = html.replace(/\.stage\{[^}]+\}/, '.stage{ position: relative; width: 100%; height: 100%; overflow: hidden; display: flex; flex-direction: column; }');

// Adjust body CSS to remove the gradient background (since it's now full screen)
html = html.replace(/body\\{[^}]+\\}/, 'body{ font-family:"Inter",sans-serif; background: var(--ivory-deep); width: 100%; height: 100%; margin:0; padding:0; display:flex; flex-direction:column; color:var(--ink); overscroll-behavior: none; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; touch-action: manipulation; }');

// Lock viewport to prevent zooming and panning
html = html.replace(/<meta name="viewport"[^>]*>/i, '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />');

// Use real date
html = html.replace(/const TODAY = new Date\('[^']+'\);/, 'const TODAY = new Date();');

// Inject members
html = html.replace(/const MEMBERS = \[[\s\S]*?\];/, 'const MEMBERS = window.INITIAL_MEMBERS || [];');

// Add bridge for Whatsapp
html = html.replace(/case 'send-whatsapp':([\s\S]*?)break;/, `case 'send-whatsapp': 
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ 
      type: 'SEND_WHATSAPP', 
      memberId: state.memberId, 
      message: state.message, 
      theme: state.theme, 
      verse: state.verse 
    }));
  }
  toast('Sending message...');
  setTimeout(() => go('confirm'), 500);
  break;`);

// Clean up the DOM structure if needed. Actually leaving .stage and .phone is fine if we overrode the CSS!
// Since we set .stage width 100% and height 100vh, and .phone flex:1, it will naturally fill the screen.

// Safe serialization to avoid template literal escaping issues
  const tsContent = `export const WeCelebrationsHtml = ${JSON.stringify(html)};\n`;
  fs.writeFileSync('app/src/screens/admin/WeCelebrationsHtml.ts', tsContent);
}
