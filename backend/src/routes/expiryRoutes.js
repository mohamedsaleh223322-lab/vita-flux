import express from 'express';
import * as expiryController from '../controllers/expiryController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/expiring-soon', expiryController.getExpiringSoon);
router.get('/expired', expiryController.getExpired);
router.get('/low-stock', expiryController.getLowStock);
router.patch('/dispose/:batchId', expiryController.disposeBatch);

export default router;
