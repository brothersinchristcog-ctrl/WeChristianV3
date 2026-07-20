const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'src', 'index.ts');
let content = fs.readFileSync(indexPath, 'utf-8');

// 1. We need to fetch enabled churches at the start of each function
const enabledChurchesCode = `
    const enabledChurchesSnap = await db.collection('churches').where('whatsappIntegrationEnabled', '==', true).get();
    const enabledChurchIds = new Set(enabledChurchesSnap.docs.map(doc => doc.id));
`;

// Helper for finding birthdays
content = content.replace(
  /const membersSnap = await db\.collection\('members'\)\.get\(\);\s*const bdays: any\[\] = \[\];\s*membersSnap\.forEach\(\(doc: any\) => {/,
  `
    const legacyMembersSnap = await db.collection('members').get();
    const churchMembersSnap = await db.collectionGroup('members').get();
    const bdays: any[] = [];
    const processedMemberIds = new Set<string>();

    const processDoc = (doc: any, churchId: string) => {
      if (processedMemberIds.has(doc.id)) return;
      processedMemberIds.add(doc.id);
      
      const data = doc.data();
      const dobStr = data.dateOfBirth || data.dob || data.birthday;
      if (!dobStr) return;
      
      const parts = dobStr.split(/[-/]/);
      if (parts.length < 3) return;
      
      let month, day;
      if (parts[0].length === 4) { // YYYY-MM-DD
        month = parseInt(parts[1], 10);
        day = parseInt(parts[2], 10);
      } else if (parts[2].length === 4) { // DD-MM-YYYY
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
      } else {
        return;
      }
      
      if (month === m && day === d) {
        bdays.push({
          id: doc.id,
          churchId,
          name: data.name || (data.firstName ? data.firstName + ' ' + (data.lastName || '') : 'Unknown'),
          phone: data.phone || data.mobile
        });
      }
    };

    legacyMembersSnap.forEach((doc: any) => processDoc(doc, DEFAULT_CHURCH_ID));
    churchMembersSnap.forEach((doc: any) => {
      const cId = doc.ref.parent.parent?.id || DEFAULT_CHURCH_ID;
      processDoc(doc, cId);
    });

    // Dummy loop to replace the old one
    [].forEach((doc: any) => {`
);

// Fix WhatsApp Sending in Birthday
content = content.replace(
  /await sendWhatsAppTemplateInternal\(DEFAULT_CHURCH_ID, member\.phone, 'birthday_card', 'en', undefined, `\[Template Sent\] \$\{personalGreeting\}`\);/,
  `
          if (member.churchId === DEFAULT_CHURCH_ID || enabledChurchIds.has(member.churchId)) {
            await sendWhatsAppTemplateInternal(member.churchId, member.phone, 'birthday_card', 'en', undefined, \`[Template Sent] \${personalGreeting}\`);
          }
  `
);

// Inject enabledChurches in Birthdays
content = content.replace(
  /const settingsDoc = await db\.collection\('churches'\)\.doc\(DEFAULT_CHURCH_ID\)\.collection\('settings'\)\.doc\('notifications'\)\.get\(\);/,
  enabledChurchesCode + "\n    const settingsDoc = await db.collection('churches').doc(DEFAULT_CHURCH_ID).collection('settings').doc('notifications').get();"
);

// === ANNIVERSARIES ===
content = content.replace(
  /const membersSnap = await db\.collection\('members'\)\.get\(\);\s*const annivs: any\[\] = \[\];\s*membersSnap\.forEach\(\(doc: any\) => {/,
  `
    const legacyMembersSnap = await db.collection('members').get();
    const churchMembersSnap = await db.collectionGroup('members').get();
    const annivs: any[] = [];
    const processedMemberIds = new Set<string>();

    const processDoc = (doc: any, churchId: string) => {
      if (processedMemberIds.has(doc.id)) return;
      processedMemberIds.add(doc.id);
      
      const data = doc.data();
      const annivStr = data.marriageDate || data.anniversaryDate || data.anniversary;
      if (!annivStr) return;
      
      const parts = annivStr.split(/[-/]/);
      if (parts.length < 3) return;
      
      let year, month, day;
      if (parts[0].length === 4) { // YYYY-MM-DD
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        day = parseInt(parts[2], 10);
      } else if (parts[2].length === 4) { // DD-MM-YYYY
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        year = parseInt(parts[2], 10);
      } else {
        return;
      }
      
      if (month === m && day === d) {
        const currentYear = new Date().getFullYear();
        const years = year > 1900 ? currentYear - year : 0;
        
        let husband = data.husbandName;
        let wife = data.wifeName;
        
        if (!husband && !wife) {
           if (data.gender === 'Male') {
             husband = data.name || (data.firstName ? data.firstName + ' ' + (data.lastName || '') : 'Unknown');
             wife = data.spouseName || 'Sister';
           } else {
             wife = data.name || (data.firstName ? data.firstName + ' ' + (data.lastName || '') : 'Unknown');
             husband = data.spouseName || 'Brother';
           }
        }
        
        annivs.push({
          id: doc.id,
          churchId,
          husband: husband || 'Brother',
          wife: wife || 'Sister',
          years: years || '',
          phone: data.phone || data.mobile
        });
      }
    };

    legacyMembersSnap.forEach((doc: any) => processDoc(doc, DEFAULT_CHURCH_ID));
    churchMembersSnap.forEach((doc: any) => {
      const cId = doc.ref.parent.parent?.id || DEFAULT_CHURCH_ID;
      processDoc(doc, cId);
    });

    // Dummy loop to replace the old one
    [].forEach((doc: any) => {`
);

content = content.replace(
  /await sendWhatsAppTemplateInternal\(DEFAULT_CHURCH_ID, phone, 'birthday_card'\);/,
  `
          if (ann.churchId === DEFAULT_CHURCH_ID || enabledChurchIds.has(ann.churchId)) {
            await sendWhatsAppTemplateInternal(ann.churchId, phone, 'birthday_card');
          }
  `
);

content = content.replace(
  /const settingsDoc = await db\.collection\('churches'\)\.doc\(DEFAULT_CHURCH_ID\)\.collection\('settings'\)\.doc\('notifications'\)\.get\(\);\s*const settings = settingsDoc\.data\(\);\s*if \(settings && settings\.anniversaryNotif && settings\.anniversaryNotif\.enabled === false\)/,
  enabledChurchesCode + "\n    const settingsDoc = await db.collection('churches').doc(DEFAULT_CHURCH_ID).collection('settings').doc('notifications').get();\n    const settings = settingsDoc.data();\n    if (settings && settings.anniversaryNotif && settings.anniversaryNotif.enabled === false)"
);

// === BAPTISMS ===
content = content.replace(
  /const membersSnap = await db\.collection\('members'\)\.get\(\);\s*const baptisms: any\[\] = \[\];\s*membersSnap\.forEach\(\(doc: any\) => {/,
  `
    const legacyMembersSnap = await db.collection('members').get();
    const churchMembersSnap = await db.collectionGroup('members').get();
    const baptisms: any[] = [];
    const processedMemberIds = new Set<string>();

    const processDoc = (doc: any, churchId: string) => {
      if (processedMemberIds.has(doc.id)) return;
      processedMemberIds.add(doc.id);
      
      const data = doc.data();
      const bapStr = data.baptismDate || data.baptism;
      if (!bapStr) return;
      
      const parts = bapStr.split(/[-/]/);
      if (parts.length < 3) return;
      
      let year, month, day;
      if (parts[0].length === 4) { // YYYY-MM-DD
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        day = parseInt(parts[2], 10);
      } else if (parts[2].length === 4) { // DD-MM-YYYY
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10);
        year = parseInt(parts[2], 10);
      } else {
        return;
      }
      
      if (month === m && day === d) {
        const currentYear = new Date().getFullYear();
        const years = year > 1900 ? currentYear - year : 0;
        
        baptisms.push({
          id: doc.id,
          churchId,
          name: data.name || (data.firstName ? data.firstName + ' ' + (data.lastName || '') : 'Unknown'),
          years: years || '',
          phone: data.phone || data.mobile
        });
      }
    };

    legacyMembersSnap.forEach((doc: any) => processDoc(doc, DEFAULT_CHURCH_ID));
    churchMembersSnap.forEach((doc: any) => {
      const cId = doc.ref.parent.parent?.id || DEFAULT_CHURCH_ID;
      processDoc(doc, cId);
    });

    // Dummy loop to replace the old one
    [].forEach((doc: any) => {`
);

content = content.replace(
  /await sendWhatsAppTemplateInternal\(DEFAULT_CHURCH_ID, member\.phone, 'birthday_card'\);/,
  `
          if (member.churchId === DEFAULT_CHURCH_ID || enabledChurchIds.has(member.churchId)) {
            await sendWhatsAppTemplateInternal(member.churchId, member.phone, 'birthday_card');
          }
  `
);

content = content.replace(
  /const settingsDoc = await db\.collection\('churches'\)\.doc\(DEFAULT_CHURCH_ID\)\.collection\('settings'\)\.doc\('notifications'\)\.get\(\);\s*const settings = settingsDoc\.data\(\);\s*if \(settings && settings\.baptismNotif && settings\.baptismNotif\.enabled === false\)/,
  enabledChurchesCode + "\n    const settingsDoc = await db.collection('churches').doc(DEFAULT_CHURCH_ID).collection('settings').doc('notifications').get();\n    const settings = settingsDoc.data();\n    if (settings && settings.baptismNotif && settings.baptismNotif.enabled === false)"
);

fs.writeFileSync(indexPath, content);
console.log('Successfully refactored index.ts for automated WhatsApp celebrations!');
