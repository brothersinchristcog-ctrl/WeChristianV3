const fs = require('fs');
let c = fs.readFileSync('src/screens/admin/AdminEventEditor.tsx', 'utf8');

c = c.replace(/const formatToSFTime = \(timeStr: string\) => \{[\s\S]*?catch \(e\) \{\n\s*return timeStr; \/\/ Fallback to original if format is unexpected\n\s*\}\n\s*\};/, `const formatToSFTime = (timeStr: string) => {
      if (!timeStr) return null;
      try {
        const cleanStr = timeStr.toUpperCase().replace(/\\s+/g, '');
        const isPM = cleanStr.includes('PM');
        const isAM = cleanStr.includes('AM');
        const timePart = cleanStr.replace('AM', '').replace('PM', '');
        let [hours, minutes] = timePart.split(':').map(Number);
        if (isNaN(minutes)) minutes = 0;
        if (isPM && hours < 12) hours += 12;
        if (isAM && hours === 12) hours = 0;
        return \`\${String(hours).padStart(2, '0')}:\${String(minutes).padStart(2, '0')}:00.000Z\`;
      } catch (e) {
        return timeStr; // Fallback to original if format is unexpected
      }
    };`);

c = c.replace(/onConfirm=\{\(t\) => \{\s*setStartTime\(t\.toLocaleTimeString\('en-US', \{ hour: '2-digit', minute: '2-digit' \}\)\);\s*setStartTimeVisibility\(false\);\s*\}\}/, `onConfirm={(t) => {
          let h = t.getHours();
          const m = t.getMinutes();
          const ampm = h >= 12 ? 'PM' : 'AM';
          h = h % 12;
          h = h ? h : 12;
          const formatted = \`\${String(h).padStart(2, '0')}:\${String(m).padStart(2, '0')} \${ampm}\`;
          setStartTime(formatted);
          setStartTimeVisibility(false);
        }}`);

c = c.replace(/onConfirm=\{\(t\) => \{\s*setEndTime\(t\.toLocaleTimeString\('en-US', \{ hour: '2-digit', minute: '2-digit' \}\)\);\s*setEndTimeVisibility\(false\);\s*\}\}/, `onConfirm={(t) => {
          let h = t.getHours();
          const m = t.getMinutes();
          const ampm = h >= 12 ? 'PM' : 'AM';
          h = h % 12;
          h = h ? h : 12;
          const formatted = \`\${String(h).padStart(2, '0')}:\${String(m).padStart(2, '0')} \${ampm}\`;
          setEndTime(formatted);
          setEndTimeVisibility(false);
        }}`);

c = c.replace(/setActiveTab\(8\);/g, 'if (setActiveTab) setActiveTab(8);');

fs.writeFileSync('src/screens/admin/AdminEventEditor.tsx', c);
console.log('Done!');
