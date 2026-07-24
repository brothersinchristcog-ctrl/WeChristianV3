const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/yraje/WeChristian2/app/src/screens/admin';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

let restoredCount = 0;

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  let wasModified = false;

  // 1. Revert useTheme import
  if (content.includes("import { useTheme } from '../../context/ThemeContext';")) {
    content = content.replace(/\nimport \{ useTheme \} from '\.\.\/\.\.\/context\/ThemeContext';/, '');
    wasModified = true;
  }

  // 2. Revert the injected hook logic
  const injection = '\n  const { colors, isDark } = useTheme();\n  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);';
  if (content.includes(injection)) {
    content = content.replace(injection, '');
    wasModified = true;
  }

  // 3. Revert getStyles back to styles
  if (content.includes('const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({')) {
    content = content.replace(/const getStyles = \(colors: any, isDark: boolean\) => StyleSheet\.create\(\{/, 'const styles = StyleSheet.create({');
    wasModified = true;
  }

  // 4. Revert specific colors
  content = content.replace(/colors\.adminBg/g, "'#FAF8F0'");
  content = content.replace(/colors\.adminCard/g, "'#fff'");
  content = content.replace(/colors\.adminHeader/g, "'#1a2d5a'");
  content = content.replace(/colors\.adminTextTitle/g, "'#162057'");
  content = content.replace(/colors\.adminTextSub/g, "'#64748B'");
  content = content.replace(/colors\.adminInputBg/g, "'#F1F5F9'");
  content = content.replace(/colors\.adminBorder/g, "'#E2E8F0'");
  content = content.replace(/colors\.adminGold/g, "'#BE9A3A'");

  // Revert inline objects
  content = content.replace(/\{ color: colors\.adminTextTitle \}/g, "{ color: '#162057' }");
  content = content.replace(/\{ color: colors\.adminTextSub \}/g, "{ color: '#64748B' }");

  if (wasModified || content.includes('colors.adminBg')) {
      fs.writeFileSync(filePath, content);
      restoredCount++;
  }
}
console.log('Restored ' + restoredCount + ' files.');
