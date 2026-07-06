/**
 * prediction/controller/predictionController.js
 *
 * Handles HTTP for the prediction module.
 * Validates input, calls service, returns JSON.
 */

import { validatePredictionRange } from '../validators/predictionValidators.js';
import { getPrediction } from '../service/predictionService.js';

/**
 * GET /api/prediction?fromDate=YYYY-MM-DD&toDate=YYYY-MM-DD
 */
export const getForecastPrediction = async (req, res) => {
  const { fromDate, toDate } = req.query;

  // Validate date range
  const validation = validatePredictionRange(fromDate, toDate);
  if (!validation.valid) {
    return res.status(400).json({
      message: validation.error,
      isPastDate: validation.isPastDate ?? false,
    });
  }

  try {
    const data = await getPrediction(req.user.hospitalId, fromDate, toDate);
    return res.json(data);
  } catch (err) {
    console.error('[predictionController.getForecastPrediction]', err);
    return res.status(500).json({ message: 'Failed to generate prediction. ' + err.message });
  }
};
