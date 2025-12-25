import https from 'https';

/**
 * Shared HTTPS agent for Hue Bridge connections.
 * Accepts self-signed certificates (required for local Hue Bridge API).
 */
export const hueHttpsAgent = new https.Agent({
  rejectUnauthorized: false,
});
