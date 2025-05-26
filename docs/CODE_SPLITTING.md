# Code Splitting Guide

This guide explains how to use code splitting with the Midaz SDK to reduce bundle size and improve load times.

## Overview

The Midaz SDK supports code splitting, allowing you to load only the parts of the SDK you need. This is especially useful for applications that only use specific features.

## Installation Methods

### 1. Full SDK (Traditional)

```typescript
import { MidazClient } from 'midaz-sdk';

const client = new MidazClient({
  apiKey: 'your-api-key',
  baseUrls: {
    onboarding: 'https://api.midaz.com',
  },
});
```

Bundle size: ~100KB (minified + gzipped)

### 2. Modular Import (Recommended)

Import only what you need:

```typescript
// Core client only
import { MidazClient } from 'midaz-sdk/core';

// Import specific entity services
import { OrganizationsService } from 'midaz-sdk/entities/organizations';
import { AccountsService } from 'midaz-sdk/entities/accounts';

// Import specific utilities
import { createIdempotencyKey } from 'midaz-sdk/utils/crypto';
```

Bundle size: ~30-50KB depending on usage

### 3. Dynamic Import (Advanced)

Load features on demand:

```typescript
// Lazy load the SDK
const { MidazClient } = await import('midaz-sdk');

// Lazy load specific features
async function loadTransactionFeatures() {
  const { TransactionsService } = await import('midaz-sdk/entities/transactions');
  return TransactionsService;
}

// Use with React
const TransactionModule = React.lazy(() => 
  import('midaz-sdk/entities/transactions')
);
```

## Webpack Configuration

To enable code splitting in your webpack config:

```javascript
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        'midaz-core': {
          test: /[\\/]node_modules[\\/]midaz-sdk[\\/]core[\\/]/,
          name: 'midaz-core',
          priority: 20,
        },
        'midaz-entities': {
          test: /[\\/]node_modules[\\/]midaz-sdk[\\/]entities[\\/]/,
          name: 'midaz-entities',
          priority: 15,
        },
        'midaz-utils': {
          test: /[\\/]node_modules[\\/]midaz-sdk[\\/]utils[\\/]/,
          name: 'midaz-utils',
          priority: 10,
        },
      },
    },
  },
};
```

## Vite Configuration

For Vite users:

```javascript
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'midaz-core': ['midaz-sdk/core'],
          'midaz-entities': ['midaz-sdk/entities'],
          'midaz-utils': ['midaz-sdk/utils'],
        },
      },
    },
  },
};
```

## Tree Shaking

The SDK is built with tree shaking in mind:

1. All exports are ES modules
2. No side effects in module initialization
3. Pure functions marked with `/*#__PURE__*/`

### Example: Using Only Organizations

```typescript
// This will only include Organizations code
import { MidazClient } from 'midaz-sdk/core';
import { createOrganizationsService } from 'midaz-sdk/entities/organizations';

const client = new MidazClient({
  apiKey: 'your-api-key',
  baseUrls: { onboarding: 'https://api.midaz.com' },
});

const organizations = createOrganizationsService(client);
const orgs = await organizations.listOrganizations();
```

Bundle includes only:
- Core client (~15KB)
- Organizations service (~5KB)
- Required utilities (~10KB)
Total: ~30KB instead of 100KB

## Module Aliases

For cleaner imports, configure module aliases:

### TypeScript (tsconfig.json)

```json
{
  "compilerOptions": {
    "paths": {
      "@midaz/core": ["node_modules/midaz-sdk/core"],
      "@midaz/entities/*": ["node_modules/midaz-sdk/entities/*"],
      "@midaz/utils/*": ["node_modules/midaz-sdk/utils/*"]
    }
  }
}
```

### Usage

```typescript
import { MidazClient } from '@midaz/core';
import { AccountsService } from '@midaz/entities/accounts';
import { createHash } from '@midaz/utils/crypto';
```

## Conditional Loading

Load features based on user permissions or routes:

```typescript
class MidazSDKLoader {
  private modules = new Map();

  async loadModule(name: string) {
    if (this.modules.has(name)) {
      return this.modules.get(name);
    }

    let module;
    switch (name) {
      case 'organizations':
        module = await import('midaz-sdk/entities/organizations');
        break;
      case 'accounts':
        module = await import('midaz-sdk/entities/accounts');
        break;
      case 'transactions':
        module = await import('midaz-sdk/entities/transactions');
        break;
      default:
        throw new Error(`Unknown module: ${name}`);
    }

    this.modules.set(name, module);
    return module;
  }
}

// Usage
const loader = new MidazSDKLoader();
const orgModule = await loader.loadModule('organizations');
```

## React Example

```typescript
// MidazProvider.tsx
import React, { createContext, useContext, useMemo } from 'react';
import { MidazClient } from 'midaz-sdk/core';

const MidazContext = createContext<MidazClient | null>(null);

export function MidazProvider({ children, config }) {
  const client = useMemo(() => new MidazClient(config), [config]);
  
  return (
    <MidazContext.Provider value={client}>
      {children}
    </MidazContext.Provider>
  );
}

export function useMidazClient() {
  const client = useContext(MidazContext);
  if (!client) {
    throw new Error('useMidazClient must be used within MidazProvider');
  }
  return client;
}

// LazyOrganizations.tsx
const OrganizationsModule = React.lazy(() => 
  import('./OrganizationsModule')
);

export function LazyOrganizations() {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <OrganizationsModule />
    </React.Suspense>
  );
}
```

## Bundle Analysis

To analyze your bundle:

```bash
# Using the SDK's built-in analyzer
npm run build:analyze

# Or with webpack-bundle-analyzer
webpack --profile --json > stats.json
webpack-bundle-analyzer stats.json
```

## Best Practices

1. **Start with modular imports**: Import only what you need
2. **Use dynamic imports for large features**: Load on-demand
3. **Monitor bundle size**: Use bundle analyzer regularly
4. **Leverage caching**: Split vendor chunks for better caching
5. **Preload critical paths**: Use `<link rel="preload">` for critical chunks

## Performance Impact

Typical improvements with code splitting:

- Initial load: 60-70% reduction
- Time to Interactive: 40-50% faster
- Memory usage: 30-40% lower

## Troubleshooting

### Issue: Tree shaking not working

Solution: Ensure you're using ES modules and production mode:
```json
{
  "sideEffects": false,
  "module": "dist/esm/index.js"
}
```

### Issue: Dynamic imports not splitting

Solution: Use magic comments:
```typescript
const module = await import(
  /* webpackChunkName: "midaz-transactions" */
  'midaz-sdk/entities/transactions'
);
```

### Issue: Circular dependencies

Solution: The SDK avoids circular dependencies, but if you encounter them:
```typescript
// Bad
import { MidazClient } from '.';

// Good
import { MidazClient } from './client';
```