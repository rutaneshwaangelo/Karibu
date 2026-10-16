const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const compression = require('compression');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const { apiLimiter } = require('./middleware/rateLimit');

// Load environment variables
dotenv.config();


const app = express();
const server = http.createServer(app);

// Vercel sets VERCEL=1 inside its serverless functions.
// Everything that needs a long-lived process (listening socket, queue engine
// timer) must be skipped there and handled by the request-scoped paths instead.
const IS_SERVERLESS = Boolean(process.env.VERCEL);

// =====================================================
// SOCKET.IO
// =====================================================

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  },
  // Serve the client bundle from the CDN rather than the API origin where possible
  serveClient: false,
});

// =====================================================
// DATABASE
// =====================================================

// Kick off the connection once at module scope so it is reused on warm
// serverless invocations. Requests still await `ensureDB` below.
connectDB().catch((error) => {
  console.error(`[MongoDB] Initial connection failed: ${error.message}`);
});

// =====================================================
// PLATFORM TRUST
// =====================================================

// Vercel terminates TLS at its edge, so req.ip / req.protocol are only correct
// once Express is told to trust the forwarding proxy. Required for accurate
// rate-limit keys and secure-cookie handling.
app.set('trust proxy', 1);

// =====================================================
// SECURITY HEADERS
// =====================================================

app.use(
  helmet({
    // The API only ever returns JSON; the SPA's CSP is served by Vercel's
    // static layer, so the API does not need a content security policy.
    contentSecurityPolicy: false,
    // Allow the API to be fetched cross-origin by the deployed frontend
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'no-referrer' },
  })
);

// =====================================================
// COMPRESSION
// =====================================================

// JSON payloads (queue lists, dashboards, reports) compress ~70-80%, which
// directly cuts transfer time on mobile connections. Vercel's edge also
// compresses, but this keeps self-hosted/other deployments equally fast.
app.use(compression());

// =====================================================
// CORS
// =====================================================

// CLIENT_URL may be a comma-separated list so preview deployments and the
// production domain can both be allowed without a code change.
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow same-origin / non-browser requests (no Origin header)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);

      return callback(
        new Error(`CORS blocked: origin ${origin} is not in CLIENT_URL.`)
      );
    },
    credentials: true,
  })
);

// =====================================================
// BODY PARSERS
// =====================================================

// Explicit limit: without one, a large body can exhaust the memory of a
// serverless function before any route logic runs.
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// =====================================================
// SOCKET.IO ACCESS FOR CONTROLLERS
// =====================================================

app.use((req, res, next) => {
  req.io = io;
  next();
});

// =====================================================
// DATABASE READINESS
// =====================================================

/**
 * Await the (cached) Mongo connection before any API handler runs.
 * Guarantees a cold start returns real data instead of a buffering timeout,
 * and returns a clean 503 when the database is genuinely unreachable.
 */
const ensureDB = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'The database is temporarily unavailable. Please retry in a moment.',
    });
  }
};

// =====================================================
// HEALTH CHECK
// =====================================================

const READY_STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;

  res.status(200).json({
    status: dbState === 1 ? 'ok' : 'degraded',
    app: 'KARIBU Smart Queue Management System',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    runtime: IS_SERVERLESS ? 'serverless' : 'long-lived',
    database: READY_STATES[dbState] || 'unknown',
    timestamp: new Date().toISOString(),
  });
});

// =====================================================
// API ROUTES
// =====================================================

// Broad per-client cap on top of each route's own authorization checks
app.use('/api', apiLimiter);

app.use('/api/auth', ensureDB, require('./routes/authRoutes'));

app.use('/api/admin', ensureDB, require('./routes/adminRoutes'));

app.use('/api/business', ensureDB, require('./routes/businessRoutes'));

app.use('/api/services', ensureDB, require('./routes/serviceRoutes'));

app.use('/api/staff', ensureDB, require('./routes/staffRoutes'));

app.use('/api/customer', ensureDB, require('./routes/customerRoutes'));

app.use('/api/cron', ensureDB, require('./routes/cronRoutes'));

// =====================================================
// QUEUE ENGINE
// =====================================================

// The timer-based engine needs a long-lived process. Where one exists we run
// it exactly as before; on serverless the queue is advanced by the cron
// endpoint (routes/cronRoutes.js) and opportunistically by the read paths.
if (!IS_SERVERLESS) {
  const { startQueueEngine } = require('./services/queueEngine');

  startQueueEngine(io, 5000);
}

// =====================================================
// SOCKET.IO CONNECTION
// =====================================================

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  // Business dashboard room
  socket.on('join_business', (businessId) => {
    if (businessId) {
      socket.join(`business:${businessId}`);

      console.log(
        `[Socket.IO] Socket ${socket.id} joined room business:${businessId}`
      );
    }
  });

  // Customer queue room
  socket.on('join_queue', (queueId) => {
    if (queueId) {
      socket.join(`queue:${queueId}`);

      console.log(
        `[Socket.IO] Socket ${socket.id} joined room queue:${queueId}`
      );
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// =====================================================
// 404 HANDLER
// =====================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {
  console.error('[Error]', err.stack || err.message);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',

    error:
      process.env.NODE_ENV === 'development'
        ? err.stack
        : undefined,
  });
});

// =====================================================
// LOCAL DEVELOPMENT SERVER
// =====================================================

// Only start a traditional server when a long-lived process is available.
// Vercel imports the exported Express app instead.
if (!IS_SERVERLESS) {
  const PORT = process.env.PORT || 5000;

  server.listen(PORT, '0.0.0.0', () => {
    console.log(
      `[KARIBU API] Server running in ${
        process.env.NODE_ENV || 'development'
      } mode on port ${PORT}`
    );
  });
}

// =====================================================
// EXPORT
// =====================================================

module.exports = app;
