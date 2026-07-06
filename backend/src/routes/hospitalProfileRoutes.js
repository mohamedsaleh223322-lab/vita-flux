import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { authMiddleware } from '../middleware/authMiddleware.js';
import * as profileCtrl from '../controllers/hospitalProfileController.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Multer config — store in backend/uploads/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `hospital-${req.user.hospitalId}-${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (['image/jpeg', 'image/png', 'image/jpg'].includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG and PNG images are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter,
});

const router = express.Router();

// All hospital profile routes require authentication
router.get('/profile', authMiddleware, profileCtrl.getProfile);
router.patch('/profile', authMiddleware, profileCtrl.updateProfile);
router.post('/profile/image', authMiddleware, upload.single('image'), profileCtrl.uploadImage);
router.patch('/profile/password', authMiddleware, profileCtrl.changePassword);

export default router;
