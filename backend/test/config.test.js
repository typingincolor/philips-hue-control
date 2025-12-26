import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'fs';
import { load } from 'js-yaml';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Application Configuration', () => {
  const configPath = resolve(__dirname, '../../config.yaml');

  it('should have config.yaml file with valid structure', () => {
    expect(existsSync(configPath)).toBe(true);

    const config = load(readFileSync(configPath, 'utf-8'));

    // Server configuration
    expect(config.server.port).toBe(3001);
    expect(config.server.host).toBe('0.0.0.0');
    expect(config.server.corsEnabled).toBe(true);

    // Hue configuration
    expect(config.hue.discoveryEndpoint).toBe('https://discovery.meethue.com/');

    // Development configuration
    expect(config.development.frontendPort).toBe(5173);
    expect(config.development.backendPort).toBe(3001);
  });
});
