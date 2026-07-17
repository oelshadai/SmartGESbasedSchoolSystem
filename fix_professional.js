const fs = require('fs');

const files = [
  'frontend/src/components/ProfessionalAdminLayout.tsx',
  'frontend/src/pages/ProfessionalLoginPage.tsx',
  'frontend/src/pages/SuperAdminLoginPage.tsx',
  'frontend/src/App.tsx',
];

// For professional components, we upgrade slightly to maintain design while improving readability
const replacements = [
  // Upgrade problematic slate colors - these should be more readable
  { old: /text-slate-600(["\s])/g, new: 'text-slate-500$1' },
  { old: /text-slate-500(["\s])/g, new: 'text-slate-400$1' },
  { old: /text-slate-400(["\s])/g, new: 'text-slate-300$1' },
  { old: /text-slate-300(["\s])/g, new: 'text-slate-100$1' },
  // Upgrade remaining gray
  { old: /text-gray-600(["\s])/g, new: 'text-slate-500$1' },
];

let totalFixed = 0;

files.forEach(fpath => {
  if (!fs.existsSync(fpath)) {
    console.log(`Skipped (not found): ${fpath}`);
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

console.log(`\nTotal professional components fixed: ${totalFixed}`);
