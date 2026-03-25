const express = require('express');
const cors = require('cors');
const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { sequelize, Prompt } = require('./models');
const logger = require('./services/logger');

const DEFAULT_LAYOUT_PROMPT = 'Answer this question as an AI assistant. The users in a game will try to guess if this answer was written by AI or a Human doctor. Keep it helpful but natural.';
const { initSocket } = require('./services/socketService');

// App & Server
const app = express();
const server = http.createServer(app);

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173'
];
if (process.env.ALLOWED_ORIGIN) {
  allowedOrigins.push(process.env.ALLOWED_ORIGIN);
}

app.use(cors({ 
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }, 
  credentials: true 
}));
app.use(express.json({ limit: '10kb' })); // Prevent large payload attacks

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    // Only automatically log if it's an error (4xx or 5xx)
    // Milestone events will be logged explicitly in controllers
    if (res.statusCode >= 400) {
      logger.http(req, res, duration);
    }
  });
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/game', require('./routes/game'));
app.use('/api/admin', require('./routes/admin'));

// Init Socket.io
initSocket(server, allowedOrigins);

// Start server
const PORT = process.env.PORT || 5000;

sequelize.sync().then(async () => {
  logger.success('Database synced successfully');

  // Seed default layout prompt if it doesn't exist yet
  const existing = await Prompt.findOne({ where: { name: 'layout_prompt' } });
  if (!existing) {
    await Prompt.create({
      name: 'layout_prompt',
      content: DEFAULT_LAYOUT_PROMPT,
      updated_by: 'system',
    });
    logger.info('Default layout prompt seeded into database.');
  }

  server.listen(PORT, () => logger.success(`Server running on port ${PORT}`));
}).catch(err => logger.error('DB Connect Error:', err));

