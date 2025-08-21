import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { initWebSocketServer } from './utils/websocket.js';


// Routes
import candidatorRoutes from './routes/candidators.js';
import settingsRoutes from './routes/settings.js';
import dashboardRoutes from './routes/dashboard.js';
import authRoutes from './routes/auth.js';
import smsRoutes from './routes/sms.js';
import analyticsRoutes from './routes/analytics.js';

(async () => {
  dotenv.config();

  const app = express();
  const PORT = process.env.PORT || 5000;
  const server = http.createServer(app);
  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  // Google Service
  // getGoogleServiceInstance();

  app.use('/api/candidators', candidatorRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/dashboard', dashboardRoutes); 
  app.use('/api/auth', authRoutes);
  app.use('/api/sms', smsRoutes);
  app.use('/api/analytics', analyticsRoutes);

  // Health check

  server.listen(PORT, '0.0.0.0', async () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Server accessible at http://localhost:${PORT}`);
    // Initialize WebSocket server
    try {
      await initWebSocketServer(server);
    } catch (err) {
      console.error('Failed to initialize WebSocket server:', err);
      process.exit(1); // Optionally exit if this is critical
    }
  });
})();

