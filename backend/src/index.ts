import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env, validateEnv } from './config/env';
import authRoutes from './routes/auth';
import driveRoutes from './routes/drive';
import bookingRoutes from './routes/bookings';
import { errorHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimit';

// Validate environment variables before starting
validateEnv();

const app = express();
const PORT = env.PORT;

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Middleware
app.use(
  cors({
    origin:
      env.NODE_ENV === 'production'
        ? env.FRONTEND_URL
        : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting middleware
app.use(generalLimiter);

// API versioning
const apiV1 = express.Router();

// Routes
apiV1.use('/auth', authRoutes);
apiV1.use('/drive', driveRoutes);
apiV1.use('/bookings', bookingRoutes);

// Mount API routes
app.use('/api/v1', apiV1);

// Legacy routes support (for backward compatibility)
app.use('/auth', authRoutes);
app.use('/drive', driveRoutes);
app.use('/bookings', bookingRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`✅ LetsTravel Backend Server running on port ${PORT}`);
  console.log(`📍 Environment: ${env.NODE_ENV}`);
  console.log(`🔗 Frontend URL: ${env.FRONTEND_URL}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Closing server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
