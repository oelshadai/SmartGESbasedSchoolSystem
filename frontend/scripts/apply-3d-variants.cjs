const fs = require('fs');
const path = require('path');

const files = [
  'src/pages/dashboards/SchoolAdminDashboard.tsx',
  'src/pages/dashboards/ProfessionalSuperAdminDashboard.tsx',
  'src/pages/dashboards/TeacherDashboard.tsx',
  'src/pages/dashboards/StudentDashboard.tsx',
  'src/pages/parent/ParentDashboard.tsx',
  'src/pages/school/FinancialDashboard.tsx',
  'src/pages/school/SchoolSettings.tsx',
  'src/pages/admin/SystemSettings.tsx',
  'src/pages/school/AcademicYearManagement.tsx',
  'src/pages/teacher/AttendanceManagement.tsx',
  'src/pages/school/FeeManagement.tsx',
  'src/pages/student/StudentProfile.tsx',
  'src/pages/student/StudentReports.tsx',
  'src/pages/parent/ParentGrades.tsx',
  'src/pages/school/ReportsDashboard.tsx',
  'src/pages/school/TeachersManagement.tsx',
  'src/pages/school/StudentsManagement.tsx',
  'src/pages/school/Announcements.tsx',
  'src/pages/teacher/TeacherAssignments.tsx',
  'src/pages/teacher/ScoreEntry.tsx',
];

const rootFile = 'src/components/AppLayout.tsx';

function addVariant(contents) {
  const regex = /<Card(?![^>]*\bvariant=)(?=\s|>)/g;
  return contents.replace(regex, '<Card variant="elevated"');
}

files.forEach((relPath) => {
  const filePath = path.join(__dirname, '..', relPath);
  if (!fs.existsSync(filePath)) {
    console.warn(`Skipped missing file: ${filePath}`);
    return;
  }
  const contents = fs.readFileSync(filePath, 'utf8');
  const updated = addVariant(contents);
  if (updated !== contents) {
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log(`Patched ${relPath}`);
  } else {
    console.log(`No changes needed: ${relPath}`);
  }
});

const rootPath = path.join(__dirname, '..', rootFile);
if (fs.existsSync(rootPath)) {
  const contents = fs.readFileSync(rootPath, 'utf8');
  const updated = contents.replace(
    'className="flex h-screen overflow-hidden bg-background"',
    'className="flex h-screen overflow-hidden bg-background professional-3d"'
  );
  if (updated !== contents) {
    fs.writeFileSync(rootPath, updated, 'utf8');
    console.log(`Patched ${rootFile}`);
  } else {
    console.log(`No root class patch needed`);
  }
} else {
  console.warn(`Root layout not found: ${rootPath}`);
}
