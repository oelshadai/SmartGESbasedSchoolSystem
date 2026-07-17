const fs = require('fs');
const path = require('path');

const files = [
  'frontend/src/pages/admin/SystemSettings.tsx',
  'frontend/src/pages/admin/SystemAnalytics.tsx',
  'frontend/src/pages/admin/UsersManagement.tsx',
  'frontend/src/pages/admin/SchoolsManagement.tsx',
  'frontend/src/pages/admin/SupportTickets.tsx',
  'frontend/src/pages/superadmin/AdminSystemHealth.tsx',
  'frontend/src/pages/superadmin/AdminBillingDashboard.tsx',
  'frontend/src/pages/dashboards/ProfessionalSuperAdminDashboard.tsx',
  'frontend/src/pages/dashboards/StudentDashboard.tsx',
  'frontend/src/pages/PromotionPage.tsx',
  'frontend/src/pages/parent/ParentDashboard.tsx',
  'frontend/src/pages/school/BudgetPlanning.tsx',
  'frontend/src/pages/school/EventPlanner.tsx',
  'frontend/src/pages/school/StaffManagement.tsx',
  'frontend/src/components/QuickLogin.tsx',
  'frontend/src/components/ReportPreviewModal.tsx',
  'frontend/src/components/BulkReportPreviewModal.tsx',
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

console.log(`\nTotal additional files fixed: ${totalFixed}`);
