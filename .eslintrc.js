module.exports = {
  parser: '@typescript-eslint/parser',
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  env: {
    node: true,
    commonjs: true,
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
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'off', // TODO: Fix
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/ban-ts-comment': 'warn',

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
      },
    ],
  },
  overrides: [
    {
      // Allow non-null assertions, ts-ignore comments, and require statements in test files
      files: ["**/*.test.ts"],
      rules: {
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/ban-ts-comment": "off",
        "@typescript-eslint/no-var-requires": "off",
        "sort-imports": "off",
        "@typescript-eslint/no-unused-vars": "off"
      }
    },
    {
      // Allow unused variables in mock files
      files: ["**/mock-*.ts"],
      rules: {
        "@typescript-eslint/no-unused-vars": "off"
      }
    },
    {
      // Temporarily allow unused variables and import sorting in source files until they can be properly refactored
      files: ["src/**/*.ts"],
      rules: {
        "@typescript-eslint/no-unused-vars": "warn",
        "sort-imports": "warn"
      }
    }
  ],
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.ts'],
      },
      typescript: {
        alwaysTryTypes: true,
      },
    },
  },
};
