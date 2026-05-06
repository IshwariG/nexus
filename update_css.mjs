import fs from 'fs';
import path from 'path';

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace colors
  content = content.replace(/#113629/g, 'var(--color-primary)'); // dark green -> dark grey
  content = content.replace(/#fdfcfa|#faf9f6|#f9f9f6/g, 'var(--color-light)'); // light backgrounds -> soft white
  content = content.replace(/#123026/g, 'var(--color-secondary)'); // sales-active-bg -> silver grey
  content = content.replace(/#c2a661/g, 'var(--color-accent)'); // gold accent
  content = content.replace(/#0b1512/g, '#ffffff'); // sidebar bg -> white
  
  // Update border radius for forms and buttons in specific files if needed
  // We'll let globals.css handle most buttons
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${filePath}`);
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.css')) {
      replaceInFile(fullPath);
    }
  }
}

walkDir('./src/app');
