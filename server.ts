import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import prisma from './src/config/database';
import authRoutes from './src/routes/auth';
import infraRoutes from './src/routes/infrastructure';
import emergencyRoutes from './src/routes/emergency';
import auditRoutes from './src/routes/audit';
import threatRoutes from './src/routes/threats';
import reportRoutes from './src/routes/reports';
import userRoutes from './src/routes/users';
import { authenticate } from './src/middleware/auth';
import { audit } from './src/middleware/audit';
import { apiLimiter } from './src/middleware/rateLimit';
import { startThreatDetectionWorker } from './src/workers/threatDetectionWorker';
import { startReportGeneratorWorker } from './src/workers/reportGeneratorWorker';

async function startServer() {
  const app = express();
  const PORT = 3001;

  app.use(helmet({
    contentSecurityPolicy: false, // Disable for development with Vite
  }));
  app.use(cors());
  app.use(express.json());

  // API Routes
  app.use('/api/auth', authRoutes);

  // Protected Routes
  app.use('/api/infrastructure', apiLimiter, authenticate, audit, infraRoutes);
  app.use('/api/emergency', apiLimiter, authenticate, audit, emergencyRoutes);
  app.use('/api/audit-logs', apiLimiter, authenticate, audit, auditRoutes);
  app.use('/api/threat-alerts', apiLimiter, authenticate, audit, threatRoutes);
  app.use('/api/reports', apiLimiter, authenticate, audit, reportRoutes);
  app.use('/api/users', apiLimiter, authenticate, audit, userRoutes);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  // Start workers
  startThreatDetectionWorker();
  startReportGeneratorWorker();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`UrbanShield Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
