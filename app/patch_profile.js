const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'screens', 'ProfileScreen.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add viewMode and setViewMode to useAuth
content = content.replace(
  `const { user, signOut, member: authMember } = useAuth();`,
  `const { user, signOut, member: authMember, viewMode, setViewMode } = useAuth();`
);

// 2. Add isActualAdmin definition
content = content.replace(
  `const memberSince = `,
  `const isActualAdmin = authMember?.userType?.trim().toLowerCase() === 'admin' || authMember?.userType?.trim().toLowerCase() === 'super_admin';\n  const memberSince = `
);

// 3. Add Switch to Admin Dashboard button above the Account Settings map
content = content.replace(
  `<Text style={styles.sectionTitle}>ACCOUNT</Text>`,
  `{isActualAdmin && viewMode === 'member' && (
          <TouchableOpacity
            style={[styles.menuItem, { backgroundColor: '#1a2d5a', marginBottom: 20 }]}
            onPress={() => setViewMode('admin')}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(252, 211, 77, 0.2)' }]}>
              <ShieldCheck size={20} color="#FCD34D" />
            </View>
            <View style={styles.menuContent}>
              <Text style={[styles.menuTitle, { color: '#fff' }]}>Switch to Admin Dashboard</Text>
              <Text style={[styles.menuSub, { color: 'rgba(255,255,255,0.7)' }]}>Access church management tools</Text>
            </View>
            <ChevronRight size={16} color="rgba(255,255,255,0.5)" />
          </TouchableOpacity>
        )}
        <Text style={styles.sectionTitle}>ACCOUNT</Text>`
);

// 4. Add ShieldCheck import if not present
if (!content.includes('ShieldCheck')) {
  content = content.replace(
    `import { ChevronRight, Settings, LogOut`,
    `import { ChevronRight, Settings, LogOut, ShieldCheck`
  );
}

fs.writeFileSync(filePath, content);
console.log('ProfileScreen patched successfully.');
