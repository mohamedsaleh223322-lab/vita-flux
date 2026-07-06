import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../api/client';

let socket: Socket | null = null;

export const getSocket = (token?: string): Socket => {
  if (socket && socket.connected) return socket;

  socket = io(API_BASE_URL, {
    path: '/socket.io',
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
    auth: token ? { token } : {},
  });

  socket.on('connect', () => {
    console.log('[Socket] Connected:', socket?.id);
  });

  socket.on('connect_error', (err) => {
    console.warn('[Socket] Connection error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });

  return socket;
};

export const joinHospitalRoom = (hospitalId: string) => {   // UUID string
  if (socket) {
    socket.emit('join_hospital', hospitalId);
    console.log('[Socket] Joined public room: hospital', hospitalId);
  }
};

export const leaveHospitalRoom = (hospitalId: string) => {   // UUID string
  if (socket) {
    socket.emit('leave_hospital', hospitalId);
    console.log('[Socket] Left public room: hospital', hospitalId);
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
