import express from 'express';
import authRouter from './auth.js';
import dashboardRouter from './dashboard.js';
import motionZonesRouter from './motionZones.js';
import lightsRouter from './lights.js';
import roomsRouter from './rooms.js';
import zonesRouter from './zones.js';
import scenesRouter from './scenes.js';
import statsRouter from './stats.js';
import settingsRouter from './settings.js';
import weatherRouter from './weather.js';
import automationsRouter from './automations.js';
import hiveRouter from './hive.js';

const router = express.Router();

// Mount v1 routes
router.use('/auth', authRouter);
router.use('/dashboard', dashboardRouter);
router.use('/motion-zones', motionZonesRouter);
router.use('/lights', lightsRouter);
router.use('/rooms', roomsRouter);
router.use('/zones', zonesRouter);
router.use('/scenes', scenesRouter);
router.use('/stats', statsRouter);
router.use('/settings', settingsRouter);
router.use('/weather', weatherRouter);
router.use('/automations', automationsRouter);
router.use('/hive', hiveRouter);

export default router;
