import fs from 'fs';
import path from 'path';

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace green hex codes (primary dark color)
  content = content.replace(/#113629/gi, 'var(--vanya-green)');
  
  // Replace gold hex codes
  content = content.replace(/#c2a661/gi, 'var(--vanya-gold)');
  
  // Replace gradient green
  content = content.replace(/#1a4d35/gi, '#2d2d2d');

  // Replace light backgrounds to variables
  content = content.replace(/#fdfcfa|#faf9f6|#f9f9f6|#f8f9fb/gi, 'var(--admin-bg)');
  
  // Replace warm/soft surfaces to variables
  content = content.replace(/#fffcf6|#faf6eb/gi, 'var(--admin-surface)');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.css') || fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      // Avoid replacing inside files we don't want to mess up, but app is safe
      walkDir(fullPath);
    } else if (filePathMatches(fullPath)) {
      replaceInFile(fullPath);
    }
  }
}

function filePathMatches(p) {
  return p.endsWith('.css') || p.endsWith('.js') || p.endsWith('.jsx');
}

function startWalk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      // Don't walk node_modules or .next
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        startWalk(fullPath);
      }
    } else if (filePathMatches(fullPath)) {
      replaceInFile(fullPath);
    }
  }
}

startWalk('./src/app');
console.log('Finished updating theme colors.');
