/**
 * Script to build the SDK and run the simple example
 */
const { execSync } = require('child_process');
const path = require('path');

// Get the project root directory
const projectRoot = path.resolve(__dirname, '..');

console.log('Building the SDK...');
execSync('npm run build', { 
  cwd: projectRoot, 
  stdio: 'inherit' 
});

console.log('\nRunning the simple example...');
execSync('node examples/simple-example.js', { 
  cwd: projectRoot, 
  stdio: 'inherit' 
});

console.log('\nExample run successfully!');