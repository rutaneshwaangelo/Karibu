const rateLimit = require('express-rate-limit');

/**
 * JSON 429 response, matching the shape every other endpoint returns.
 */
const jsonHandler = (message) => (req, res) => {
  res.status(429).json({ success: false, message });
};

/**
 * Strict limit on the credential endpoint.
 * Blunts brute-force / password-stuffing attempts against staff and admin logins.
 *
 * NOTE: the store is in-memory, so on a serverless host the counter is per
 * instance rather than global. It raises the cost of an attack considerably but
 * is not a substitute for a shared store (e.g. Redis) at high scale.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonHandler(
    'Too many login attempts from this address. Please try again in 15 minutes.'
  ),
});

/**
 * Broad safety net so one noisy client cannot burn through the serverless
 * function/bandwidth budget and starve real users.
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: jsonHandler('Too many requests. Please slow down and try again shortly.'),
});

module.exports = { authLimiter, apiLimiter };
