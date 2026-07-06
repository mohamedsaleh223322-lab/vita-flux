import express from 'express';
import * as inventoryController from '../controllers/inventoryController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/summary', inventoryController.getSummary);
router.post('/add', inventoryController.addBlood);
router.post('/remove', inventoryController.removeBlood);

export default router;
