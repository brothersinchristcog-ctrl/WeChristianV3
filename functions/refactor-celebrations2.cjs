const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, 'src', 'index.ts');
let content = fs.readFileSync(indexPath, 'utf-8');

const enabledChurchesBlock = `    // Check if enabled (legacy settings)
    const settingsDoc = await db.collection('churches').doc(DEFAULT_CHURCH_ID).collection('settings').doc('notifications').get();
    const settings = settingsDoc.data();
    
    // Fetch enabled churches
    const enabledChurchesSnap = await db.collection('churches').where('whatsappIntegrationEnabled', '==', true).get();
    const enabledChurchIds = new Set<string>();
    enabledChurchesSnap.docs.forEach(doc => enabledChurchIds.add(doc.id));
`;

// ================= BIRTHDAYS =================
content = content.replace(
  `    // Check if enabled
    const settingsDoc = await db.collection('churches').doc(DEFAULT_CHURCH_ID).collection('settings').doc('notifications').get();
    const settings = settingsDoc.data();`,
  enabledChurchesBlock
);

content = content.replace(
  `    const membersSnap = await db.collection('members').get();
    const bdays: any[] = [];
    
    membersSnap.forEach((doc: any) => {`,
  `    const legacyMembersSnap = await db.collection('members').get();
    const churchMembersSnap = await db.collectionGroup('members').get();
    const bdays: any[] = [];
    const processedMemberIds = new Set<string>();
    
    const processDoc = (doc: any, churchId: string) => {
      if (processedMemberIds.has(doc.id)) return;
      processedMemberIds.add(doc.id);`
);

content = content.replace(
  `      if (month === m && day === d) {
        bdays.push({
          id: doc.id,
          name: data.name || (data.firstName ? data.firstName + ' ' + (data.lastName || '') : 'Unknown'),
          phone: data.phone || data.mobile
        });
      }
    });`,
  `      if (month === m && day === d) {
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
    });`
);

content = content.replace(
  `      // Automatically send WhatsApp message
      if (member.phone) {
        try {
          await sendWhatsAppTemplateInternal(DEFAULT_CHURCH_ID, member.phone, 'birthday_card', 'en', undefined, \`[Template Sent] \${personalGreeting}\`);
          console.log(\`✅ WhatsApp Birthday message sent to \${member.name}\`);
        } catch (waErr) {
          console.error(\`❌ Failed to send WhatsApp to \${member.name}:\`, waErr);
        }
      }`,
  `      // Automatically send WhatsApp message
      if (member.phone) {
        try {
          if (member.churchId === DEFAULT_CHURCH_ID || enabledChurchIds.has(member.churchId)) {
            await sendWhatsAppTemplateInternal(member.churchId, member.phone, 'birthday_card', 'en', undefined, \`[Template Sent] \${personalGreeting}\`);
            console.log(\`✅ WhatsApp Birthday message sent to \${member.name}\`);
          }
        } catch (waErr) {
          console.error(\`❌ Failed to send WhatsApp to \${member.name}:\`, waErr);
        }
      }`
);

// ================= ANNIVERSARIES =================
content = content.replace(
  `    const membersSnap = await db.collection('members').get();
    const annivs: any[] = [];
    
    membersSnap.forEach((doc: any) => {`,
  `    const legacyMembersSnap = await db.collection('members').get();
    const churchMembersSnap = await db.collectionGroup('members').get();
    const annivs: any[] = [];
    const processedMemberIds = new Set<string>();
    
    const processDoc = (doc: any, churchId: string) => {
      if (processedMemberIds.has(doc.id)) return;
      processedMemberIds.add(doc.id);`
);

content = content.replace(
  `        annivs.push({
          id: doc.id,
          husband: husband || 'Brother',
          wife: wife || 'Sister',
          years: years || '',
          phone: data.phone || data.mobile
        });
      }
    });`,
  `        annivs.push({
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
    });`
);

content = content.replace(
  `      // Automatically send WhatsApp message to the couple
      const targetPhones = [ann.phone].filter(Boolean); // If you have both phones, you'd add them here
      for (const phone of targetPhones) {
        try {
          // Note: using birthday_card for all celebrations as per We Celebration tab currently
          await sendWhatsAppTemplateInternal(DEFAULT_CHURCH_ID, phone, 'birthday_card');
          console.log(\`✅ WhatsApp Anniversary message sent to \${phone}\`);
        } catch (waErr) {
          console.error(\`❌ Failed to send WhatsApp Anniversary message to \${phone}:\`, waErr);
        }
      }`,
  `      // Automatically send WhatsApp message to the couple
      const targetPhones = [ann.phone].filter(Boolean); // If you have both phones, you'd add them here
      for (const phone of targetPhones) {
        try {
          // Note: using birthday_card for all celebrations as per We Celebration tab currently
          if (ann.churchId === DEFAULT_CHURCH_ID || enabledChurchIds.has(ann.churchId)) {
            await sendWhatsAppTemplateInternal(ann.churchId, phone, 'birthday_card');
            console.log(\`✅ WhatsApp Anniversary message sent to \${phone}\`);
          }
        } catch (waErr) {
          console.error(\`❌ Failed to send WhatsApp Anniversary message to \${phone}:\`, waErr);
        }
      }`
);

// ================= BAPTISMS =================
content = content.replace(
  `    const membersSnap = await db.collection('members').get();
    const baptisms: any[] = [];
    
    membersSnap.forEach((doc: any) => {`,
  `    const legacyMembersSnap = await db.collection('members').get();
    const churchMembersSnap = await db.collectionGroup('members').get();
    const baptisms: any[] = [];
    const processedMemberIds = new Set<string>();
    
    const processDoc = (doc: any, churchId: string) => {
      if (processedMemberIds.has(doc.id)) return;
      processedMemberIds.add(doc.id);`
);

content = content.replace(
  `        baptisms.push({
          id: doc.id,
          name: data.name || (data.firstName ? data.firstName + ' ' + (data.lastName || '') : 'Unknown'),
          years: years || '',
          phone: data.phone || data.mobile
        });
      }
    });`,
  `        baptisms.push({
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
    });`
);

content = content.replace(
  `      // Automatically send WhatsApp message
      if (member.phone) {
        try {
          // Note: using birthday_card for all celebrations as per We Celebration tab currently
          await sendWhatsAppTemplateInternal(DEFAULT_CHURCH_ID, member.phone, 'birthday_card');
          console.log(\`✅ WhatsApp Baptism Anniversary message sent to \${member.name}\`);
        } catch (waErr) {
          console.error(\`❌ Failed to send WhatsApp Baptism Anniversary to \${member.name}:\`, waErr);
        }
      }`,
  `      // Automatically send WhatsApp message
      if (member.phone) {
        try {
          // Note: using birthday_card for all celebrations as per We Celebration tab currently
          if (member.churchId === DEFAULT_CHURCH_ID || enabledChurchIds.has(member.churchId)) {
            await sendWhatsAppTemplateInternal(member.churchId, member.phone, 'birthday_card');
            console.log(\`✅ WhatsApp Baptism Anniversary message sent to \${member.name}\`);
          }
        } catch (waErr) {
          console.error(\`❌ Failed to send WhatsApp Baptism Anniversary to \${member.name}:\`, waErr);
        }
      }`
);

fs.writeFileSync(indexPath, content);
console.log('Successfully refactored index.ts with clean logic!');
