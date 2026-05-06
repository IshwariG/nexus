import fs from 'fs';
import path from 'path';

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Revert colors
  content = content.replace(/var\(--color-primary\)/g, '#113629');
  content = content.replace(/var\(--color-light\)/g, '#fdfcfa'); // Best guess for light backgrounds, though original had a few variations. Actually, most were #fdfcfa or #faf9f6. Let's just use #fdfcfa.
  content = content.replace(/var\(--color-secondary\)/g, '#123026'); 
  content = content.replace(/var\(--color-accent\)/g, '#c2a661');
  // Wait, if I replace #ffffff with #0b1512 it might break legitimate #ffffff usage in those files!
  // I will skip that to be safe, since globals.css, contact.css, and admin.css are manually restored.
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Reverted ${filePath}`);
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.css')) {
      // Don't revert globals.css and contact.css and admin.css via this generic script
      if (!fullPath.includes('globals.css') && !fullPath.includes('contact.css') && !fullPath.includes('admin.css')) {
        replaceInFile(fullPath);
      }
    }
  }
}

walkDir('./src/app');

// Manually revert admin.css since we have the exact old content for the blocks we changed
const adminCssPath = './src/app/admin/admin.css';
let adminContent = fs.readFileSync(adminCssPath, 'utf8');

// 1. Root variables
adminContent = adminContent.replace(
  /:root {\n  --admin-bg: #f8fafc;\n  --sales-sidebar-bg: #ffffff;\n  --sales-active-bg: #f1f5f9;\n  --sales-hero-h: 320px;\n  --vanya-green: #1f2937;\n  --vanya-gold: #c9a96e;\n}/,
  `:root {
  --admin-bg: #f9f9f6;
  --sales-sidebar-bg: #0b1512;
  --sales-active-bg: #123026;
  --sales-hero-h: 320px;
  --vanya-green: #113629;
  --vanya-gold: #c2a661;
}`
);

// 2. widget-card
adminContent = adminContent.replace(
  /\.widget-card {\n  background: #ffffff;\n  padding: 2rem;\n  border-radius: 12px;\n  border: 1px solid #e5e7eb;\n  box-shadow: 0 4px 20px rgba\(0,0,0,0\.02\);\n  margin-bottom: 2rem;\n  transition: transform 0\.4s ease, box-shadow 0\.4s ease;\n}\n\.widget-card:hover {\n  transform: translateY\(-4px\);\n  box-shadow: 0 10px 30px rgba\(0,0,0,0\.05\);\n}/,
  `.widget-card {
  background: #fff;
  padding: 1.5rem;
  border-radius: 4px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.03);
  margin-bottom: 2rem;
}`
);

// 3. sales-sidebar and nav
adminContent = adminContent.replace(
  /\.sales-sidebar {[\s\S]*?\.btn-sales-new:hover {\n  background: #374151;\n  transform: translateY\(-2px\);\n  box-shadow: 0 6px 15px rgba\(0,0,0,0\.1\);\n}/,
  `.sales-sidebar {
  width: 240px;
  background-color: var(--sales-sidebar-bg);
  color: #fff;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0; left: 0; bottom: 0;
}
.sales-sidebar-logo {
  padding: 2rem 1.5rem;
}
.sales-sidebar-logo h2 {
  font-size: 1.2rem;
  margin: 0;
  letter-spacing: 2px;
}
.sales-sidebar-logo p {
  font-size: 0.6rem;
  color: #888;
  margin: 0;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.sales-nav {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding-top: 1rem;
}
.sales-nav a {
  padding: 1rem 1.5rem;
  color: #aaa;
  text-decoration: none;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  border-left: 3px solid transparent;
}
.sales-nav a.active {
  background-color: var(--sales-active-bg);
  color: #fff;
  border-left-color: var(--vanya-gold);
}

.sales-bottom {
  padding: 2rem 1.5rem;
}
.btn-sales-new {
  width: 100%;
  background: var(--sales-active-bg);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.1);
  padding: 0.75rem;
  cursor: pointer;
  font-size: 0.75rem;
  letter-spacing: 1px;
}`
);

// 4. sales-stat-card
adminContent = adminContent.replace(
  /\.sales-stat-card {\n  background: #ffffff;\n  padding: 2rem;\n  border-radius: 12px;\n  border: 1px solid #e5e7eb;\n  box-shadow: 0 4px 20px rgba\(0,0,0,0\.02\);\n  display: flex;\n  flex-direction: column;\n  transition: transform 0\.4s ease, box-shadow 0\.4s ease;\n}\n\.sales-stat-card:hover {\n  transform: translateY\(-4px\);\n  box-shadow: 0 10px 30px rgba\(0,0,0,0\.05\);\n}/,
  `.sales-stat-card {
  background: #fff;
  padding: 1.5rem;
  box-shadow: 0 10px 30px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
}`
);

fs.writeFileSync(adminCssPath, adminContent, 'utf8');
console.log('Reverted admin.css manually via script');
