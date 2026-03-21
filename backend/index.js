const express = require('express');
const cors = require('cors');
const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { sequelize, Prompt } = require('./models');

const DEFAULT_LAYOUT_PROMPT = 'Answer this question as an AI assistant. The users in a game will try to guess if this answer was written by AI or a Human doctor. Keep it helpful but natural.';
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
const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json({ limit: '10kb' })); // Prevent large payload attacks

// Request logging middleware
app.use((req, res, next) => {
  if (req.url !== '/api/game/pending-questions' || req.method !== 'GET') {
    logInfo(`${req.method} ${req.url}`);
  }
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/game', require('./routes/game'));
app.use('/api/admin', require('./routes/admin'));

// Init Socket.io
initSocket(server, allowedOrigin);

// Start server
const PORT = process.env.PORT || 5000;

sequelize.sync().then(async () => {
  logInfo('Database synced successfully');

  // Seed default layout prompt if it doesn't exist yet
  const existing = await Prompt.findOne({ where: { name: 'layout_prompt' } });
  if (!existing) {
    await Prompt.create({
      name: 'layout_prompt',
      content: DEFAULT_LAYOUT_PROMPT,
      updated_by: 'system',
    });
    logInfo('Default layout prompt seeded into database.');
  }

  server.listen(PORT, () => logInfo(`Server running on port ${PORT}`));
}).catch(err => logError('DB Connect Error:', err));

