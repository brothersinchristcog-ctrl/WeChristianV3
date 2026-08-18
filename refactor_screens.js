const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'web', 'src', 'screens');
const adminScreensDir = path.join(screensDir, 'admin');

if (!fs.existsSync(screensDir)) {
  fs.mkdirSync(screensDir, { recursive: true });
}
if (!fs.existsSync(adminScreensDir)) {
  fs.mkdirSync(adminScreensDir, { recursive: true });
}

// Maps path -> New Screen Name
const pageMapping = {
  // Member Screens
  'web/src/app/dashboard/page.tsx': { file: 'MemberDashboard.tsx', component: 'MemberDashboardPage', dir: screensDir },
  'web/src/app/dashboard/about/page.tsx': { file: 'AboutScreen.tsx', component: 'AboutPage', dir: screensDir },
  'web/src/app/dashboard/bible/page.tsx': { file: 'BibleReader.tsx', component: 'BibleReaderPage', dir: screensDir },
  'web/src/app/dashboard/events/page.tsx': { file: 'EventsScreen.tsx', component: 'MemberEventsPage', dir: screensDir },
  'web/src/app/dashboard/giving/page.tsx': { file: 'GivingScreen.tsx', component: 'GivingPage', dir: screensDir },
  'web/src/app/dashboard/notes/page.tsx': { file: 'MemberNotes.tsx', component: 'MemberNotesPage', dir: screensDir },
  'web/src/app/dashboard/prayer/page.tsx': { file: 'PrayerWall.tsx', component: 'PrayerWallPage', dir: screensDir },
  'web/src/app/dashboard/profile/page.tsx': { file: 'ProfileScreen.tsx', component: 'ProfilePage', dir: screensDir },
  'web/src/app/dashboard/sermons/page.tsx': { file: 'SermonsScreen.tsx', component: 'MemberSermonsPage', dir: screensDir },
  'web/src/app/dashboard/songs/page.tsx': { file: 'SongsScreen.tsx', component: 'SongsPage', dir: screensDir },

  // Admin Screens
  'web/src/app/dashboard/admin/page.tsx': { file: 'AdminDashboard.tsx', component: 'AdminDashboardPage', dir: adminScreensDir },
  'web/src/app/dashboard/admin/celebrations/page.tsx': { file: 'AdminCelebrations.tsx', component: 'AdminCelebrationsPage', dir: adminScreensDir },
  'web/src/app/dashboard/admin/donations/page.tsx': { file: 'AdminDonations.tsx', component: 'AdminDonationsPage', dir: adminScreensDir },
  'web/src/app/dashboard/admin/events/page.tsx': { file: 'AdminEvents.tsx', component: 'AdminEventsPage', dir: adminScreensDir },
  'web/src/app/dashboard/admin/finance/page.tsx': { file: 'AdminFinance.tsx', component: 'AdminFinancePage', dir: adminScreensDir },
  'web/src/app/dashboard/admin/members/page.tsx': { file: 'AdminMembers.tsx', component: 'AdminMembersPage', dir: adminScreensDir },
  'web/src/app/dashboard/admin/notifications/page.tsx': { file: 'AdminNotifications.tsx', component: 'AdminNotificationPage', dir: adminScreensDir },
  'web/src/app/dashboard/admin/prayers/page.tsx': { file: 'AdminPrayers.tsx', component: 'AdminPrayersPage', dir: adminScreensDir },
  'web/src/app/dashboard/admin/sermons/page.tsx': { file: 'AdminSermons.tsx', component: 'AdminSermonsPage', dir: adminScreensDir },
  'web/src/app/dashboard/admin/settings/page.tsx': { file: 'AdminSettings.tsx', component: 'AdminSettingsPage', dir: adminScreensDir },
};

for (const [pagePath, info] of Object.entries(pageMapping)) {
  const fullPath = path.join(__dirname, pagePath);
  if (!fs.existsSync(fullPath)) {
    console.log(`Skipping ${fullPath}, does not exist.`);
    continue;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  
  // Write to new screen file
  const newFilePath = path.join(info.dir, info.file);
  fs.writeFileSync(newFilePath, content, 'utf8');
  
  console.log(`Moved ${pagePath} -> ${newFilePath}`);

  // Determine import path for page.tsx
  const isAdmin = info.dir === adminScreensDir;
  const importPath = isAdmin ? `@/screens/admin/${info.file.replace('.tsx', '')}` : `@/screens/${info.file.replace('.tsx', '')}`;

  // Write new page.tsx
  const newPageContent = `import ${info.component} from '${importPath}';\n\nexport default function Page() {\n  return <${info.component} />;\n}\n`;
  fs.writeFileSync(fullPath, newPageContent, 'utf8');
  console.log(`Updated wrapper for ${pagePath}`);
}

console.log("Refactoring complete!");
