# CI/CD ESLint Fix Required

## Issue
The SDK package has no runtime dependencies (only devDependencies). When running `npm install`, it only installs runtime dependencies by default, which is why it reports "up to date, audited 1 package".

## Solution
For CI/CD, you must install devDependencies explicitly:

```bash
# Option 1: Install with dev dependencies
npm install --include=dev

# Option 2: Use npm ci with dev dependencies
npm ci --include=dev

# Option 3: Set production to false
npm install --production=false
```

## Root Cause
The `midaz-sdk` package in `sdk-source` directory has:
- No runtime dependencies (`dependencies: {}`)
- Only devDependencies (ESLint, TypeScript, Jest, etc.)

This is correct for a library that's meant to be bundled - all dependencies should be devDependencies.

## Files Created
- `eslint.config.js` - ESLint v9 config format (requires TypeScript parser from devDependencies)
- `.eslintrc.js` - Old ESLint config format (for ESLint v8 compatibility)

## CI/CD Configuration
Update your CI/CD pipeline to use one of these commands:
```yaml
# GitHub Actions example
- run: npm install --include=dev
- run: npm run lint

# Or for faster CI builds
- run: npm ci --include=dev
- run: npm run lint
```