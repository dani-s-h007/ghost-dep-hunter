#!/usr/bin/env node
/**
 * ghost-dep-hunter: Interactive Live Demo
 */

import { extractImportsFromCode } from '../src/import-crawler.js';

console.log('\n=== [DEMO] Starting ghost-dep-hunter ===\n');

const mockSourceCode = `
import express from 'express';
import { get } from 'lodash/get';
import chalk from 'chalk';
import { readFileSync } from 'node:fs';
import { helper } from './local-util.js';
const axios = require('axios');
`;

const mockPackageJson = {
  name: 'my-service',
  dependencies: {
    express: '^4.18.2',
    lodash: '^4.17.21',
    // Zombie: never imported anywhere!
    'moment-timezone': '^0.5.40'
  }
};

console.log('Scanning Source Code Imports:');
console.log('------------------------------------------------------------');
console.log(mockSourceCode.trim());
console.log('------------------------------------------------------------\n');

const extracted = extractImportsFromCode(mockSourceCode, 'server.js');
const declared = new Set(Object.keys(mockPackageJson.dependencies));

const phantoms = [];
for (const [pkg, occurrences] of extracted.entries()) {
  if (!declared.has(pkg)) {
    phantoms.push(pkg);
  }
}

const zombies = [];
for (const dep of declared) {
  if (!extracted.has(dep)) {
    zombies.push(dep);
  }
}

console.log(`Declared Dependencies in package.json: ${Array.from(declared).join(', ')}\n`);

console.log(`[PHANTOM IMPORTS] (Used in code, but missing from package.json!):`);
phantoms.forEach((p) => console.log(`   - "${p}" (will crash in clean Docker / CI build)`));

console.log(`\n[ZOMBIE DEPENDENCIES] (Declared in package.json, but never imported!):`);
zombies.forEach((z) => console.log(`   - "${z}" (wasting node_modules disk space)`));

console.log('\n[SUCCESS] Demo completed successfully.\n');

