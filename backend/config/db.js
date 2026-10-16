const mongoose = require('mongoose');
const dns = require('dns');

// Force Node.js to use Google DNS for MongoDB SRV resolution
dns.setServers(['8.8.8.8', '8.8.4.4']);

// =====================================================
// SERVERLESS-SAFE CONNECTION CACHE
// =====================================================
// On Vercel the module scope survives between invocations on a "warm" instance,
// but a cold instance starts with an empty module cache. Caching the in-flight
// connection promise means:
//   1. A warm instance reuses the existing socket pool (no re-handshake).
//   2. Concurrent requests during a cold start share ONE connection attempt
//      instead of each opening its own (avoids connection storms on Atlas).

let connectionPromise = null;

const connectDB = async () => {
  // readyState 1 === 'connected' -> reuse the live connection
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // An attempt is already in flight -> reuse it rather than opening another
  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = mongoose
    .connect(process.env.MONGODB_URI, {
      // Capped pool: serverless instances are many and short-lived, so a big
      // pool per instance would exhaust Atlas' connection limit.
      maxPoolSize: 10,
      minPoolSize: 0,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      // Fail fast instead of queueing indefinitely when the DB is unreachable
      bufferCommands: false,
    })
    .catch((error) => {
      // Reset so the next request retries instead of reusing a rejected promise
      connectionPromise = null;
      console.error(`[MongoDB] Connection error: ${error.message}`);
      throw error;
    });

  const conn = await connectionPromise;

  console.log(
    `[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`
  );

  return conn;
};

module.exports = connectDB;
