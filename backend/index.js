const express = require('express');
const cors = require('cors');
const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { sequelize } = require('./models');
const { initSocket } = require('./services/socketService');

// App & Server
const app = express();
const server = http.createServer(app);

// --- Custom Logger Setup ---
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}
const logFile = path.join(logsDir, 'server.log');

const logInfo = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] INFO: ${message}\n`;
  console.log(logMessage.trim());
  fs.appendFileSync(logFile, logMessage);
};

const logError = (message, err) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ERROR: ${message} ${err ? err.stack || err : ''}\n`;
  console.error(logMessage.trim());
  fs.appendFileSync(logFile, logMessage);
};

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  logInfo(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/game', require('./routes/game'));

// Init Socket.io
initSocket(server);

// Start server
const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: true }).then(() => {
  logInfo('Database synced successfully');
  server.listen(PORT, () => logInfo(`Server running on port ${PORT}`));
}).catch(err => logError('DB Connect Error:', err));
