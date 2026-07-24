const fs = require('fs');

let c = fs.readFileSync('c:/Users/yraje/WeChristian2/app/src/screens/admin/AdminChurchSettings.tsx', 'utf-8');
c = c.replace(/useState<'info' \| 'branding' \| 'giving' \| 'integrations'>/, "useState<'info' | 'branding' | 'giving' | 'integrations' | 'whatsapp'>");
if (!c.includes('MessageCircle')) {
    c = c.replace(/import \{.*?\} from 'lucide-react-native';/s, match => match.replace('}', ', MessageCircle }'));
}
fs.writeFileSync('c:/Users/yraje/WeChristian2/app/src/screens/admin/AdminChurchSettings.tsx', c);

let wc = fs.readFileSync('c:/Users/yraje/WeChristian2/app/src/screens/admin/AdminWeCelebrations.tsx', 'utf-8');
if (!wc.includes('import { Platform }')) {
    wc = wc.replace(/import \{ View, Text, StyleSheet/s, "import { Platform, View, Text, StyleSheet");
    fs.writeFileSync('c:/Users/yraje/WeChristian2/app/src/screens/admin/AdminWeCelebrations.tsx', wc);
}

const stylesToAdd = `
  header: {
    backgroundColor: '#1a2d5a',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    zIndex: 10,
    marginBottom: 0,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 4, paddingHorizontal: 2 },
  backBtnTxt: { fontSize: 13, fontWeight: '700', color: '#fff' },
  heroTitles: { flex: 1, paddingLeft: 4 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 11, color: '#F3EAD9', marginTop: 2, letterSpacing: 1.5, fontWeight: '800' },
`;

function addStyles(file) {
    let content = fs.readFileSync(file, 'utf-8');
    if (!content.includes('headerTitle: {')) {
        content = content.replace('const styles = StyleSheet.create({', 'const styles = StyleSheet.create({' + stylesToAdd);
    }
    if (!content.includes('Platform')) {
        content = content.replace(/import \{.*?\} from 'react-native';/s, match => match.replace('}', ', Platform }'));
    }
    fs.writeFileSync(file, content);
}

addStyles('c:/Users/yraje/WeChristian2/app/src/screens/admin/AdminCelebrationsWhatsAppPreview.tsx');
addStyles('c:/Users/yraje/WeChristian2/app/src/screens/admin/AdminWeCelebrationsWhatsAppPreview.tsx');
