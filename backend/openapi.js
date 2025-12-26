/**
 * OpenAPI 3.0 Specification loader
 * Loads the spec from openapi.yaml
 */
import { load } from 'js-yaml';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const yamlPath = resolve(__dirname, 'openapi.yaml');
export const openApiSpec = load(readFileSync(yamlPath, 'utf8'));
