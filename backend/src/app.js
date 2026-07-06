import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger } from './utils/logger.js';

import authRoutes from './routes/authRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import transferRoutes from './routes/transferRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import expiryRoutes from './routes/expiryRoutes.js';
import miscRoutes from './routes/miscRoutes.js';
import mobileRoutes from './routes/mobileRoutes.js';
import predictionRoutes from '../modules/prediction/routes/predictionRoutes.js';
import hospitalProfileRoutes from './routes/hospitalProfileRoutes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin for uploads
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "http:", "https:"],
      },
    },
  })
);
app.use(cors());
app.use(compression());
app.use(express.json());

// Serve uploaded hospital images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/requests', transferRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/expiry', expiryRoutes);
app.use('/api', miscRoutes);
app.use('/api/prediction', predictionRoutes);
app.use('/api/mobile', mobileRoutes);
app.use('/api/hospitals', hospitalProfileRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Vita Flux API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled Error:', err);
  res.status(err.status || 500).json({ 
    message: err.message || 'An unexpected error occurred' 
  });
});

export default app;
