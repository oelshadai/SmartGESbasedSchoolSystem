const fs = require('fs');
const path = require('path');

const files = [
  'frontend/src/pages/dashboards/StudentDashboard.tsx',
  'frontend/src/pages/dashboards/TeacherDashboard.tsx',
  'frontend/src/pages/dashboards/SchoolAdminDashboard.tsx',
  'frontend/src/pages/teacher/GradeBook.tsx',
  'frontend/src/pages/school/StaffPermissions.tsx',
  'frontend/src/pages/school/FeeManagement.tsx',
  'frontend/src/pages/school/SmsSettings.tsx',
  'frontend/src/pages/teacher/FeeCollection.tsx',
  'frontend/src/pages/teacher/AttendanceManagement.tsx',
  'frontend/src/pages/teacher/AssignmentGrading.tsx',
  'frontend/src/pages/school/StudentsManagement.tsx',
  'frontend/src/pages/school/SubjectsManagement.tsx',
  'frontend/src/pages/school/ClassesManagement.tsx',
  'frontend/src/pages/student/StudentEvents.tsx',
  'frontend/src/pages/student/StudentBills.tsx',
];

const replacements = [
  { old: /text-gray-600/g, new: 'text-foreground' },
  { old: /text-gray-500/g, new: 'text-foreground\/70' },
  { old: /text-gray-400/g, new: 'text-foreground\/60' },
  { old: /text-gray-300/g, new: 'text-foreground\/50' },
  { old: /text-slate-600/g, new: 'text-foreground' },
  { old: /text-slate-500/g, new: 'text-foreground\/70' },
  { old: /text-slate-400/g, new: 'text-foreground\/70' },
  { old: /text-slate-300/g, new: 'text-foreground\/60' },
  { old: /text-muted-foreground\/30/g, new: 'text-foreground\/40' },
  { old: /text-foreground\/30([^0-9])/g, new: 'text-foreground\/50$1' },
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

console.log(`\nTotal files fixed: ${totalFixed}`);
