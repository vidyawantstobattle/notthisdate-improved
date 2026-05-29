#!/usr/bin/env node

/**
 * Validates that all custom hooks and contexts are properly imported
 * Run this before building to catch missing imports
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Custom hooks and contexts to check
const customHooks = [
  { name: 'useDocumentTitle', path: '../hooks/useDocumentTitle' },
  { name: 'useCalendar', path: '../hooks/useCalendar' },
  { name: 'useAuth', path: '../context/AuthContext' },
  { name: 'useLanguage', path: '../context/LanguageContext' }
];

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const errors = [];

  // Check each custom hook
  for (const hook of customHooks) {
    // Skip checking in the file that defines this hook
    if (filePath.includes(hook.path.replace(/\.\.\//g, ''))) {
      continue;
    }

    const hookUsageRegex = new RegExp(`\\b${hook.name}\\(`, 'g');
    const importRegex = new RegExp(`import.*${hook.name}.*from.*['"]${hook.path}`, 'g');

    const isUsed = hookUsageRegex.test(content);
    const isImported = importRegex.test(content);

    if (isUsed && !isImported) {
      errors.push({
        hook: hook.name,
        message: `${hook.name} is used but not imported from '${hook.path}'`
      });
    }
  }

  return errors;
}

function walkDir(dir, filePattern = /\.(jsx?|tsx?)$/) {
  let files = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files = files.concat(walkDir(fullPath, filePattern));
    } else if (stat.isFile() && filePattern.test(item)) {
      files.push(fullPath);
    }
  }

  return files;
}

function main() {
  console.log(`${colors.blue}🔍 Validating imports...${colors.reset}\n`);

  const srcDir = path.join(__dirname, '..', 'src');
  const files = walkDir(srcDir);

  let totalErrors = 0;
  const filesWithErrors = [];

  for (const file of files) {
    const errors = checkFile(file);

    if (errors.length > 0) {
      totalErrors += errors.length;
      filesWithErrors.push({ file, errors });
    }
  }

  if (totalErrors === 0) {
    console.log(`${colors.green}✅ All imports are valid!${colors.reset}`);
    console.log(`${colors.green}✅ Checked ${files.length} files${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}❌ Found ${totalErrors} import error(s):${colors.reset}\n`);

    for (const { file, errors } of filesWithErrors) {
      const relativePath = path.relative(process.cwd(), file);
      console.log(`${colors.yellow}📄 ${relativePath}${colors.reset}`);

      for (const error of errors) {
        console.log(`   ${colors.red}✗${colors.reset} ${error.message}`);
      }
      console.log('');
    }

    console.log(`${colors.red}Please add the missing imports before building.${colors.reset}\n`);
    process.exit(1);
  }
}

main();

