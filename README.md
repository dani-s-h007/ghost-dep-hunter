# ghost-dep-hunter

[![CI](https://github.com/dani-s-h007/ghost-dep-hunter/actions/workflows/ci.yml/badge.svg)](https://github.com/dani-s-h007/ghost-dep-hunter/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green.svg)](https://nodejs.org/)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-success.svg)](package.json)

> **Zombie unused dependency & undeclared phantom import auditor for modern JavaScript/TypeScript projects.**

Two common package management hazards silently degrade software projects:
1. **Phantom Imports**: Code imports a package (e.g. `import chalk from 'chalk'`) that was never added to `package.json`. Because npm/pnpm/yarn hoisted it from another dependency, it works on a developer's machine, but immediately crashes in a clean Docker or CI deployment.
2. **Zombie Dependencies**: Packages added years ago that are never imported anywhere in the repository, inflating `node_modules` and increasing vulnerability attack surfaces.

`ghost-dep-hunter` scans all source files for ESM and CommonJS imports and cross-checks them against `package.json` to flag phantoms and zombies.

---

## Features

- **Catches Undeclared Phantom Imports**: Prevents broken production builds caused by accidental transitive hoisting.
- **Identifies Zombie Unused Dependencies**: Safely highlights packages that can be uninstalled to shrink `node_modules`.
- **Scoped & Subpath Aware**: Resolves `@scope/package/subpath` and `lodash/get` to their root package definitions.
- **Node Builtin & Path Filtering**: Automatically ignores `node:*` primitives and relative paths.
- **Zero Runtime Dependencies**: Ultra-fast execution with zero third-party dependencies.

---

## Installation & Demo

```bash
# Run on-demand with npx
npx ghost-dep-hunter --help

# Run the live demo:
npm run demo
```

---

## CLI Usage

```bash
# Audit dependencies in current directory:
ghost-dep-hunter

# Fail CI build if undeclared phantom imports exist:
ghost-dep-hunter --strict

# Output structured JSON:
ghost-dep-hunter --json
```

---

## Programmatic TypeScript API

```typescript
import { auditDependencies } from 'ghost-dep-hunter';

const report = await auditDependencies('./my-app');
if (report.hasIssues) {
  console.log(`Found ${report.phantomImports.length} phantom imports.`);
  console.log(`Found ${report.zombieDependencies.length} zombie dependencies.`);
}
```

---

## Testing

```bash
npm test
```

---

## License

MIT © Essentials Toolkit Authors

