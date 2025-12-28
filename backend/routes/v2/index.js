/**
 * V2 API Routes Index
 * Aggregates all V2 route modules
 */

import express from 'express';
import homeRouter from './home.js';
import servicesRouter from './services.js';

const router = express.Router();

// Mount V2 routes
router.use('/home', homeRouter);
router.use('/services', servicesRouter);

export default router;
