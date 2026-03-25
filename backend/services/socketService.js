const { Server } = require('socket.io');

let io;

const initSocket = (server, allowedOrigin) => {
  io = new Server(server, {
    cors: {
      origin: allowedOrigin || 'http://localhost:5173',
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
