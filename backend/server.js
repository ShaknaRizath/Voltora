import dotenv from 'dotenv';
dotenv.config(); // Load environment variables

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import connectDB from './config/db.js';
import { UPLOAD_DIR } from './middleware/uploadMiddleware.js';

import productRoutes from './routes/productRoutes.js';
import stripeRoutes from './routes/stripeRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import usersRouter from './routes/users.js';
import repairRoutes from './routes/repairRoutes.js';
import authRoutes from './routes/authRoutes.js';
import warrantyRoutes from './routes/warrantyRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

// Fail fast with a clear message instead of crashing later with a confusing one.
const missing = ['MONGO_URI', 'JWT_SECRET'].filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`❌ Missing required environment variables: ${missing.join(', ')}. See backend/.env.example`);
  process.exit(1);
}

const app = express();

// Behind a hosting proxy (Render, Railway...) the real client IP is in X-Forwarded-For.
// Needed so rate limiting counts each visitor separately.
if (process.env.NODE_ENV === 'production') app.set('trust proxy', 1);

app.use(
  helmet({
    // The frontend runs on another origin and displays images served from /uploads.
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((s) => s.trim());
app.use(cors({ origin: allowedOrigins }));

// Stripe webhook: must be registered BEFORE express.json() because Stripe's signature
// verification needs the raw, unparsed request body.
app.use('/api/stripe/webhook', webhookRoutes);

app.use(express.json({ limit: '10mb' })); // profile photos are sent as base64
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Uploaded repair photos
app.use('/uploads', express.static(UPLOAD_DIR, { index: false, dotfiles: 'deny' }));

// Brute-force protection on the account endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { msg: 'Too many attempts. Please try again in a few minutes.', message: 'Too many attempts. Please try again in a few minutes.' },
});
app.use('/api/auth', authLimiter);
app.use(
  [
    '/api/users/register',
    '/api/users/send-verification',
    '/api/users/verify-email-code',
    '/api/users/login-step-one',
    '/api/users/login-step-two',
    '/api/users/forgot-password',
    '/api/users/verify-reset-code',
    '/api/users/reset-password',
  ],
  authLimiter
);

// API routes
app.use('/api/products', productRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', usersRouter);
app.use('/api/repairs', repairRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/warranty', warrantyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
const health = (req, res) => res.json({ status: 'ok', service: 'Voltora API' });
app.get('/', health);
app.get('/api/health', health);

// Unknown API routes → JSON instead of an HTML error page
app.use('/api', (req, res) => res.status(404).json({ message: 'Not found' }));

// Central error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  let status = err.status || err.statusCode || 500;
  let message = err.message;

  if (err instanceof multer.MulterError) {
    status = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'Image is too large (max 5MB)' : err.message;
  } else if (status >= 500 && !err.expose) {
    console.error(err);
    message = 'Server error';
  }
  res.status(status).json({ message, msg: message });
});

// ✅ Connect to DB and start server only after successful connection
connectDB()
  .then(() => {
    const PORT = process.env.PORT || 5001;
    const server = app.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Stop the other process or change PORT in backend/.env`);
      } else {
        console.error('❌ Server error:', err);
      }
      process.exit(1);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err);
  });
