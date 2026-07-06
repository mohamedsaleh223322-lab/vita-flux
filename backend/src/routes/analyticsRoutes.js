import express from 'express';
import * as analyticsController from '../controllers/analyticsController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/reports', analyticsController.getReports);
router.get('/forecast', analyticsController.getForecast);
router.get('/expiring', analyticsController.getExpiring);
router.get('/expired', analyticsController.getExpired);
router.get('/low-stock', analyticsController.getLowStock);

export default router;
