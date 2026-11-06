/**
 * ghost-dep-hunter: Import Crawler & Package Name Resolver
 */

import { builtinModules } from 'node:module';

const NODE_BUILTINS = new Set([
  ...builtinModules,
  ...builtinModules.map((m) => `node:${m}`)
]);

// Regex to capture:
// 1. import ... from 'pkg' or import 'pkg'
// 2. export ... from 'pkg'
// 3. require('pkg')
// 4. import('pkg')
const IMPORT_PATTERNS = [
  /\bimport\s+(?:[\w*\s{},]+from\s+)?['"](?<specifier>[^'"]+)['"]/g,
  /\bexport\s+(?:[\w*\s{},]+from\s+)?['"](?<specifier>[^'"]+)['"]/g,
  /\brequire\s*\(\s*['"](?<specifier>[^'"]+)['"]\s*\)/g,
  /\bimport\s*\(\s*['"](?<specifier>[^'"]+)['"]\s*\)/g
];

/**
 * Extracts package name from an import specifier.
 * e.g. "lodash/get" -> "lodash", "@babel/core/lib" -> "@babel/core"
 * Ignores relative/absolute paths and built-ins.
 */
export function extractPackageName(specifier) {
  if (!specifier) return null;
  const trimmed = specifier.trim();

  // Relative or absolute paths
  if (trimmed.startsWith('.') || trimmed.startsWith('/') || trimmed.startsWith('#')) {
    return null;
  }

  // Node built-in
  if (NODE_BUILTINS.has(trimmed) || trimmed.startsWith('node:')) {
    return null;
  }

  // Scoped package: @scope/pkg/subpath -> @scope/pkg
  if (trimmed.startsWith('@')) {
    const parts = trimmed.split('/');
    if (parts.length >= 2) {
      return `${parts[0]}/${parts[1]}`;
    }
    return trimmed;
  }

  // Standard package: pkg/subpath -> pkg
  return trimmed.split('/')[0];
}

export function extractImportsFromCode(content, filePath = 'file.js') {
  const findings = new Map();
  const lines = content.split('\n');

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    for (const pattern of IMPORT_PATTERNS) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(line)) !== null) {
        const specifier = match.groups?.specifier;
        const pkg = extractPackageName(specifier);
        if (pkg) {
          if (!findings.has(pkg)) findings.set(pkg, []);
          findings.get(pkg).push({ file: filePath, line: lineNum + 1 });
        }
      }
    }
  }

  return findings;
}

