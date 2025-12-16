import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendDist = path.resolve(__dirname, '../../frontend/dist');
const backendPublic = path.resolve(__dirname, '../public');

console.log('Copying frontend build to backend/public...');
console.log(`From: ${frontendDist}`);
console.log(`To: ${backendPublic}`);

// Remove existing public directory
if (fs.existsSync(backendPublic)) {
  fs.removeSync(backendPublic);
  console.log('✓ Removed existing public directory');
}

// Copy frontend build to backend public
if (fs.existsSync(frontendDist)) {
  fs.copySync(frontendDist, backendPublic);
  console.log('✓ Frontend build copied successfully!');
} else {
  console.error('✗ Error: Frontend build not found at:', frontendDist);
  console.error('  Run "npm run build" from root first.');
  process.exit(1);
}
