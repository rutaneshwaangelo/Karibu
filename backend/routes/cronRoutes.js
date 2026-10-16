const express = require('express');
const router = express.Router();
const { runQueueTick } = require('../controllers/cronController');

// Invoked by Vercel Cron (see the "crons" block in vercel.json).
// Vercel automatically sends `Authorization: Bearer <CRON_SECRET>`.
router.get('/queue-tick', runQueueTick);

module.exports = router;
