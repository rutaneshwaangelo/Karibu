const express = require('express');
const router = express.Router();
const { login, getMe, logout } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

// Rate-limited: this is the only credential-checking endpoint in the app.
router.post('/login', authLimiter, login);
router.get('/me', verifyToken, getMe);
router.post('/logout', logout);

module.exports = router;
