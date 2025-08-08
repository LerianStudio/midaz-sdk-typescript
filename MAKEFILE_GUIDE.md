# Makefile Guide for Midaz TypeScript SDK

This Makefile provides a convenient way to manage common development tasks, similar to the Go SDK. It wraps npm scripts and provides additional functionality for a streamlined development experience.

## Quick Start

```bash
# Show all available commands
make help

# Setup development environment (install all dependencies)
make setup

# Build the project
make build

# Run tests
make test

# Run the new features example
make example
```

## Core Development Commands

### Setup and Installation
```bash
# Install all dependencies (dev + production)
make setup

# Install only production dependencies
make install

# Set up environment file
make set-env
```

### Building
```bash
# Build all targets (CommonJS + ESM + Types)
make build

# Build individual targets
make build-cjs      # CommonJS build
make build-esm      # ES modules build
make build-types    # TypeScript definitions

# Development mode (watch for changes)
make dev
make build-watch
```

### Testing
```bash
# Run all tests
make test

# Run tests with coverage report
make coverage

# Run tests in watch mode
make test-watch

# Run tests in CI mode
make test-ci
```

### Code Quality
```bash
# Run ESLint
make lint

# Fix linting issues automatically
make lint-fix

# Format code with Prettier
make format

# Check if code is properly formatted
make format-check

# Type-check without building
make typecheck

# Run all quality checks (lint + format + typecheck + test)
make verify
```

## Examples

### Run Individual Examples
```bash
# Run the new features example (demonstrates AccountTypes, OperationRoutes, etc.)
make example

# Run all examples
make examples
```

### Available Examples
The `make example` command runs the comprehensive new features example that demonstrates:

- **Account Types**: Creating and managing account type templates
- **Operation Routes**: Setting up routing rules for operations
- **Transaction Routes**: Creating complete transaction routing workflows  
- **Queue Management**: Managing transaction queues for batch processing
- **Metrics**: Using the metrics utilities for analytics

## Documentation

```bash
# Generate API documentation
make docs

# Generate and serve documentation locally
make docs-serve
```

## Package Management

```bash
# Create a distributable package
make package

# Check bundle sizes
make size

# Check for outdated dependencies
make deps-check

# Update dependencies
make deps-update

# Run security audit
make deps-audit
```

## Maintenance

```bash
# Clean build artifacts
make clean

# Check release readiness
make release-check

# Prepare for release
make pre-release
```

## Comparison with Go SDK

The TypeScript SDK Makefile provides similar functionality to the Go SDK:

| Go SDK Command | TypeScript SDK Command | Description |
|----------------|------------------------|-------------|
| `make help` | `make help` | Show help |
| `make test` | `make test` | Run tests |
| `make coverage` | `make coverage` | Generate coverage |
| `make lint` | `make lint` | Run linters |
| `make fmt` | `make format` | Format code |
| `make clean` | `make clean` | Clean artifacts |
| `make example` | `make example` | Run examples |
| `make docs` | `make docs` | Generate docs |

## Environment Configuration

The Makefile supports environment configuration through `.env` files:

```bash
# Create .env from .env.example
make set-env
```

This will help you set up the necessary environment variables for:
- API endpoints
- Authentication tokens
- Debug settings
- Service configurations

## Integration with CI/CD

The Makefile commands are designed to work well in CI/CD environments:

```bash
# Typical CI workflow
make setup          # Install dependencies
make verify         # Run all quality checks
make build          # Build the project
make package        # Create distributable package
```

## Examples in Practice

### Development Workflow
```bash
# 1. Set up the project
make setup
make set-env

# 2. Start development
make dev            # Starts build watcher

# 3. In another terminal, run tests
make test-watch

# 4. Check code quality
make verify

# 5. Run examples to test features
make example
```

### Testing New Features
```bash
# Test the new account types, operation routes, etc.
make example

# This runs examples/new-features-example.ts which demonstrates:
# - Creating account types
# - Setting up operation routes  
# - Creating transaction routes
# - Queue management
# - Metrics calculations
```

The Makefile provides a unified interface that abstracts away the complexity of npm scripts while maintaining the flexibility to use npm commands directly when needed.