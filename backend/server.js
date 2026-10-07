const express = require('express');
const http = require('http');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  },
});

// Connect to MongoDB
connectDB();

// Core Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Attach Socket.IO to requests for use in controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Basic Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    app: 'KARIBU Smart Queue Management System',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/business', require('./routes/businessRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/staff', require('./routes/staffRoutes'));
app.use('/api/customer', require('./routes/customerRoutes'));

// Start Automatic Queue Engine (runs every 5 seconds)
const { startQueueEngine } = require('./services/queueEngine');
startQueueEngine(io, 5000);

// Socket.IO Connection Handler
io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  // Room joining logic for business dashboards and customer queue trackers
  socket.on('join_business', (businessId) => {
    if (businessId) {
      socket.join(`business:${businessId}`);
      console.log(`[Socket.IO] Socket ${socket.id} joined room business:${businessId}`);
    }
  });

  socket.on('join_queue', (queueId) => {
    if (queueId) {
      socket.join(`queue:${queueId}`);
      console.log(`[Socket.IO] Socket ${socket.id} joined room queue:${queueId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Centralized Error Handler
app.use((err, req, res, next) => {
  console.error('[Error]', err.stack || err.message);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
  server.listen(PORT, () => {
    console.log(
      `[KARIBU API] Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
    );
  });
}

module.exports = server;
