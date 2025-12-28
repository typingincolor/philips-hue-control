/**
 * V2 API Routes Index
 * Aggregates all V2 route modules
 */

import express from 'express';
import homeRouter from './home.js';
import servicesRouter from './services.js';
import authRouter from './auth.js';
import settingsRouter from './settings.js';
import weatherRouter from './weather.js';
import automationsRouter from './automations.js';

const router = express.Router();

// Mount V2 routes
router.use('/home', homeRouter);
router.use('/services', servicesRouter);
router.use('/auth', authRouter);
router.use('/settings', settingsRouter);
router.use('/weather', weatherRouter);
router.use('/automations', automationsRouter);

export default router;
