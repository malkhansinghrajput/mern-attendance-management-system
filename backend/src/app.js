require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const logger = require('./config/logger');
const routes = require('./routes');
const { errorHandler } = require('./middlewares/errorHandler');

const app = express();

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet());

// CORS — allow configured client origins and all localhost/127.0.0.1 ports in development
const configuredOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:5174'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-origin requests (mobile apps, Postman)
      if (!origin) return callback(null, true);

      // In development, permit any localhost / 127.0.0.1 port
      const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      if (process.env.NODE_ENV !== 'production' && isLocalhost) {
        return callback(null, true);
      }

      if (configuredOrigins.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many auth attempts' } },
});

app.use('/api', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── HTTP Logging (Morgan → Winston) ─────────────────────────────────────────
app.use(
  morgan('combined', {
    stream: { write: (message) => logger.http(message.trim()) },
    skip: (req) => req.path === '/api/health',
  })
);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api', routes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.path} not found` } });
});

// ─── Global Error Handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

module.exports = app;
