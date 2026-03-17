const express = require('express');
const cors = require('cors');
const http = require('http');
require('dotenv').config();

const { sequelize } = require('./models');
const { initSocket } = require('./services/socketService');

// App & Server
const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/game', require('./routes/game'));

// Init Socket.io
initSocket(server);

// Start server
const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: true }).then(() => {
  console.log('Database synced');
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => console.log('DB Connect Error:', err));
