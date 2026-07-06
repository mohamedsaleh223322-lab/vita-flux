import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { authMiddleware } from '../middleware/authMiddleware.js';
import * as mobileAuth from '../controllers/mobileAuthController.js';
import * as mobileHospital from '../controllers/mobileHospitalController.js';
import * as mobileFavorites from '../controllers/mobileFavoritesController.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Multer config for user avatar uploads
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `avatar-${req.user.userId}-${Date.now()}${ext}`);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/jpg'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG and PNG images are allowed.'), false);
    }
  },
});

const router = express.Router();

// ── Auth ──────────────────────────────────────────────────────────────────
router.post('/auth/login', mobileAuth.login);
router.post('/auth/register', mobileAuth.register);
router.get('/auth/me', authMiddleware, mobileAuth.getMe);
router.post('/auth/avatar', authMiddleware, avatarUpload.single('avatar'), mobileAuth.uploadAvatar);

// ── Public data (no auth required) ───────────────────────────────────────
router.get('/governorates', mobileHospital.getGovernorates);
router.get('/hospitals', mobileHospital.getHospitals);
router.get('/hospitals/:id', mobileHospital.getHospitalById);
router.get('/hospitals/:id/inventory', mobileHospital.getHospitalInventory);

// ── Favorites (auth required) ─────────────────────────────────────────────
router.get('/favorites', authMiddleware, mobileFavorites.getFavorites);
router.post('/favorites', authMiddleware, mobileFavorites.addFavorite);
router.delete('/favorites/:hospitalId', authMiddleware, mobileFavorites.removeFavorite);
router.get('/favorites/check/:hospitalId', authMiddleware, mobileFavorites.checkFavorite);

export default router;
