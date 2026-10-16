const { processQueueTick } = require('../services/queueEngine');

/**
 * @desc    Safety-net tick for the automatic queue engine.
 *
 *          Vercel serverless functions cannot keep the `setInterval` engine
 *          running, so this endpoint is invoked by a Vercel Cron Job (and the
 *          read paths also tick opportunistically via maybeProcessQueueTick).
 *          Together they guarantee expired services are completed and the next
 *          customer is promoted even when nobody has the app open.
 *
 * @route   GET /api/cron/queue-tick
 * @access  Private (CRON_SECRET bearer token, injected by Vercel Cron)
 */
const runQueueTick = async (req, res, next) => {
  try {
    const secret = process.env.CRON_SECRET;

    // Never expose this endpoint without a secret: it mutates every business'
    // queue state, so an unauthenticated caller could disrupt live queues.
    if (!secret) {
      return res.status(503).json({
        success: false,
        message:
          'CRON_SECRET is not configured. Set it in the environment before enabling the queue cron.',
      });
    }

    if ((req.headers.authorization || '') !== `Bearer ${secret}`) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized cron request.',
      });
    }

    await processQueueTick(req.io);

    return res.status(200).json({
      success: true,
      message: 'Queue engine tick completed.',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { runQueueTick };
