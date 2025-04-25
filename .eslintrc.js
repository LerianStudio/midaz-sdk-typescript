module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  env: {
    node: true,
    commonjs: true
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    // Basic code style rules
    'no-console': ['off', { allow: ['warn', 'error', 'info'] }],
    'no-unused-vars': 'off', // TypeScript handles this better
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'off', // TODO: Fix
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/ban-ts-comment': 'warn',

    // Import ordering rules
    'import/order': [
      'error',
      {
        groups: [
          'builtin',    // Node.js built-in modules
          'external',   // Packages from node_modules
          'internal',   // Local imports using path aliases (if any)
          'parent',     // Imports from parent directories
          'sibling',    // Imports from sibling files
          'index',      // Imports from the same directory
          'object',     // Object imports (TypeScript only)
          'type',       // Type imports (TypeScript only)
        ],
        pathGroups: [
          // Define any path aliases here if needed
          {
            pattern: '@midaz/**',
            group: 'internal'
          },
          // Service interfaces should come before implementations
          {
            pattern: './!(implementations)/**',
            group: 'sibling',
            position: 'before'
          },
          {
            pattern: './*.{ts,js}',
            group: 'sibling',
            position: 'before'
          },
          {
            pattern: './implementations/**',
            group: 'sibling',
            position: 'after'
          }
        ],
        pathGroupsExcludedImportTypes: ['builtin', 'external', 'internal', 'parent'],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true
        }
      }
    ],

    // Import style rules
    'import/no-duplicates': 'error',
    'sort-imports': [
      'error',
      {
        ignoreCase: true,
        ignoreDeclarationSort: true, // Let import/order handle this
        ignoreMemberSort: false,
        memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
        allowSeparatedGroups: true,
      }
    ],
  },
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.ts']
      },
      typescript: {
        alwaysTryTypes: true,
      }
    }
  }
};
