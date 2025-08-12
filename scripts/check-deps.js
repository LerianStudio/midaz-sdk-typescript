#!/usr/bin/env node

/**
 * Check if required dependencies are installed for a given command
 */

const fs = require('fs');
const path = require('path');

const command = process.argv[2];
const silent = process.argv.includes('--silent');

function log(message) {
  if (!silent) {
    console.log(message);
  }
}

function checkDependency(dep) {
  try {
    require.resolve(dep);
    return true;
  } catch {
    return false;
  }
}

// Map of commands to their required dependencies
const commandDeps = {
  test: ['jest', 'ts-jest'],
  lint: ['eslint', '@eslint/eslintrc', '@typescript-eslint/parser'],
  format: ['prettier'],
  docs: ['typedoc'],
  size: ['bundlewatch'],
  husky: ['husky'],
};

function checkCommandDeps(cmd) {
  const deps = commandDeps[cmd];
  if (!deps) return true;

  const missing = deps.filter((dep) => !checkDependency(dep));

  if (missing.length > 0) {
    log(`\n⚠️  Missing dependencies for '${cmd}' command:`);
    log(`   ${missing.join(', ')}\n`);
    log(`📦 To fix this, run:`);
    log(`   npm install --production=false\n`);
    return false;
  }

  return true;
}

// For build commands, check if TypeScript is available
if ((command && command.includes('build')) || command === 'typecheck') {
  if (!checkDependency('typescript')) {
    log('\n⚠️  TypeScript is not installed.');
    log('📦 To fix this, run:');
    log('   npm install --production=false\n');
    process.exit(1);
  }
}

// Check specific command dependencies
if (command && commandDeps[command]) {
  if (!checkCommandDeps(command)) {
    process.exit(1);
  }
}

// If all checks pass
process.exit(0);
