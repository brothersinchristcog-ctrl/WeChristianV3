const fs = require('fs');
const path = require('path');

const membersPath = path.join(__dirname, 'src', 'screens', 'MembersScreen.tsx');
let content = fs.readFileSync(membersPath, 'utf8');

// Update state definition
content = content.replace(
  "birthdate: '',",
  "dob: '',"
);

content = content.replace(
  "birthdate: '',",
  "dob: '',"
);

// Update reading from existing member
content = content.replace(
  "birthdate: c.birthdate || c.Birthdate || '',",
  "dob: c.dob || c.birthdate || c.dateOfBirth || c.birthday || c.Birthdate || '',"
);

// Update condition for date picker
content = content.replace(
  "if (datePickerType === 'birthdate') {",
  "if (datePickerType === 'birthdate') {"
);
content = content.replace(
  "setNewMember({ ...newMember, birthdate: formatted });",
  "setNewMember({ ...newMember, dob: formatted, birthdate: null, dateOfBirth: null, birthday: null });"
);

// Update the label UI condition
content = content.replace(
  "color: newMember.birthdate ?",
  "color: newMember.dob ?"
);
content = content.replace(
  "{newMember.birthdate || 'Select Birthdate'}",
  "{newMember.dob || 'Select Birthdate'}"
);

fs.writeFileSync(membersPath, content, 'utf8');
console.log('Standardized DOB in MembersScreen.tsx');
