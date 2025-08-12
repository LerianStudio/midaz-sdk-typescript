# Contributing to Midaz SDK TypeScript

Thank you for your interest in contributing to the Midaz SDK! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/midaz-sdk-typescript.git`
3. Install dependencies: `npm install`
4. Create a feature branch: `git checkout -b feature/your-feature-name`

## Development Workflow

### Prerequisites

- Node.js 18.18.0 or later (but less than 24)
- npm 6+
- TypeScript 5.8 or later

### Setup

```bash
# Install dependencies
npm install

# Build the SDK
npm run build
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific tests
npm test tests/path/to/file.test.ts

# Run with coverage report
npm test -- --coverage
```

### Linting and Formatting

```bash
# Run the linter
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check
```

### Documentation

```bash
# Generate documentation
npm run docs
```

### Examples

```bash
# Run workflow example
npm run example:workflow
```

## Pull Request Process

1. Ensure your code adheres to the project's coding standards
2. Update documentation as needed
3. Add or update tests for new features or bug fixes
4. Ensure all tests pass
5. Update TypeDoc comments for any new or modified public APIs
6. Run `npm run docs` to generate updated API documentation
7. Submit a pull request to the `main` branch
8. Fill out the pull request template completely

### Branch Naming Convention

Use the following branch naming convention:

- `feature/your-feature-name` for new features
- `fix/issue-description` for bug fixes
- `docs/what-you-documented` for documentation updates
- `refactor/what-you-refactored` for code refactoring
- `test/what-you-tested` for test additions or modifications

### Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

Format: `<type>(<scope>): <description>`

Examples:

- `feat(accounts): add support for account aliases`
- `fix(transactions): correct validation for transaction amounts`
- `docs(readme): update installation instructions`
- `refactor(api): simplify API client methods`
- `test(balances): add tests for balance calculation`

### Pull Request Guidelines

- PRs should focus on a single feature, bug fix, or improvement
- PRs should include tests for new functionality
- Large PRs should be broken down into smaller, more manageable pieces
- Ensure your PR description clearly explains the changes and the motivation behind them

## Release Process

The release process is automated through GitHub Actions:

1. We use [Semantic Versioning](https://semver.org/)
2. Releases are created through GitHub releases
3. When a release is created, the CI/CD pipeline automatically:
   - Builds the package
   - Runs tests
   - Publishes to npm
   - Generates documentation
   - Updates the changelog

## Code Style Guidelines

### TypeScript Best Practices

- Use TypeScript's strict mode
- Prefer interfaces over type aliases for object types
- Use proper JSDoc comments for all public APIs
- Follow the principle of least privilege for function parameters and return types
- Use readonly modifiers where appropriate
- Avoid using `any` type; use `unknown` instead when type is truly unknown

### Testing Guidelines

- Write unit tests for all new functionality
- Aim for high test coverage, especially for critical components
- Use descriptive test names that explain the expected behavior
- Structure tests using the Arrange-Act-Assert pattern
- Mock external dependencies appropriately

## Documentation Guidelines

- Use JSDoc comments for all public APIs
- Include examples in documentation where appropriate
- Keep the README and other documentation files up to date
- Follow the established documentation structure

## Additional Resources

- [API Documentation](https://docs.lerian.studio)
- [Issue Tracker](https://github.com/lerianstudio/midaz-sdk-typescript/issues)
- [Project Roadmap](https://github.com/lerianstudio/midaz-sdk-typescript/projects)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)

Thank you for contributing to the Midaz SDK!
