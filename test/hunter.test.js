import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractPackageName, extractImportsFromCode } from '../src/import-crawler.js';

describe('ghost-dep-hunter', () => {
  describe('extractPackageName', () => {
    it('extracts top-level packages and scoped packages', () => {
      assert.equal(extractPackageName('lodash'), 'lodash');
      assert.equal(extractPackageName('lodash/get'), 'lodash');
      assert.equal(extractPackageName('@babel/core/lib/index'), '@babel/core');
    });

    it('ignores relative files and node builtins', () => {
      assert.equal(extractPackageName('./utils.js'), null);
      assert.equal(extractPackageName('../index.ts'), null);
      assert.equal(extractPackageName('node:fs'), null);
      assert.equal(extractPackageName('path'), null);
    });
  });

  describe('extractImportsFromCode', () => {
    it('captures ESM and CommonJS imports accurately', () => {
      const code = `
        import express from 'express';
        import { readFile } from 'node:fs';
        const axios = require('axios');
        import('./lazy-loaded.js');
        import('zod');
      `;

      const found = extractImportsFromCode(code, 'app.ts');
      assert.ok(found.has('express'));
      assert.ok(found.has('axios'));
      assert.ok(found.has('zod'));
      assert.equal(found.has('node:fs'), false);
    });
  });
});

