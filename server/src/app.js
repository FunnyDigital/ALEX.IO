const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const config = require('./config');

function createApp() {
  const app = express();

  app.use(cors(config.corsOrigins === true ? {} : { origin: config.corsOrigins, credentials: true }));
  app.use(express.json());

  app.get('/api/health', (req, res) => res.json({ ok: true, mode: config.mode }));

  if (config.isDemo) {
    app.use('/api/auth', require('./routes/auth'));
  }
  app.use('/api/user', require('./routes/user'));
  app.use('/api/games', require('./routes/games'));

  app.use('/api', (req, res) => res.status(404).json({ message: 'Endpoint not found' }));

  if (fs.existsSync(config.paths.webDist)) {
    app.use(express.static(config.paths.webDist));
    app.use((req, res, next) => {
      if (req.method !== 'GET') return next();
      res.sendFile(path.join(config.paths.webDist, 'index.html'));
    });
  } else {
    app.get('/', (req, res) => res.send('ALEX.IO API is running. Build the web app with "npm run build".'));
  }

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ message: 'Server error' });
  });

  return app;
}

module.exports = createApp;
