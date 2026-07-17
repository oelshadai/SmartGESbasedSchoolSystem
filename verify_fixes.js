const fs = require('fs');
const path = require('path');

function searchDirectory(dir, pattern) {
  let matches = [];
  
  function walk(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    items.forEach(item => {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('.next')) {
        walk(fullPath);
      } else if ((item.endsWith('.tsx') || item.endsWith('.ts')) && !item.includes('.test.')) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          const lines = content.split('\n');
          
          lines.forEach((line, idx) => {
            if (pattern.test(line)) {
              matches.push({ file: fullPath, line: idx + 1, content: line.trim() });
            }
          });
        } catch (e) {}
      }
    });
  }
  
  walk(dir);
  return matches;
}

const pattern = /text-gray-(300|400|500|600)|text-slate-(300|400|500|600)/;
const results = searchDirectory('frontend/src', pattern);

console.log(`Found ${results.length} remaining problematic text colors:\n`);

// Show first 30 results
results.slice(0, 30).forEach(r => {
  console.log(`${r.file}:${r.line}`);
  console.log(`  ${r.content.substring(0, 100)}`);
});

if (results.length > 30) {
  console.log(`\n... and ${results.length - 30} more instances`);
}

console.log(`\nTotal remaining issues: ${results.length}`);
