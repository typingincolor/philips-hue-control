import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// Mock the sub-routers
vi.mock('../../../routes/v2/home.js', () => ({
  default: express.Router().get('/', (req, res) => res.json({ mock: 'home' })),
}));

vi.mock('../../../routes/v2/services.js', () => ({
  default: express.Router().get('/', (req, res) => res.json({ mock: 'services' })),
}));

import v2Routes from '../../../routes/v2/index.js';

describe('V2 Routes Index', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use('/api/v2', v2Routes);
  });

  it('should mount home routes at /home', async () => {
    const response = await request(app).get('/api/v2/home');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ mock: 'home' });
  });

  it('should mount services routes at /services', async () => {
    const response = await request(app).get('/api/v2/services');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ mock: 'services' });
  });
});
