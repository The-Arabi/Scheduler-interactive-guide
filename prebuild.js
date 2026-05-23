import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

console.log('[Pre-build diagnostic] Initiating build checks...');
console.log('[Pre-build diagnostic] Current working directory:', process.cwd());

try {
  console.log('[Pre-build Git Diagnostic] Current Branch / Commit:');
  console.log(execSync('git log -1 --oneline || echo "No git log"', { encoding: 'utf-8' }).trim());
  
  console.log('[Pre-build Git Diagnostic] git status --short:');
  console.log(execSync('git status --short || echo "No git status"', { encoding: 'utf-8' }));

  console.log('[Pre-build Git Diagnostic] git ls-files:');
  console.log(execSync('git ls-files || echo "No git ls-files"', { encoding: 'utf-8' }));
} catch (e) {
  console.error('[Pre-build Git Diagnostic] Error running git commands:', e.message);
}

// Helper to list files recursively up to 2 levels
function listDir(dir, depth = 0) {
  if (depth > 2) return;
  try {
    const files = fs.readdirSync(dir);
    console.log(`[Pre-build] Directory ${dir}:`, files);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory() && file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        listDir(fullPath, depth + 1);
      }
    }
  } catch (err) {
    console.warn(`[Pre-build] Failed to read ${dir}:`, err.message);
  }
}


// Rename case-mismatched folders/files to match lowercase standards on Linux
const uppercaseSrc = path.join(process.cwd(), 'Src');
const capitalSRC = path.join(process.cwd(), 'SRC');
const lowercaseSrc = path.join(process.cwd(), 'src');

if (fs.existsSync(uppercaseSrc)) {
  console.log('[Pre-build] Renaming "Src" to "src" because of casing mismatch.');
  try {
    fs.renameSync(uppercaseSrc, lowercaseSrc);
  } catch (e) {
    console.error('[Pre-build] Failed to rename Src:', e.message);
  }
}

if (fs.existsSync(capitalSRC)) {
  console.log('[Pre-build] Renaming "SRC" to "src" because of casing mismatch.');
  try {
    fs.renameSync(capitalSRC, lowercaseSrc);
  } catch (e) {
    console.error('[Pre-build] Failed to rename SRC:', e.message);
  }
}

if (fs.existsSync(lowercaseSrc)) {
  const capitalMain = path.join(lowercaseSrc, 'Main.tsx');
  const lowercaseMain = path.join(lowercaseSrc, 'main.tsx');
  if (fs.existsSync(capitalMain)) {
    console.log('[Pre-build] Renaming "Main.tsx" to "main.tsx" because of casing mismatch.');
    try {
      fs.renameSync(capitalMain, lowercaseMain);
    } catch (e) {
      console.error('[Pre-build] Failed to rename Main.tsx:', e.message);
    }
  }
}

// Print directory status for logging purposes
listDir(process.cwd());
