import { io } from 'socket.io-client';

// Global singleton socket connection
// Keeps connection alive across full site navigation
const socket = io('http://localhost:5000', {
    autoConnect: true,
    withCredentials: true,
});

export default socket;
