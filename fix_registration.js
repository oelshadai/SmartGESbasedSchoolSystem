const fs = require('fs');

const files = [
  'frontend/src/pages/RegisterPage.tsx',
  'frontend/src/pages/ResetPasswordPage.tsx',
];

// For registration pages, upgrade slate colors moderately
const replacements = [
  { old: /text-slate-500(["\s])/g, new: 'text-slate-400$1' },
  { old: /text-slate-400(["\s])/g, new: 'text-slate-300$1' },
  { old: /text-slate-300(["\s])/g, new: 'text-slate-200$1' },
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

console.log(`\nTotal registration pages fixed: ${totalFixed}`);
