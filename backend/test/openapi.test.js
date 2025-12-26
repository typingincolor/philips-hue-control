import { describe, it, expect } from 'vitest';
import { openApiSpec } from '../openapi.js';

describe('OpenAPI Specification', () => {
  it('should export a valid OpenAPI 3.0 specification with required structure', () => {
    expect(openApiSpec.openapi).toBe('3.0.0');
    expect(openApiSpec.info.title).toBe('Philips Hue Control API');
    expect(openApiSpec.info.version).toBe('2.0.0');
    expect(openApiSpec.servers.length).toBeGreaterThan(0);
    expect(openApiSpec.components.securitySchemes.BearerAuth).toBeDefined();
    expect(openApiSpec.components.securitySchemes.DemoMode).toBeDefined();
  });

  it('should define all required API endpoints', () => {
    const requiredPaths = [
      '/auth/connect',
      '/auth/pair',
      '/auth/session',
      '/dashboard',
      '/lights/{id}',
      '/rooms/{id}/lights',
      '/scenes/{id}/activate',
      '/settings',
      '/weather',
    ];

    for (const path of requiredPaths) {
      expect(openApiSpec.paths[path], `Missing path: ${path}`).toBeDefined();
    }
  });

  it('should load spec from openapi.yaml file', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const yaml = await import('js-yaml');
    const { fileURLToPath } = await import('url');

    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const yamlPath = path.resolve(__dirname, '../openapi.yaml');

    expect(fs.existsSync(yamlPath)).toBe(true);

    const content = fs.readFileSync(yamlPath, 'utf8');
    const parsed = yaml.load(content);

    expect(parsed.openapi).toBe('3.0.0');
    expect(parsed.info.title).toBe('Philips Hue Control API');
  });
});
