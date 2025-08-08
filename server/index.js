import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { initWebSocketServer } from './utils/websocket.js';
import { startAllBots } from './bot/bot_manager.js';
import settingsService from './services/SettingsService.js';
import { getGoogleServiceInstance } from './utils/google.js';

// Routes
import candidatorRoutes from './routes/candidators.js';
import settingsRoutes from './routes/settings.js';
import dashboardRoutes from './routes/dashboard.js';
import authRoutes from './routes/auth.js';

(async () => {
  dotenv.config();

  await settingsService.load();

  const app = express();
  const server = http.createServer(app);
  const PORT = process.env.PORT || 5000;

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Google Service
  const googleService = getGoogleServiceInstance();

  app.use('/api/candidators', candidatorRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/dashboard', dashboardRoutes); 
  app.use('/api/auth', authRoutes);

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Server accessible at http://localhost:${PORT}`);
    // Initialize WebSocket server
    initWebSocketServer(server).then(() => {
      startAllBots();
    });
  });
})();

