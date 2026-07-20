const fs = require('fs');

const path = './src/index.ts';
let content = fs.readFileSync(path, 'utf8');

// Replacement #1: Birthdays
content = content.replace(
  `    const membersSnap = await db.collection('members').get();
    const bdays: any[] = [];
    
    membersSnap.forEach((doc: any) => {`,
  `    const churchesSnap = await db.collection('churches').where('whatsappIntegrationEnabled', '==', true).get();
    const enabledChurchIds = new Set<string>();
    churchesSnap.forEach((doc: any) => enabledChurchIds.add(doc.id));

    const legacyMembersSnap = await db.collection('members').get();
    const churchMembersSnap = await db.collectionGroup('members').get();
    
    const processedMemberIds = new Set<string>();
    const bdays: any[] = [];
    
    const processDoc = (doc: any, churchId: string) => {
      if (processedMemberIds.has(doc.id)) return;
      processedMemberIds.add(doc.id);`
);

content = content.replace(
  `        bdays.push({
          id: doc.id,
          name: data.name || (data.firstName ? data.firstName + ' ' + (data.lastName || '') : 'Unknown'),
          phone: data.phone || data.mobile
        });
      }
    });`,
  `        bdays.push({
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
          // Note: using birthday_card for all celebrations as per We Celebration tab currently
          await sendWhatsAppTemplateInternal(DEFAULT_CHURCH_ID, member.phone, 'birthday_card');
          console.log(\`✅ WhatsApp Birthday message sent to \${member.name}\`);
        } catch (waErr) {
          console.error(\`❌ Failed to send WhatsApp Birthday to \${member.name}:\`, waErr);
        }
      }`,
  `      // Automatically send WhatsApp message
      if (member.phone) {
        try {
          if (member.churchId === DEFAULT_CHURCH_ID || enabledChurchIds.has(member.churchId)) {
            await sendWhatsAppTemplateInternal(member.churchId, member.phone, 'birthday_card');
            console.log(\`✅ WhatsApp Birthday message sent to \${member.name}\`);
          }
        } catch (waErr) {
          console.error(\`❌ Failed to send WhatsApp Birthday to \${member.name}:\`, waErr);
        }
      }`
);


// Replacement #2: Anniversaries
content = content.replace(
  `    const membersSnap = await db.collection('members').get();
    const anniversaries: any[] = [];
    
    membersSnap.forEach((doc: any) => {`,
  `    const churchesSnap = await db.collection('churches').where('whatsappIntegrationEnabled', '==', true).get();
    const enabledChurchIds = new Set<string>();
    churchesSnap.forEach((doc: any) => enabledChurchIds.add(doc.id));

    const legacyMembersSnap = await db.collection('members').get();
    const churchMembersSnap = await db.collectionGroup('members').get();
    
    const processedMemberIds = new Set<string>();
    const anniversaries: any[] = [];
    
    const processDoc = (doc: any, churchId: string) => {
      if (processedMemberIds.has(doc.id)) return;
      processedMemberIds.add(doc.id);`
);

content = content.replace(
  `        anniversaries.push({
          id: doc.id,
          husband: data.husbandName || 'Husband',
          wife: data.wifeName || 'Wife',
          years: years || '',
          phone: data.phone || data.mobile
        });
      }
    });`,
  `        anniversaries.push({
          id: doc.id,
          churchId,
          husband: data.husbandName || 'Husband',
          wife: data.wifeName || 'Wife',
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
      if (ann.phone) {
        try {
          // Note: using birthday_card for all celebrations as per We Celebration tab currently
          await sendWhatsAppTemplateInternal(DEFAULT_CHURCH_ID, ann.phone, 'birthday_card');
          console.log(\`✅ WhatsApp Anniversary message sent to \${ann.husband} & \${ann.wife}\`);
        } catch (waErr) {
          console.error(\`❌ Failed to send WhatsApp Anniversary to \${ann.husband}:\`, waErr);
        }
      }`,
  `      // Automatically send WhatsApp message
      if (ann.phone) {
        try {
          if (ann.churchId === DEFAULT_CHURCH_ID || enabledChurchIds.has(ann.churchId)) {
            await sendWhatsAppTemplateInternal(ann.churchId, ann.phone, 'birthday_card');
            console.log(\`✅ WhatsApp Anniversary message sent to \${ann.husband} & \${ann.wife}\`);
          }
        } catch (waErr) {
          console.error(\`❌ Failed to send WhatsApp Anniversary to \${ann.husband}:\`, waErr);
        }
      }`
);


// Replacement #3: Baptisms
content = content.replace(
  `    const membersSnap = await db.collection('members').get();
    const baptisms: any[] = [];
    
    membersSnap.forEach((doc: any) => {`,
  `    const churchesSnap = await db.collection('churches').where('whatsappIntegrationEnabled', '==', true).get();
    const enabledChurchIds = new Set<string>();
    churchesSnap.forEach((doc: any) => enabledChurchIds.add(doc.id));

    const legacyMembersSnap = await db.collection('members').get();
    const churchMembersSnap = await db.collectionGroup('members').get();
    
    const processedMemberIds = new Set<string>();
    const baptisms: any[] = [];
    
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
          console.log(\`✅ WhatsApp Baptism message sent to \${member.name}\`);
        } catch (waErr) {
          console.error(\`❌ Failed to send WhatsApp Baptism message to \${member.name}:\`, waErr);
        }
      }`,
  `      // Automatically send WhatsApp message
      if (member.phone) {
        try {
          if (member.churchId === DEFAULT_CHURCH_ID || enabledChurchIds.has(member.churchId)) {
            await sendWhatsAppTemplateInternal(member.churchId, member.phone, 'birthday_card');
            console.log(\`✅ WhatsApp Baptism message sent to \${member.name}\`);
          }
        } catch (waErr) {
          console.error(\`❌ Failed to send WhatsApp Baptism message to \${member.name}:\`, waErr);
        }
      }`
);

fs.writeFileSync(path, content);
console.log('done');
