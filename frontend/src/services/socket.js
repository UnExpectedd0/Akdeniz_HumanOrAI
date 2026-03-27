import { io } from 'socket.io-client';

// No URL needed — connects to the same origin the page was loaded from
// In dev: Vite proxy forwards /socket.io to backend
// In production: Express serves everything on the same origin
const socket = io({
    autoConnect: true,
    withCredentials: true,
});

export default socket;
