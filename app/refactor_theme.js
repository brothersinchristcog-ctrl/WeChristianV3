const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/yraje/WeChristian2/app/src/screens/admin';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

console.log(`Processing ${files.length} files...`);

let updatedCount = 0;

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf-8');

  // Skip if already converted
  if (content.includes('getStyles(colors, isDark)')) {
    continue;
  }

  // 1. Inject import
  if (!content.includes('useTheme')) {
    content = content.replace(/(import React[^;]*;)/, '$1\nimport { useTheme } from \'../../context/ThemeContext\';');
  }

  // 2. Inject hooks inside component
  const componentMatch = content.match(/export default function \w+\([^)]*\) \{/);
  if (componentMatch) {
    const insertPos = componentMatch.index + componentMatch[0].length;
    const injection = '\n  const { colors, isDark } = useTheme();\n  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);';
    content = content.slice(0, insertPos) + injection + content.slice(insertPos);
  } else {
    console.log(`Warning: Could not find component declaration in ${file}`);
    continue;
  }

  // 3. Transform StyleSheet.create
  content = content.replace(/const styles = StyleSheet\.create\(\{/, 'const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({');

  // 4. Replace specific color properties in the StyleSheet
  content = content.replace(/backgroundColor:\s*['"]#FAF8F0['"]/ig, 'backgroundColor: colors.adminBg');
  content = content.replace(/backgroundColor:\s*['"]#fff(?:fff)?['"]/ig, 'backgroundColor: colors.adminCard');
  content = content.replace(/backgroundColor:\s*['"]#1a2d5a['"]/ig, 'backgroundColor: colors.adminHeader');
  content = content.replace(/color:\s*['"]#162057['"]/ig, 'color: colors.adminTextTitle');
  content = content.replace(/color:\s*['"]#64748B['"]/ig, 'color: colors.adminTextSub');
  content = content.replace(/backgroundColor:\s*['"]#F1F5F9['"]/ig, 'backgroundColor: colors.adminInputBg');
  content = content.replace(/borderColor:\s*['"]#E2E8F0['"]/ig, 'borderColor: colors.adminBorder');
  content = content.replace(/backgroundColor:\s*['"]#BE9A3A['"]/ig, 'backgroundColor: colors.adminGold');
  content = content.replace(/color:\s*['"]#BE9A3A['"]/ig, 'color: colors.adminGold');
  
  // Replace inline styles specifically (only those that are simple)
  // For safety, we only regex replace specific objects
  content = content.replace(/\{ color:\s*['"]#162057['"] \}/ig, '{ color: colors.adminTextTitle }');
  content = content.replace(/\{ color:\s*['"]#64748B['"] \}/ig, '{ color: colors.adminTextSub }');
  
  fs.writeFileSync(filePath, content);
  updatedCount++;
}

console.log(`Successfully updated ${updatedCount} files.`);
