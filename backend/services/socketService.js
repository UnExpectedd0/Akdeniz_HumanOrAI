const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        // 1. Allow if there's no origin (same-site or local)
        if (!origin) return callback(null, true);

        // 2. Allow if it's from localhost/local network
        const isLocal = origin.startsWith('http://localhost') || 
                       origin.startsWith('http://127.0.0.1') || 
                       /^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|26\.)/.test(origin);

        // 3. Allow if it matches our own domain or the configured ALLOWED_ORIGIN
        const isSelf = origin.includes('onrender.com');

        if (isLocal || isSelf || (process.env.ALLOWED_ORIGIN && origin === process.env.ALLOWED_ORIGIN)) {
          callback(null, true);
        } else {
          console.error(`Socket CORS Blocked Origin: ${origin}`);
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected via Socket:', socket.id);

    // Clients can join rooms based on their roles
    socket.on('join', (data) => {
      // Store userId on socket
      if (data.userId) {
        socket.userId = data.userId;
      }

      if (data.role === 'doctor' && data.groupId) {
        socket.join(`doctors_${data.groupId}`);
        console.log(`Socket ${socket.id} joined doctors_${data.groupId} room`);
      } else if (data.role === 'doctor') {
        // Fallback or unassigned doctor? Shouldn't happen with new logic
        socket.join('doctors');
      }
      if (data.userId) {
        // Create a personal room for the user to receive targeted updates
        socket.join(`user_${data.userId}`);
        console.log(`Socket ${socket.id} joined user_${data.userId} room`);
      }
      if (data.groupId) {
        // Generic group room for broadcast updates
        socket.join(`group_${data.groupId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      // Removed backend timed-kick mechanics per user request to improve stability
    });
  });
};

const getIo = () => io;

module.exports = { initSocket, getIo };
