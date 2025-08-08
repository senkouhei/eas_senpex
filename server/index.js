import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { initWebSocketServer } from './utils/websocket.js';
import { startAllBots } from './bot/bot_manager.js';
import settingsService from './services/SettingsService.js';
import { getGoogleServiceInstance } from './utils/google.js';

import fs from 'fs';
import https from 'https';
// Routes
import candidatorRoutes from './routes/candidators.js';
import settingsRoutes from './routes/settings.js';
import dashboardRoutes from './routes/dashboard.js';
import authRoutes from './routes/auth.js';

(async () => {
  dotenv.config();

  await settingsService.load();

  const app = express();
  const PORT = process.env.PORT || 5000;
  const HOST = process.env.HOST || '0.0.0.0';
  const HTTPS = process.env.HTTPS || false;
  let server;
  if (HTTPS) {
    const privateKey = fs.readFileSync('/etc/letsencrypt/live/your-domain.com/privkey.pem', 'utf8');
    const certificate = fs.readFileSync('/etc/letsencrypt/live/your-domain.com/cert.pem', 'utf8');
    const ca = fs.readFileSync('/etc/letsencrypt/live/your-domain.com/chain.pem', 'utf8');
    const credentials = {
      key: privateKey,
      cert: certificate,
      ca: ca
    };
    server = https.createServer(credentials, app);
  } else {
    server = http.createServer(app);
  }
  // Middleware
  app.use(cors());
  app.use(express.json());

  // Google Service
  getGoogleServiceInstance();

  app.use('/api/candidators', candidatorRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/dashboard', dashboardRoutes); 
  app.use('/api/auth', authRoutes);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  server.listen(PORT, HOST, async () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Server accessible at ${HTTPS ? 'https://' : 'http://'}${HOST}:${PORT}`);
    // Initialize WebSocket server
    try {
      await initWebSocketServer(server);
      startAllBots();
    } catch (err) {
      console.error('Failed to initialize WebSocket server:', err);
      process.exit(1); // Optionally exit if this is critical
    }
  });
})();

