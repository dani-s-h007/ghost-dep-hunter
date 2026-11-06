/**
 * ghost-dep-hunter: CLI Interface
 */

import { parseArgs } from 'node:util';
import { resolve } from 'node:path';
import { auditDependencies } from './auditor.js';

export async function runCli(argv = process.argv.slice(2)) {
  const options = {
    help: { type: 'boolean', short: 'h', default: false },
    version: { type: 'boolean', short: 'v', default: false },
    strict: { type: 'boolean', short: 's', default: false },
    json: { type: 'boolean', default: false }
  };

  let parsed;
  try {
    parsed = parseArgs({ args: argv, options, allowPositionals: true });
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }

  const { values, positionals } = parsed;

  if (values.help) {
    printHelp();
    return 0;
  }

  if (values.version) {
    console.log('ghost-dep-hunter v1.0.0');
    return 0;
  }

  const rootDir = resolve(positionals[0] || '.');

  let report;
  try {
    report = await auditDependencies(rootDir);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }

  if (values.json) {
    console.log(JSON.stringify(report, null, 2));
    if (values.strict && report.hasIssues) process.exit(1);
    return 0;
  }

  console.log('\nghost-dep-hunter - Dependency & Import Auditor');
  console.log('============================================================');
  console.log(`Audited Directory:   ${rootDir}`);
  console.log(`Declared Packages:   ${report.totalDeclaredDeps}`);
  console.log(`Code Import Modules: ${report.totalImportsFound}\n`);

  if (!report.hasIssues) {
    console.log('[OK] Clean! No phantom imports or zombie dependencies found.');
    console.log('============================================================\n');
    return 0;
  }

  if (report.phantomImports.length > 0) {
    console.log(`[PHANTOM IMPORTS] (Imported in code, but missing from package.json) [${report.phantomImports.length}]:`);
    for (const item of report.phantomImports) {
      const loc = item.occurrences[0] ? ` (${item.occurrences[0].file}:${item.occurrences[0].line})` : '';
      console.log(`   - "${item.package}"${loc}`);
    }
    console.log('   -> Fix: Run `npm install <package>` to prevent production runtime crash!\n');
  }

  if (report.zombieDependencies.length > 0) {
    console.log(`[ZOMBIE DEPENDENCIES] (Listed in package.json, but never imported) [${report.zombieDependencies.length}]:`);
    for (const dep of report.zombieDependencies) {
      console.log(`   - "${dep}"`);
    }
    console.log('   -> Fix: Run `npm uninstall <package>` to prune node_modules bloat.\n');
  }

  console.log('============================================================\n');

  if (values.strict && report.phantomImports.length > 0) {
    process.exit(1);
  }

  return 0;
}

function printHelp() {
  console.log(`
ghost-dep-hunter - Zombie Dependency & Phantom Import Auditor

USAGE:
  $ ghost-dep-hunter [directory] [flags]

FLAGS:
  -s, --strict      Exit with code 1 if phantom imports are found (ideal for CI)
      --json        Output structured JSON
  -v, --version     Show version
  -h, --help        Show help

EXAMPLES:
  # Audit dependencies in current project:
  $ ghost-dep-hunter

  # Run in CI to prevent unlisted phantom imports from reaching production:
  $ ghost-dep-hunter --strict
`);
}

