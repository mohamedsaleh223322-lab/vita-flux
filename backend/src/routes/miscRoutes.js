import express from 'express';
import * as authController from '../controllers/authController.js';

const router = express.Router();

router.get('/governorates', authController.getGovernorates);
router.get('/hospitals', authController.getHospitals);

export default router;
