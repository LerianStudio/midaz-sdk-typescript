## [1.1.0-develop.11](https://github.com/LerianStudio/midaz-sdk-typescript/compare/v1.1.0-develop.10...v1.1.0-develop.11) (2025-05-26)

### 🐛 Bug Fixes

- **dependabot:** remove YAML aliases to fix parsing error ([7b279df](https://github.com/LerianStudio/midaz-sdk-typescript/commit/7b279df27fc8605fb1b4b1b883175908608e7209))
-

## [1.1.0-develop.10](https://github.com/LerianStudio/midaz-sdk-typescript/compare/v1.1.0-develop.9...v1.1.0-develop.10) (2025-05-26)

### 🐛 Bug Fixes

- **ci:** add missing bot credentials to AI changelog step ([95401c0](https://github.com/LerianStudio/midaz-sdk-typescript/commit/95401c0cb27fa16ceea908acf29a08c4b0289f1e))

## [1.1.0-develop.9](https://github.com/LerianStudio/midaz-sdk-typescript/compare/v1.1.0-develop.8...v1.1.0-develop.9) (2025-05-26)

### 🐛 Bug Fixes

- **ci:** remove codecov upload and fix workflow formatting ([4e7a8ee](https://github.com/LerianStudio/midaz-sdk-typescript/commit/4e7a8ee066fa3632838a3b1e88dcafa4c1da0095))

## [1.1.0-develop.8](https://github.com/LerianStudio/midaz-sdk-typescript/compare/v1.1.0-develop.7...v1.1.0-develop.8) (2025-05-26)

### ✨ Features

- **exports:** add AccountType and concurrency utilities to public API ([03549ba](https://github.com/LerianStudio/midaz-sdk-typescript/commit/03549baf6b8c12236b69f8f3c0adf11c62cda594))

## [1.1.0-develop.7](https://github.com/LerianStudio/midaz-sdk-typescript/compare/v1.1.0-develop.6...v1.1.0-develop.7) (2025-05-26)

### 🐛 Bug Fixes

- **release:** simplify GitHub release URL template to fix syntax error ([bd343e7](https://github.com/LerianStudio/midaz-sdk-typescript/commit/bd343e77b737655030bc0dfbab46c605f604df4e))

## [1.1.0-develop.6](https://github.com/LerianStudio/midaz-sdk-typescript/compare/v1.1.0-develop.5...v1.1.0-develop.6) (2025-05-26)

### 🐛 Bug Fixes

- **ci:** make codecov upload non-blocking and only run on push events ([81b63b3](https://github.com/LerianStudio/midaz-sdk-typescript/commit/81b63b3add23db13c64df14d1d18a6b6edae1055))

## [1.1.0-develop.5](https://github.com/LerianStudio/midaz-sdk-typescript/compare/v1.1.0-develop.4...v1.1.0-develop.5) (2025-05-26)

### 🐛 Bug Fixes

- **ci:** add missing test:coverage script and lint:check command ([692f5f4](https://github.com/LerianStudio/midaz-sdk-typescript/commit/692f5f4d299b2091c6d1a17d74a5399d8b1624a4))

## [1.1.0-develop.4](https://github.com/LerianStudio/midaz-sdk-typescript/compare/v1.1.0-develop.3...v1.1.0-develop.4) (2025-05-26)

### 🐛 Bug Fixes

- **format:** apply prettier formatting to correlation.ts ([822fc2d](https://github.com/LerianStudio/midaz-sdk-typescript/commit/822fc2d8c29298679e5131fdc9e9d5873b71d666))

## [1.1.0-develop.3](https://github.com/LerianStudio/midaz-sdk-typescript/compare/v1.1.0-develop.2...v1.1.0-develop.3) (2025-05-26)

### ♻️ Code Refactoring

- apply code review improvements from PR [#48](https://github.com/LerianStudio/midaz-sdk-typescript/issues/48) ([5c090b3](https://github.com/LerianStudio/midaz-sdk-typescript/commit/5c090b3dadfad6aebf88c2c92b398bd662bf4c62))

## [1.1.0-develop.2](https://github.com/LerianStudio/midaz-sdk-typescript/compare/v1.1.0-develop.1...v1.1.0-develop.2) (2025-05-25)

### ✨ Features

- refactor to pure TypeScript SDK implementation ([#47](https://github.com/LerianStudio/midaz-sdk-typescript/issues/47)) ([aeec1f5](https://github.com/LerianStudio/midaz-sdk-typescript/commit/aeec1f5418c8ebd6aedcbaf705282209f725add8))
- **sdk:** transform to pure TypeScript SDK without Node.js dependencies ([d4e54f5](https://github.com/LerianStudio/midaz-sdk-typescript/commit/d4e54f5ec8553b042ec6b6054c794b9096ecd86b))

### 🔨 Maintenance

- **deps-dev:** bump typedoc from 0.28.3 to 0.28.4 ([94db8eb](https://github.com/LerianStudio/midaz-sdk-typescript/commit/94db8ebd6648bbbf599c9dc5e01ca9e9ffca302c))
- **sdk:** bump version to 2.0.0-develop.1 for pure TypeScript SDK ([840c68c](https://github.com/LerianStudio/midaz-sdk-typescript/commit/840c68c473d37332a0a716e60e794999175080df))

## [1.1.0-develop.1](https://github.com/LerianStudio/midaz-sdk-typescript/compare/v1.0.0...v1.1.0-develop.1) (2025-05-25)

### ✨ Features

- transform SDK into production-ready npm package with comprehensive CI/CD ([#43](https://github.com/LerianStudio/midaz-sdk-typescript/issues/43)) ([e2f7910](https://github.com/LerianStudio/midaz-sdk-typescript/commit/e2f7910316d730bfc97de804b6801bb26ffcea05))

### 🐛 Bug Fixes

- **ci:** restore disabled CI features and resolve pipeline failures ([#45](https://github.com/LerianStudio/midaz-sdk-typescript/issues/45)) ([b2cbd4d](https://github.com/LerianStudio/midaz-sdk-typescript/commit/b2cbd4d7638c49aef422fc55416a4514755e3885)), closes [#41](https://github.com/LerianStudio/midaz-sdk-typescript/issues/41) [#41](https://github.com/LerianStudio/midaz-sdk-typescript/issues/41)
- **ci:** simplify semantic-release commit message to avoid commitlint violations ([ed1f5c8](https://github.com/LerianStudio/midaz-sdk-typescript/commit/ed1f5c89b4192b3159105667103ed75e6a80a4f0))
- set configuration on gptchangelog ([#37](https://github.com/LerianStudio/midaz-sdk-typescript/issues/37)) ([112c221](https://github.com/LerianStudio/midaz-sdk-typescript/commit/112c2216d32e53ea4b483fa84112beca1e348df3))

### 🔨 Maintenance

- **deps-dev:** bump @eslint/js from 9.25.1 to 9.27.0 ([9f85df2](https://github.com/LerianStudio/midaz-sdk-typescript/commit/9f85df24f2d98fcbf0ed1bd3340d024caecb1ae1))
- **deps-dev:** bump @typescript-eslint/eslint-plugin ([8ee62b3](https://github.com/LerianStudio/midaz-sdk-typescript/commit/8ee62b313869b3d3c2f2978f281487212c209851))
- **deps-dev:** bump @typescript-eslint/parser from 8.31.1 to 8.32.1 ([2026a79](https://github.com/LerianStudio/midaz-sdk-typescript/commit/2026a797d26e8e2d35effeb25731769d4a005ef8))
- **deps-dev:** bump the dev-dependencies group across 1 directory with 4 updates ([07db78e](https://github.com/LerianStudio/midaz-sdk-typescript/commit/07db78e7661bdca779d66b51d8549c7f62bff5f4))
- **release:** Update CHANGELOG ([fc561dc](https://github.com/LerianStudio/midaz-sdk-typescript/commit/fc561dc9666a4f75c516038eeeaa8c002fff8d2b))
- **release:** Update CHANGELOG ([57fdb49](https://github.com/LerianStudio/midaz-sdk-typescript/commit/57fdb494babd5e1d444f191a84dcaf0ac5caf858))
- **release:** Update CHANGELOG ([#38](https://github.com/LerianStudio/midaz-sdk-typescript/issues/38)) ([51a5619](https://github.com/LerianStudio/midaz-sdk-typescript/commit/51a561995b25bab9bc2a6571c44d253fd38c94cb))

# Changelog

All notable changes to the Midaz SDK for TypeScript will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v1.1.0-beta.2] - 2025-05-21

### 🔧 Maintenance

- Update CHANGELOG for recent changes to reflect the latest updates in the project.
- Bump `@typescript-eslint/eslint-plugin` to the latest version to ensure compatibility and leverage improvements.

## [v1.1.0-beta.1] - 2025-05-21

### 🔧 Maintenance

- Update CHANGELOG for recent changes
- Bump development dependencies across one directory

## [v1.0.0-beta.5] - 2025-05-21

### 🐛 Bug Fixes

- Configure GPT changelog settings to address configuration issues (#37)

## [Unreleased]

### Added

- GitHub Actions CI/CD pipeline
- Automated testing across multiple Node.js versions
- Dependabot configuration for automated dependency updates
- Pull request and issue templates
- Automated changelog generation

### Changed

- Updated README with CI/CD pipeline information
- Improved developer documentation

## [0.1.0] - 2025-04-28

### Added

- Initial SDK implementation with support for all Midaz API entities
- Comprehensive transaction builders and helpers
- Environment-specific configuration
- Observability with tracing, metrics, and logging
- Error handling with retry logic
- Pagination utilities for handling large datasets
- Full TypeScript type definitions
- Extensive test coverage
- Documentation with JSDoc and TypeDoc
- Example workflows for common use cases
