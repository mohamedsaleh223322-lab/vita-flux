import express from 'express';
import * as transferController from '../controllers/transferController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/filters', transferController.getFilters);
router.get('/', transferController.listRequests);
router.post('/', transferController.createRequest);
router.patch('/:id/status', transferController.updateStatus);

export default router;
