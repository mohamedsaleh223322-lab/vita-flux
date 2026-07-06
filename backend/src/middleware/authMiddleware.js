import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Should contain userId, hospitalId, role
    next();
  } catch (err) {
    logger.error('JWT verification failed:', err.message);
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};

export const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};
