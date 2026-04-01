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
const { initAdmin } = require('./services/initService');

// App & Server
const app = express();
const server = http.createServer(app);

// Middleware
const PORT = process.env.PORT || 5000;

app.use(cors({ 
  origin: function (origin, callback) {
    // 1. Allow if there's no origin (like mobile apps or curl)
    // 2. Allow if it's from localhost/127.0.0.1
    // 3. Allow if it's from a private local network (192.168.x.x, 10.x.x.x, 172.16.x.x) on the dev port
    const isLocal = !origin || 
                   origin.startsWith('http://localhost') || 
                   origin.startsWith('http://127.0.0.1') || 
                   /^http:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|26\.)/.test(origin);

    if (isLocal || (process.env.ALLOWED_ORIGIN && origin === process.env.ALLOWED_ORIGIN)) {
      callback(null, true);
    } else {
      console.error(`CORS Blocked Origin: ${origin}`);
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

// Serve frontend static build in production
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  // All non-API routes -> index.html (React Router handles client-side routing)
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(frontendDist, 'index.html'));
    }
    next();
  });
  logger.info(`Serving static frontend from: ${frontendDist}`);
}

// Init Socket.io
initSocket(server);

// Start server

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

  // Initialize automatic admin creation if needed
  await initAdmin();

  server.listen(PORT, () => logger.success(`Server running on port ${PORT}`));

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(`Port ${PORT} is already in use. Is another instance of the server running?`);
      logger.warn(`Kill the other process first, then restart.`);
      process.exit(1);
    } else {
      throw err;
    }
  });
}).catch(err => logger.error('DB Connect Error:', err));

