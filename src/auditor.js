/**
 * ghost-dep-hunter: Core Dependency Auditor
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, extname } from 'node:path';
import { extractImportsFromCode } from './import-crawler.js';

const SUPPORTED_EXTS = new Set(['.js', '.mjs', '.cjs', '.ts', '.tsx', '.jsx']);
const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', '.next']);

export async function auditDependencies(rootDir = process.cwd(), packageJsonObj = null) {
  let pkg = packageJsonObj;
  if (!pkg) {
    try {
      const content = await readFile(join(rootDir, 'package.json'), 'utf8');
      pkg = JSON.parse(content);
    } catch (err) {
      throw new Error(`Failed to read package.json in ${rootDir}: ${err.message}`);
    }
  }

  const declaredDeps = new Set(Object.keys(pkg.dependencies || {}));
  const declaredDevDeps = new Set(Object.keys(pkg.devDependencies || {}));
  const declaredPeerDeps = new Set(Object.keys(pkg.peerDependencies || {}));
  const allDeclared = new Set([...declaredDeps, ...declaredDevDeps, ...declaredPeerDeps]);

  // Crawl source files
  const importedPackages = new Map();

  async function walk(dir) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const e of entries) {
      if (IGNORED_DIRS.has(e.name)) continue;
      const full = join(dir, e.name);
      if (e.isDirectory()) {
        await walk(full);
      } else if (e.isFile() && SUPPORTED_EXTS.has(extname(e.name))) {
        try {
          const content = await readFile(full, 'utf8');
          const rel = relative(rootDir, full);
          const found = extractImportsFromCode(content, rel);
          for (const [p, occurrences] of found.entries()) {
            if (!importedPackages.has(p)) importedPackages.set(p, []);
            importedPackages.get(p).push(...occurrences);
          }
        } catch {
          // Ignore unreadable
        }
      }
    }
  }

  await walk(rootDir);

  // 1. Phantom Imports: imported in code, but NOT in package.json
  const phantomImports = [];
  for (const [pkgName, occurrences] of importedPackages.entries()) {
    if (!allDeclared.has(pkgName)) {
      phantomImports.push({ package: pkgName, occurrences });
    }
  }

  // 2. Zombie Dependencies: declared in dependencies, but NEVER imported in source
  const zombieDependencies = [];
  for (const pkgName of declaredDeps) {
    if (!importedPackages.has(pkgName)) {
      zombieDependencies.push(pkgName);
    }
  }

  const hasIssues = phantomImports.length > 0 || zombieDependencies.length > 0;

  return {
    hasIssues,
    totalImportsFound: importedPackages.size,
    totalDeclaredDeps: declaredDeps.size,
    phantomImports,
    zombieDependencies
  };
}

