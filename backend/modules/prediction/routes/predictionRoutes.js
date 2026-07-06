/**
 * prediction/routes/predictionRoutes.js
 *
 * Dedicated router for the Prediction & Intelligence module.
 * Completely independent from analyticsRoutes.
 *
 * Endpoint:
 *   GET /api/prediction?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD
 */

import express from 'express';
import { authMiddleware } from '../../../src/middleware/authMiddleware.js';
import { getForecastPrediction } from '../controller/predictionController.js';

const router = express.Router();

// All prediction routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/prediction
 * @desc    Generate full prediction payload for a future date range
 * @access  Private
 * @query   fromDate {string} YYYY-MM-DD — must be >= today
 * @query   toDate   {string} YYYY-MM-DD — must be >= fromDate
 */
router.get('/', getForecastPrediction);

export default router;
