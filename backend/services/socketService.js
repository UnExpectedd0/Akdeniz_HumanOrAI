const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // For dev
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected via Socket:', socket.id);

    // Clients can join rooms based on their roles
    socket.on('join', (data) => {
      if (data.role === 'doctor') {
        socket.join('doctors');
        console.log(`Socket ${socket.id} joined doctors room`);
      }
      if (data.userId) {
        // Create a personal room for the user to receive targeted updates
        socket.join(`user_${data.userId}`);
        console.log(`Socket ${socket.id} joined user_${data.userId} room`);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
};

const getIo = () => io;

module.exports = { initSocket, getIo };
