const fs = require('fs');
const path = require('path');

const servicePath = path.join(__dirname, 'src', 'services', 'FirestoreService.ts');
let content = fs.readFileSync(servicePath, 'utf8');

// Prioritize dob
content = content.replace(
  "Birthdate: normalizeDate(data.birthdate || data.dateOfBirth || data.dob || data.birthday),",
  "Birthdate: normalizeDate(data.dob || data.birthdate || data.dateOfBirth || data.birthday),"
);

content = content.replace(
  "allBirthdates: [normalizeDate(data.birthdate), normalizeDate(data.dateOfBirth), normalizeDate(data.dob), normalizeDate(data.birthday)].filter(Boolean),",
  "allBirthdates: [normalizeDate(data.dob), normalizeDate(data.birthdate), normalizeDate(data.dateOfBirth), normalizeDate(data.birthday)].filter(Boolean),"
);

fs.writeFileSync(servicePath, content, 'utf8');

// Also update HomeScreen.tsx just in case
const homePath = path.join(__dirname, 'src', 'screens', 'HomeScreen.tsx');
let homeContent = fs.readFileSync(homePath, 'utf8');

homeContent = homeContent.replace(
  "Birthdate: (member as any).birthdate || (member as any).dob,",
  "Birthdate: (member as any).dob || (member as any).birthdate || (member as any).dateOfBirth || (member as any).birthday,"
);

fs.writeFileSync(homePath, homeContent, 'utf8');

console.log('Prioritized dob across the app');
