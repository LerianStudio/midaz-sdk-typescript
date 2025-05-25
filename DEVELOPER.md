# Developer Guide

## 🚀 Quick Start

If you're setting up the project for the first time or encountering issues with npm scripts:

```bash
npm run setup
```

This command will install all development dependencies needed for building, testing, and linting.

## 📦 Improved Developer Experience

All npm scripts now include automatic dependency checking. If you run a command that requires development dependencies that aren't installed, the script will:

1. Detect the missing dependencies
2. Either auto-install them or provide clear instructions
3. Continue with the intended command

### Examples:

```bash
# These commands will work even if dev dependencies aren't installed
npm run build      # Checks for TypeScript, installs if needed
npm run test       # Checks for Jest, installs if needed  
npm run lint       # Checks for ESLint, installs if needed
npm run format     # Checks for Prettier, installs if needed
```

## 🛠️ Available Scripts

- `npm run setup` - Install all development dependencies
- `npm run build` - Build the SDK for all targets (CommonJS, ESM, Types)
- `npm run test` - Run tests
- `npm run lint` - Check code style
- `npm run lint:fix` - Fix code style issues
- `npm run format` - Format code with Prettier
- `npm run typecheck` - Type-check without building
- `npm run docs` - Generate API documentation

## 🏗️ Build System

The SDK uses a pure TypeScript implementation with no runtime dependencies:

- **CommonJS build**: `dist/index.js`
- **ESM build**: `dist/esm/index.js`  
- **TypeScript definitions**: `dist/index.d.ts`

## 🌐 Browser Compatibility

This SDK is designed to work in both Node.js and browser environments:

- Uses Web Crypto API for cryptographic operations
- No Node.js-specific dependencies in production code
- Fully tree-shakeable ESM build

## 🧪 Testing

The SDK uses Jest for testing. Test files are located in the `tests/` directory.

```bash
npm run test           # Run all tests
npm run test:watch     # Run tests in watch mode
npm run test:coverage  # Run tests with coverage report
```

## 📝 Code Style

The project uses ESLint and Prettier for code formatting:

```bash
npm run lint       # Check for linting errors
npm run lint:fix   # Fix linting errors
npm run format     # Format code with Prettier
```

## 🐛 Troubleshooting

### "command not found" errors

Run `npm run setup` to install all development dependencies.

### Build errors

1. Clear the build cache: `npm run clean`
2. Reinstall dependencies: `npm run setup`
3. Try building again: `npm run build`

### Test errors

Make sure you have the latest dependencies:
```bash
npm run setup
npm run test
```