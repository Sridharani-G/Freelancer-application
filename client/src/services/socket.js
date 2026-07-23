import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;
let currentUserId = null;

export const connectSocket = (userId) => {
    currentUserId = userId;
    if (!socket) {
        socket = io(SOCKET_URL, { transports: ['websocket'] });
        socket.on('connect', () => {
            console.log('[Socket] connected:', socket.id);
            if (currentUserId) {
                socket.emit('user:online', currentUserId);
            }
        });
        socket.on('disconnect', () => console.log('[Socket] disconnected'));
        socket.on('connect_error', (err) => console.warn('[Socket] connect_error', err));
    } else if (socket.connected && currentUserId) {
        socket.emit('user:online', currentUserId);
    }
    return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
        currentUserId = null;
    }
};

export default { connectSocket, getSocket, disconnectSocket };
