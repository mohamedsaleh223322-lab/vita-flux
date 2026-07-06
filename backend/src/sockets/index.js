import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';

let io = null;

export const initSockets = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Adjust for production
    },
    path: '/socket.io'
  });

  // Allow unauthenticated connections for mobile public rooms,
  // but verify JWT when present.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    // Mobile public observers (no token) are allowed with a flag
    if (!token) {
      socket.user = null;
      socket.isMobilePublic = true;
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      socket.isMobilePublic = decoded.role === 'MOBILE_USER' || decoded.role === 'USER';
      next();
    } catch (err) {
      // Reject invalid tokens
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    // ── Hospital-staff rooms (authenticated, hospitalId-scoped) ──────────
    if (socket.user?.hospitalId && !socket.isMobilePublic) {
      const room = `hospital:${socket.user.hospitalId}`;
      socket.join(room);
      logger.info(`Staff socket connected: ${socket.id}, joined room: ${room}`);
    }

    // ── Mobile: join a public hospital room on demand ────────────────────
    // Client emits: socket.emit('join_hospital', hospitalId)
    socket.on('join_hospital', (hospitalId) => {
      const room = `public:hospital:${hospitalId}`;
      socket.join(room);
      logger.info(`Mobile socket ${socket.id} joined public room: ${room}`);
    });

    socket.on('leave_hospital', (hospitalId) => {
      const room = `public:hospital:${hospitalId}`;
      socket.leave(room);
      logger.info(`Mobile socket ${socket.id} left public room: ${room}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Emits to staff room AND mobile public room so both get real-time updates
export const emitToHospital = (hospitalId, event, data) => {
  if (io) {
    const staffRoom = `hospital:${hospitalId}`;
    const publicRoom = `public:hospital:${hospitalId}`;

    io.to(staffRoom).emit(event, data);
    io.to(staffRoom).emit('dashboard_updated', data);

    // Mobile broadcast
    io.to(publicRoom).emit('inventory_updated', data);
    io.to(publicRoom).emit(event, data);
  }
};

export const getIO = () => io;
