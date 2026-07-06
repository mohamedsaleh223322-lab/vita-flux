import { io } from 'socket.io-client';
import { getToken } from './authStorage.js';

let socket = null;
let lastToken = null;

/**
 * Connect Socket.IO once per session using the current JWT.
 * @returns {import('socket.io-client').Socket | null}
 */
export function connectRealtime() {
  const token = getToken();
  if (!token) {
    disconnectRealtime();
    return null;
  }
  if (socket?.connected && lastToken === token) {
    return socket;
  }
  disconnectRealtime();
  lastToken = token;
  socket = io(import.meta.env.VITE_DEV_API_URL || 'http://localhost:3000', {
    path: '/socket.io',
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
  });
  return socket;
}

export function disconnectRealtime() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  lastToken = null;
}

export function getRealtimeSocket() {
  return socket;
}
