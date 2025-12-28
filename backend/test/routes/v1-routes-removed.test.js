/**
 * Tests to verify V1 API routes have been removed from server.js
 *
 * This tests the actual server configuration, not a test-created app.
 * V1 routes should be completely removed from the codebase.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('V1 Routes Removal', () => {
  describe('server.js should not mount V1 routes', () => {
    it('should not import v1Routes', () => {
      const serverPath = resolve(__dirname, '../../server.js');
      const serverContent = readFileSync(serverPath, 'utf-8');

      // Check that v1Routes is not imported
      expect(serverContent).not.toMatch(/import.*v1Routes.*from/);
    });

    it('should not mount routes at /api/v1', () => {
      const serverPath = resolve(__dirname, '../../server.js');
      const serverContent = readFileSync(serverPath, 'utf-8');

      // Check that /api/v1 routes are not mounted
      // (demo mode and rate limiting can still reference v1 for backwards compat docs)
      expect(serverContent).not.toMatch(/app\.use\(['"]\/api\/v1['"],\s*v1Routes\)/);
    });
  });

  describe('V1 route files should be removed', () => {
    it('routes/v1/index.js should not exist', () => {
      const v1IndexPath = resolve(__dirname, '../../routes/v1/index.js');

      expect(() => {
        readFileSync(v1IndexPath, 'utf-8');
      }).toThrow();
    });
  });
});
