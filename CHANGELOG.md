# Changelog

All notable changes to the Midaz SDK for TypeScript will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
=======
## [v2.0.0-beta.3] - 2025-08-13

[Compare changes](https://github.com/LerianStudio/midaz-sdk-typescript/compare/v2.0.0-beta.2...v2.0.0-beta.3)
Contributors: Jefferson Rodrigues, lerian-studio

### 🔄 Changes
- **Configuration Management**: Obsolete methods have been removed, streamlining the setup process and reducing potential confusion. This update improves code maintainability and ensures users have access to the most relevant information.
- **Code Refactoring**: Across multiple components, unused methods have been eliminated, and documentation has been updated. These changes enhance code clarity and efficiency, making it easier for developers to navigate and maintain the system.

### 📚 Documentation
- Documentation has been thoroughly updated to reflect the latest changes, providing users with accurate and up-to-date information. This ensures a better understanding of the system and reduces the likelihood of errors.

### 🔧 Maintenance
- The project changelog has been updated to include recent improvements, providing users and developers with a clear view of the project's evolution and ensuring transparency in updates.


## [v2.0.0-beta.2] - 2025-08-12

[Compare changes](https://github.com/LerianStudio/midaz-sdk-typescript/compare/v2.0.0-beta.1...v2.0.0-beta.2)
Contributors: lerian-studio

### 🔧 Maintenance
- **Updated Dependencies and Build Configurations**: We've refreshed the project's underlying infrastructure by updating dependencies and build configurations. This ensures compatibility with the latest tools and libraries, enhancing the reliability and stability of the development environment. Although these changes do not directly impact user-facing features, they lay the groundwork for smoother future updates and feature additions.



## [1.2.0](https://github.com/LerianStudio/midaz-sdk-typescript/compare/v1.1.0...v1.2.0) (2025-08-12)


### ✨ Features

* create account type, transaction-route, operation-route and testes. ([1dcce6f](https://github.com/LerianStudio/midaz-sdk-typescript/commit/1dcce6fcdcbc1164c3a62a2485d4446095c38410))
* create account type, transaction-route, operation-route and testes. BREAKING CHANGE: removing the scale fields ([2ccc4c8](https://github.com/LerianStudio/midaz-sdk-typescript/commit/2ccc4c8dd3adfc710c3a0e3bab8ef62a293d5732))
* create account type, transaction-route, operation-route and testes. BREAKING CHANGE: removing the scale fields ([bd446a3](https://github.com/LerianStudio/midaz-sdk-typescript/commit/bd446a31fc08d297f5a69b9d51f428586e90a48e))
* **exports:** add AccountType and concurrency utilities to public API ([03549ba](https://github.com/LerianStudio/midaz-sdk-typescript/commit/03549baf6b8c12236b69f8f3c0adf11c62cda594))
* refactor to pure TypeScript SDK implementation ([#47](https://github.com/LerianStudio/midaz-sdk-typescript/issues/47)) ([aeec1f5](https://github.com/LerianStudio/midaz-sdk-typescript/commit/aeec1f5418c8ebd6aedcbaf705282209f725add8))
* **sdk:** transform to pure TypeScript SDK without Node.js dependencies ([d4e54f5](https://github.com/LerianStudio/midaz-sdk-typescript/commit/d4e54f5ec8553b042ec6b6054c794b9096ecd86b))
* transform SDK into production-ready npm package with comprehensive CI/CD ([#43](https://github.com/LerianStudio/midaz-sdk-typescript/issues/43)) ([e2f7910](https://github.com/LerianStudio/midaz-sdk-typescript/commit/e2f7910316d730bfc97de804b6801bb26ffcea05))


### 🐛 Bug Fixes

* **ci:** add missing bot credentials to AI changelog step ([95401c0](https://github.com/LerianStudio/midaz-sdk-typescript/commit/95401c0cb27fa16ceea908acf29a08c4b0289f1e))
* **ci:** add missing test:coverage script and lint:check command ([692f5f4](https://github.com/LerianStudio/midaz-sdk-typescript/commit/692f5f4d299b2091c6d1a17d74a5399d8b1624a4))
* **ci:** make codecov upload non-blocking and only run on push events ([81b63b3](https://github.com/LerianStudio/midaz-sdk-typescript/commit/81b63b3add23db13c64df14d1d18a6b6edae1055))
* **ci:** remove codecov upload and fix workflow formatting ([4e7a8ee](https://github.com/LerianStudio/midaz-sdk-typescript/commit/4e7a8ee066fa3632838a3b1e88dcafa4c1da0095))
* **ci:** restore disabled CI features and resolve pipeline failures ([#45](https://github.com/LerianStudio/midaz-sdk-typescript/issues/45)) ([b2cbd4d](https://github.com/LerianStudio/midaz-sdk-typescript/commit/b2cbd4d7638c49aef422fc55416a4514755e3885)), closes [#41](https://github.com/LerianStudio/midaz-sdk-typescript/issues/41) [#41](https://github.com/LerianStudio/midaz-sdk-typescript/issues/41)
* **ci:** simplify semantic-release commit message to avoid commitlint violations ([ed1f5c8](https://github.com/LerianStudio/midaz-sdk-typescript/commit/ed1f5c89b4192b3159105667103ed75e6a80a4f0))
* **dependabot:** remove YAML aliases to fix parsing error ([7b279df](https://github.com/LerianStudio/midaz-sdk-typescript/commit/7b279df27fc8605fb1b4b1b883175908608e7209))
* **format:** apply prettier formatting to correlation.ts ([822fc2d](https://github.com/LerianStudio/midaz-sdk-typescript/commit/822fc2d8c29298679e5131fdc9e9d5873b71d666))
* **release:** simplify GitHub release URL template to fix syntax error ([bd343e7](https://github.com/LerianStudio/midaz-sdk-typescript/commit/bd343e77b737655030bc0dfbab46c605f604df4e))
* set configuration on gptchangelog ([#37](https://github.com/LerianStudio/midaz-sdk-typescript/issues/37)) ([112c221](https://github.com/LerianStudio/midaz-sdk-typescript/commit/112c2216d32e53ea4b483fa84112beca1e348df3))


### ♻️ Code Refactoring

* apply code review improvements from PR [#48](https://github.com/LerianStudio/midaz-sdk-typescript/issues/48) ([5c090b3](https://github.com/LerianStudio/midaz-sdk-typescript/commit/5c090b3dadfad6aebf88c2c92b398bd662bf4c62))


### 🔨 Maintenance

* **deps-dev:** bump @eslint/js from 9.25.1 to 9.27.0 ([9f85df2](https://github.com/LerianStudio/midaz-sdk-typescript/commit/9f85df24f2d98fcbf0ed1bd3340d024caecb1ae1))
* **deps-dev:** bump @semantic-release/exec from 6.0.3 to 7.1.0 ([#63](https://github.com/LerianStudio/midaz-sdk-typescript/issues/63)) ([c4cdc1e](https://github.com/LerianStudio/midaz-sdk-typescript/commit/c4cdc1ea26e65794afaffac21ca7578ff02ff011)), closes [#58](https://github.com/LerianStudio/midaz-sdk-typescript/issues/58)
* **deps-dev:** bump @semantic-release/github from 10.3.5 to 11.0.3 ([#64](https://github.com/LerianStudio/midaz-sdk-typescript/issues/64)) ([d734e1f](https://github.com/LerianStudio/midaz-sdk-typescript/commit/d734e1f482988bb56266642a8de49b92e64bc1f5)), closes [#58](https://github.com/LerianStudio/midaz-sdk-typescript/issues/58)
* **deps-dev:** bump @typescript-eslint/eslint-plugin ([8ee62b3](https://github.com/LerianStudio/midaz-sdk-typescript/commit/8ee62b313869b3d3c2f2978f281487212c209851))
* **deps-dev:** bump @typescript-eslint/parser from 8.31.1 to 8.32.1 ([2026a79](https://github.com/LerianStudio/midaz-sdk-typescript/commit/2026a797d26e8e2d35effeb25731769d4a005ef8))
* **deps-dev:** bump eslint-import-resolver-typescript from 4.4.0 to 4.4.1 in the linting-tools group ([#59](https://github.com/LerianStudio/midaz-sdk-typescript/issues/59)) ([d627b0b](https://github.com/LerianStudio/midaz-sdk-typescript/commit/d627b0bd5f096025343d420f43540250b4c1ce9a)), closes [#58](https://github.com/LerianStudio/midaz-sdk-typescript/issues/58)
* **deps-dev:** bump lint-staged from 15.5.2 to 16.0.0 ([#62](https://github.com/LerianStudio/midaz-sdk-typescript/issues/62)) ([45fea41](https://github.com/LerianStudio/midaz-sdk-typescript/commit/45fea412f6722cbdebfd4ca2938f1d9213fc55de)), closes [#58](https://github.com/LerianStudio/midaz-sdk-typescript/issues/58)
* **deps-dev:** bump semantic-release from 23.1.1 to 24.2.5 ([#61](https://github.com/LerianStudio/midaz-sdk-typescript/issues/61)) ([460d4e8](https://github.com/LerianStudio/midaz-sdk-typescript/commit/460d4e895ee47e03c4220790779f26f061fe704a)), closes [#58](https://github.com/LerianStudio/midaz-sdk-typescript/issues/58)
* **deps-dev:** bump the dev-dependencies group across 1 directory with 4 updates ([07db78e](https://github.com/LerianStudio/midaz-sdk-typescript/commit/07db78e7661bdca779d66b51d8549c7f62bff5f4))
* **deps-dev:** bump typedoc from 0.28.4 to 0.28.5 in the build-tools group ([#60](https://github.com/LerianStudio/midaz-sdk-typescript/issues/60)) ([7315358](https://github.com/LerianStudio/midaz-sdk-typescript/commit/7315358c3abc0c9cf346beb7c45bed23aac67e25)), closes [#58](https://github.com/LerianStudio/midaz-sdk-typescript/issues/58)
* **deps:** bump actions/create-github-app-token from 1 to 2 ([#51](https://github.com/LerianStudio/midaz-sdk-typescript/issues/51)) ([1c92e16](https://github.com/LerianStudio/midaz-sdk-typescript/commit/1c92e16b111f5963f8a621b46e03958e11436f65))
* **deps:** bump actions/setup-node from 3 to 4 ([#49](https://github.com/LerianStudio/midaz-sdk-typescript/issues/49)) ([f8f89ce](https://github.com/LerianStudio/midaz-sdk-typescript/commit/f8f89ce07bb5e3a213daac56b28784edfb163e53))
* **release:** 1.1.0-develop.1 [skip ci] ([8c7b23b](https://github.com/LerianStudio/midaz-sdk-typescript/commit/8c7b23b6ecbca08c58d0dc3d3e933a05ba255d07))
* **release:** 1.1.0-develop.10 [skip ci] ([2c44e1e](https://github.com/LerianStudio/midaz-sdk-typescript/commit/2c44e1ed4cb2b1157b7a97581b708e062e644207))
* **release:** 1.1.0-develop.11 [skip ci] ([804e5e5](https://github.com/LerianStudio/midaz-sdk-typescript/commit/804e5e5411bd9f1ebc7efc1de1ededd5976dae13))
* **release:** 1.1.0-develop.2 [skip ci] ([90544e0](https://github.com/LerianStudio/midaz-sdk-typescript/commit/90544e03a62d5e8754a7371f96624b19408908a4))
* **release:** 1.1.0-develop.3 [skip ci] ([23dae00](https://github.com/LerianStudio/midaz-sdk-typescript/commit/23dae00b43c4d7ca11c6d7af05322209802b56e0))
* **release:** 1.1.0-develop.4 [skip ci] ([c39eb61](https://github.com/LerianStudio/midaz-sdk-typescript/commit/c39eb61e8e3f6f68545e9e4de674cd37f63ef9a3))
* **release:** 1.1.0-develop.5 [skip ci] ([09f1654](https://github.com/LerianStudio/midaz-sdk-typescript/commit/09f1654fa881812ad56c53ecce75d2df0b6736d0))
* **release:** 1.1.0-develop.6 [skip ci] ([20b91bf](https://github.com/LerianStudio/midaz-sdk-typescript/commit/20b91bf10c5ae0edc0b94f605bdab80c42c7e28c))
* **release:** 1.1.0-develop.7 [skip ci] ([1aa05af](https://github.com/LerianStudio/midaz-sdk-typescript/commit/1aa05af809aefeff7281aaad9d5906b9f208e030))
* **release:** 1.1.0-develop.8 [skip ci] ([7dd5575](https://github.com/LerianStudio/midaz-sdk-typescript/commit/7dd5575b510f6dcc6c02177caddd3de60a50cb41))
* **release:** 1.1.0-develop.9 [skip ci] ([854ead9](https://github.com/LerianStudio/midaz-sdk-typescript/commit/854ead9c1cdb53a5d0b745ef1ec9dbaa7bde2dd1))
* **release:** 1.2.0-develop.1 [skip ci] ([832c9c0](https://github.com/LerianStudio/midaz-sdk-typescript/commit/832c9c0fb991f6446e518c2bc7806e0e423738f7))
* **release:** 1.2.0-develop.2 [skip ci] ([6f0bfda](https://github.com/LerianStudio/midaz-sdk-typescript/commit/6f0bfda071686277a0f7287755476ffa0e39d154))
* **release:** Update CHANGELOG ([fc561dc](https://github.com/LerianStudio/midaz-sdk-typescript/commit/fc561dc9666a4f75c516038eeeaa8c002fff8d2b))
* **release:** Update CHANGELOG ([57fdb49](https://github.com/LerianStudio/midaz-sdk-typescript/commit/57fdb494babd5e1d444f191a84dcaf0ac5caf858))
* **release:** Update CHANGELOG ([#38](https://github.com/LerianStudio/midaz-sdk-typescript/issues/38)) ([51a5619](https://github.com/LerianStudio/midaz-sdk-typescript/commit/51a561995b25bab9bc2a6571c44d253fd38c94cb))
* **sdk:** bump version to 2.0.0-develop.1 for pure TypeScript SDK ([840c68c](https://github.com/LerianStudio/midaz-sdk-typescript/commit/840c68c473d37332a0a716e60e794999175080df))
* upgrading the version ([c99c132](https://github.com/LerianStudio/midaz-sdk-typescript/commit/c99c1324bcb96727ff89ad67621915abacc8fc70))

## [1.2.0-develop.2](https://github.com/LerianStudio/midaz-sdk-typescript/compare/v1.2.0-develop.1...v1.2.0-develop.2) (2025-08-12)

## [v2.0.0-beta.1] - 2025-08-12

[Compare changes](https://github.com/LerianStudio/midaz-sdk-typescript/compare/v1.2.0-develop.2...v2.0.0-beta.1)
Contributors: LF Barrile

### ⚠️ Breaking Changes
- **Pure TypeScript SDK**: The SDK has been fully transitioned to TypeScript. This change enhances type safety and maintainability but requires updates to your projects to accommodate TypeScript syntax. Users will need to refactor their codebases to align with TypeScript standards. [Migration Guide](#)

### ✨ Features
- **Controlled Release Configuration**: Releases are now restricted to the 'develop' and 'main' branches, ensuring a more predictable and secure deployment process. This change minimizes the risk of accidental releases from feature branches, providing greater control over your development workflow.

### 🔧 Maintenance
- **Build and Dependencies Update**: The build processes and dependencies have been updated to support the new TypeScript-based SDK. This ensures compatibility with modern TypeScript tooling, improving the stability and efficiency of the development environment.


sdk-typescript/commit/1dcce6fcdcbc1164c3a62a2485d4446095c38410))
* create account type, transaction-route, operation-route and testes. BREAKING CHANGE: removing the scale fields ([2ccc4c8](https://github.com/LerianStudio/midaz-sdk-typescript/commit/2ccc4c8dd3adfc710c3a0e3bab8ef62a293d5732))
* create account type, transaction-route, operation-route and testes. BREAKING CHANGE: removing the scale fields ([bd446a3](https://github.com/LerianStudio/midaz-sdk-typescript/commit/bd446a31fc08d297f5a69b9d51f428586e90a48e))


### 🔨 Maintenance

* upgrading the version ([c99c132](https://github.com/LerianStudio/midaz-sdk-typescript/commit/c99c1324bcb96727ff89ad67621915abacc8fc70))

## [1.2.0-develop.1](https://github.com/LerianStudio/midaz-sdk-typescript/compare/v1.1.0...v1.2.0-develop.1) (2025-06-09)


### ✨ Features

* **exports:** add AccountType and concurrency utilities to public API ([03549ba](https://github.com/LerianStudio/midaz-sdk-typescript/commit/03549baf6b8c12236b69f8f3c0adf11c62cda594))
* refactor to pure TypeScript SDK implementation ([#47](https://github.com/LerianStudio/midaz-sdk-typescript/issues/47)) ([aeec1f5](https://github.com/LerianStudio/midaz-sdk-typescript/commit/aeec1f5418c8ebd6aedcbaf705282209f725add8))
* **sdk:** transform to pure TypeScript SDK without Node.js dependencies ([d4e54f5](https://github.com/LerianStudio/midaz-sdk-typescript/commit/d4e54f5ec8553b042ec6b6054c794b9096ecd86b))
* transform SDK into production-ready npm package with comprehensive CI/CD ([#43](https://github.com/LerianStudio/midaz-sdk-typescript/issues/43)) ([e2f7910](https://github.com/LerianStudio/midaz-sdk-typescript/commit/e2f7910316d730bfc97de804b6801bb26ffcea05))


### 🐛 Bug Fixes

* **ci:** add missing bot credentials to AI changelog step ([95401c0](https://github.com/LerianStudio/midaz-sdk-typescript/commit/95401c0cb27fa16ceea908acf29a08c4b0289f1e))
* **ci:** add missing test:coverage script and lint:check command ([692f5f4](https://github.com/LerianStudio/midaz-sdk-typescript/commit/692f5f4d299b2091c6d1a17d74a5399d8b1624a4))
* **ci:** make codecov upload non-blocking and only run on push events ([81b63b3](https://github.com/LerianStudio/midaz-sdk-typescript/commit/81b63b3add23db13c64df14d1d18a6b6edae1055))
* **ci:** remove codecov upload and fix workflow formatting ([4e7a8ee](https://github.com/LerianStudio/midaz-sdk-typescript/commit/4e7a8ee066fa3632838a3b1e88dcafa4c1da0095))
* **ci:** restore disabled CI features and resolve pipeline failures ([#45](https://github.com/LerianStudio/midaz-sdk-typescript/issues/45)) ([b2cbd4d](https://github.com/LerianStudio/midaz-sdk-typescript/commit/b2cbd4d7638c49aef422fc55416a4514755e3885)), closes [#41](https://github.com/LerianStudio/midaz-sdk-typescript/issues/41) [#41](https://github.com/LerianStudio/midaz-sdk-typescript/issues/41)
* **ci:** simplify semantic-release commit message to avoid commitlint violations ([ed1f5c8](https://github.com/LerianStudio/midaz-sdk-typescript/commit/ed1f5c89b4192b3159105667103ed75e6a80a4f0))
* **dependabot:** remove YAML aliases to fix parsing error ([7b279df](https://github.com/LerianStudio/midaz-sdk-typescript/commit/7b279df27fc8605fb1b4b1b883175908608e7209))
* **format:** apply prettier formatting to correlation.ts ([822fc2d](https://github.com/LerianStudio/midaz-sdk-typescript/commit/822fc2d8c29298679e5131fdc9e9d5873b71d666))
* **release:** simplify GitHub release URL template to fix syntax error ([bd343e7](https://github.com/LerianStudio/midaz-sdk-typescript/commit/bd343e77b737655030bc0dfbab46c605f604df4e))
* set configuration on gptchangelog ([#37](https://github.com/LerianStudio/midaz-sdk-typescript/issues/37)) ([112c221](https://github.com/LerianStudio/midaz-sdk-typescript/commit/112c2216d32e53ea4b483fa84112beca1e348df3))


### ♻️ Code Refactoring

* apply code review improvements from PR [#48](https://github.com/LerianStudio/midaz-sdk-typescript/issues/48) ([5c090b3](https://github.com/LerianStudio/midaz-sdk-typescript/commit/5c090b3dadfad6aebf88c2c92b398bd662bf4c62))


### 🔨 Maintenance

* **deps-dev:** bump @eslint/js from 9.25.1 to 9.27.0 ([9f85df2](https://github.com/LerianStudio/midaz-sdk-typescript/commit/9f85df24f2d98fcbf0ed1bd3340d024caecb1ae1))
* **deps-dev:** bump @semantic-release/exec from 6.0.3 to 7.1.0 ([#63](https://github.com/LerianStudio/midaz-sdk-typescript/issues/63)) ([c4cdc1e](https://github.com/LerianStudio/midaz-sdk-typescript/commit/c4cdc1ea26e65794afaffac21ca7578ff02ff011)), closes [#58](https://github.com/LerianStudio/midaz-sdk-typescript/issues/58)
* **deps-dev:** bump @semantic-release/github from 10.3.5 to 11.0.3 ([#64](https://github.com/LerianStudio/midaz-sdk-typescript/issues/64)) ([d734e1f](https://github.com/LerianStudio/midaz-sdk-typescript/commit/d734e1f482988bb56266642a8de49b92e64bc1f5)), closes [#58](https://github.com/LerianStudio/midaz-sdk-typescript/issues/58)
* **deps-dev:** bump @typescript-eslint/eslint-plugin ([8ee62b3](https://github.com/LerianStudio/midaz-sdk-typescript/commit/8ee62b313869b3d3c2f2978f281487212c209851))
* **deps-dev:** bump @typescript-eslint/parser from 8.31.1 to 8.32.1 ([2026a79](https://github.com/LerianStudio/midaz-sdk-typescript/commit/2026a797d26e8e2d35effeb25731769d4a005ef8))
* **deps-dev:** bump eslint-import-resolver-typescript from 4.4.0 to 4.4.1 in the linting-tools group ([#59](https://github.com/LerianStudio/midaz-sdk-typescript/issues/59)) ([d627b0b](https://github.com/LerianStudio/midaz-sdk-typescript/commit/d627b0bd5f096025343d420f43540250b4c1ce9a)), closes [#58](https://github.com/LerianStudio/midaz-sdk-typescript/issues/58)
* **deps-dev:** bump lint-staged from 15.5.2 to 16.0.0 ([#62](https://github.com/LerianStudio/midaz-sdk-typescript/issues/62)) ([45fea41](https://github.com/LerianStudio/midaz-sdk-typescript/commit/45fea412f6722cbdebfd4ca2938f1d9213fc55de)), closes [#58](https://github.com/LerianStudio/midaz-sdk-typescript/issues/58)
* **deps-dev:** bump semantic-release from 23.1.1 to 24.2.5 ([#61](https://github.com/LerianStudio/midaz-sdk-typescript/issues/61)) ([460d4e8](https://github.com/LerianStudio/midaz-sdk-typescript/commit/460d4e895ee47e03c4220790779f26f061fe704a)), closes [#58](https://github.com/LerianStudio/midaz-sdk-typescript/issues/58)
* **deps-dev:** bump the dev-dependencies group across 1 directory with 4 updates ([07db78e](https://github.com/LerianStudio/midaz-sdk-typescript/commit/07db78e7661bdca779d66b51d8549c7f62bff5f4))
* **deps-dev:** bump typedoc from 0.28.4 to 0.28.5 in the build-tools group ([#60](https://github.com/LerianStudio/midaz-sdk-typescript/issues/60)) ([7315358](https://github.com/LerianStudio/midaz-sdk-typescript/commit/7315358c3abc0c9cf346beb7c45bed23aac67e25)), closes [#58](https://github.com/LerianStudio/midaz-sdk-typescript/issues/58)
* **deps:** bump actions/create-github-app-token from 1 to 2 ([#51](https://github.com/LerianStudio/midaz-sdk-typescript/issues/51)) ([1c92e16](https://github.com/LerianStudio/midaz-sdk-typescript/commit/1c92e16b111f5963f8a621b46e03958e11436f65))
* **deps:** bump actions/setup-node from 3 to 4 ([#49](https://github.com/LerianStudio/midaz-sdk-typescript/issues/49)) ([f8f89ce](https://github.com/LerianStudio/midaz-sdk-typescript/commit/f8f89ce07bb5e3a213daac56b28784edfb163e53))
* **release:** 1.1.0-develop.1 [skip ci] ([8c7b23b](https://github.com/LerianStudio/midaz-sdk-typescript/commit/8c7b23b6ecbca08c58d0dc3d3e933a05ba255d07))
* **release:** 1.1.0-develop.10 [skip ci] ([2c44e1e](https://github.com/LerianStudio/midaz-sdk-typescript/commit/2c44e1ed4cb2b1157b7a97581b708e062e644207))
* **release:** 1.1.0-develop.11 [skip ci] ([804e5e5](https://github.com/LerianStudio/midaz-sdk-typescript/commit/804e5e5411bd9f1ebc7efc1de1ededd5976dae13))
* **release:** 1.1.0-develop.2 [skip ci] ([90544e0](https://github.com/LerianStudio/midaz-sdk-typescript/commit/90544e03a62d5e8754a7371f96624b19408908a4))
* **release:** 1.1.0-develop.3 [skip ci] ([23dae00](https://github.com/LerianStudio/midaz-sdk-typescript/commit/23dae00b43c4d7ca11c6d7af05322209802b56e0))
* **release:** 1.1.0-develop.4 [skip ci] ([c39eb61](https://github.com/LerianStudio/midaz-sdk-typescript/commit/c39eb61e8e3f6f68545e9e4de674cd37f63ef9a3))
* **release:** 1.1.0-develop.5 [skip ci] ([09f1654](https://github.com/LerianStudio/midaz-sdk-typescript/commit/09f1654fa881812ad56c53ecce75d2df0b6736d0))
* **release:** 1.1.0-develop.6 [skip ci] ([20b91bf](https://github.com/LerianStudio/midaz-sdk-typescript/commit/20b91bf10c5ae0edc0b94f605bdab80c42c7e28c))
* **release:** 1.1.0-develop.7 [skip ci] ([1aa05af](https://github.com/LerianStudio/midaz-sdk-typescript/commit/1aa05af809aefeff7281aaad9d5906b9f208e030))
* **release:** 1.1.0-develop.8 [skip ci] ([7dd5575](https://github.com/LerianStudio/midaz-sdk-typescript/commit/7dd5575b510f6dcc6c02177caddd3de60a50cb41))
* **release:** 1.1.0-develop.9 [skip ci] ([854ead9](https://github.com/LerianStudio/midaz-sdk-typescript/commit/854ead9c1cdb53a5d0b745ef1ec9dbaa7bde2dd1))
* **release:** Update CHANGELOG ([fc561dc](https://github.com/LerianStudio/midaz-sdk-typescript/commit/fc561dc9666a4f75c516038eeeaa8c002fff8d2b))
* **release:** Update CHANGELOG ([57fdb49](https://github.com/LerianStudio/midaz-sdk-typescript/commit/57fdb494babd5e1d444f191a84dcaf0ac5caf858))
* **release:** Update CHANGELOG ([#38](https://github.com/LerianStudio/midaz-sdk-typescript/issues/38)) ([51a5619](https://github.com/LerianStudio/midaz-sdk-typescript/commit/51a561995b25bab9bc2a6571c44d253fd38c94cb))
* **sdk:** bump version to 2.0.0-develop.1 for pure TypeScript SDK ([840c68c](https://github.com/LerianStudio/midaz-sdk-typescript/commit/840c68c473d37332a0a716e60e794999175080df))

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
