#!/usr/bin/env node

/**
 * Script to run performance benchmarks
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Running Midaz SDK Performance Benchmarks\n');

try {
  // Run benchmarks with Node.js flags for better performance tracking
  execSync('npm test -- tests/benchmarks/performance.bench.ts --testTimeout=300000', {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'test',
      // Enable garbage collection tracking
      NODE_OPTIONS: '--expose-gc',
    },
  });
} catch (error) {
  console.error('❌ Benchmark failed:', error.message);
  process.exit(1);
}

console.log('\n✅ Benchmarks completed!');