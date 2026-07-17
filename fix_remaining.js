const fs = require('fs');

const files = [
  'frontend/src/App.tsx',
  'frontend/src/pages/ProfessionalLoginPage.tsx',
  'frontend/src/pages/SuperAdminLoginPage.tsx',
  'frontend/src/pages/RegisterPage.tsx',
  'frontend/src/pages/ResetPasswordPage.tsx',
  'frontend/src/pages/teacher/StudentBehavior.tsx',
  'frontend/src/pages/student/StudentEvents.tsx',
  'frontend/src/pages/school/SmsSettings.tsx',
  'frontend/src/pages/teacher/ScoreEntry.tsx',
  'frontend/src/pages/school/EventPlanner.tsx',
  'frontend/src/pages/admin/SubscriptionManagement.tsx',
  'frontend/src/components/StudentPromotionSystem.tsx',
  'frontend/src/components/StudentValidationUtility.tsx',
  'frontend/src/components/pwa/PWAInstallPrompt.tsx',
];

// For login pages, we do minimal changes to preserve design
const replacements = [
  { old: /text-gray-600/g, new: 'text-foreground' },
  { old: /text-gray-500/g, new: 'text-foreground\/70' },
  { old: /text-gray-400/g, new: 'text-foreground\/60' },
  { old: /text-gray-300/g, new: 'text-foreground\/50' },
  // For login pages, be more conservative with slate colors
  { old: /text-slate-600/g, new: 'text-slate-500' },
  { old: /text-muted-foreground\/30/g, new: 'text-foreground\/40' },
];

let totalFixed = 0;

files.forEach(fpath => {
  if (!fs.existsSync(fpath)) {
    return;
  }

  try {
    let content = fs.readFileSync(fpath, 'utf-8');
    const original = content;

    replacements.forEach(({ old, new: newVal }) => {
      content = content.replace(old, newVal);
    });

    if (content !== original) {
      fs.writeFileSync(fpath, content, 'utf-8');
      console.log(`✓ Fixed: ${fpath}`);
      totalFixed++;
    }
  } catch (err) {
    console.log(`✗ Error in ${fpath}: ${err.message}`);
  }
});

console.log(`\nTotal remaining files fixed: ${totalFixed}`);
