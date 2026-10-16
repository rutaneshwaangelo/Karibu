const {
  Queue,
  Customer,
  Service,
  Business,
} = require('../models');

const {
  generateQueueNumber,
  recalculateWaitTimes,
  promoteNextCustomer,
  computePlaceInLine,
  businessIdOf,
  completeCurrentService,
  adjustServiceTime,
  maybeProcessQueueTick,
} = require('../services/queueEngine');

/**
 * @desc    Customer joins a queue (No authentication required)
 * @route   POST /api/customer/queue/join
 * @access  Public
 */
const joinQueue = async (req, res, next) => {
  try {
    const { businessId, serviceId, customerName, customerPhone } = req.body;

    if (!businessId || !serviceId || !customerName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide businessId, serviceId, and your name.',
      });
    }

    // Verify business is active
    const business = await Business.findById(businessId);
    if (!business || business.status !== 'ACTIVE') {
      return res.status(400).json({
        success: false,
        message: 'This business is currently not accepting queue entries.',
      });
    }

    // Verify service is active and belongs to this business
    const service = await Service.findOne({
      _id: serviceId,
      businessId,
      active: true,
    });

    if (!service) {
      return res.status(400).json({
        success: false,
        message: 'Selected service is not available for this business.',
      });
    }

    // 1. Create or record customer
    const customer = await Customer.create({
      name: customerName.trim(),
      phone: customerPhone ? customerPhone.trim() : '',
    });

    // 2. Generate daily sequential queue number (K001, K002...)
    const queueNumber = await generateQueueNumber(businessId);

    // 3. Create queue entry with WAITING status
    const queueEntry = await Queue.create({
      businessId,
      serviceId,
      customerId: customer._id,
      queueNumber,
      status: 'WAITING',
      joinedAt: new Date(),
    });

    // 4. If no one is currently being served, promote this customer immediately!
    const activeServing = await Queue.findOne({
      businessId,
      status: 'SERVING',
    });

    let currentQueueRecord;
    if (!activeServing) {
      currentQueueRecord = await promoteNextCustomer(businessId, req.io);
    } else {
      await recalculateWaitTimes(businessId);
      currentQueueRecord = await Queue.findById(queueEntry._id)
        .populate('serviceId', 'name durationMinutes')
        .populate('customerId', 'name phone');
    }

    // 5. Calculate position (how many people ahead)
    const position = await Queue.countDocuments({
      businessId,
      status: { $in: ['WAITING', 'SERVING'] },
      joinedAt: { $lt: queueEntry.joinedAt },
    });

    // Broadcast update to business dashboard
    if (req.io) {
      req.io.to(`business:${businessId}`).emit('queue_updated', {
        action: 'customer_joined',
        queueNumber,
        customerName: customer.name,
      });
    }

    res.status(201).json({
      success: true,
      message: `Successfully joined queue for ${business.name}!`,
      data: {
        queueId: queueEntry._id,
        queueNumber: queueEntry.queueNumber,
        status: currentQueueRecord ? currentQueueRecord.status : 'WAITING',
        position: position + 1,
        estimatedWaitMinutes: currentQueueRecord ? currentQueueRecord.estimatedWaitMinutes : 0,
        service: {
          id: service._id,
          name: service.name,
          durationMinutes: service.durationMinutes,
        },
        business: {
          id: business._id,
          name: business.name,
          location: business.location,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Customer tracks their live queue status
 * @route   GET /api/customer/queue/:id
 * @access  Public
 */
const getQueueStatus = async (req, res, next) => {
  try {
    // Advance the engine before reading, so the status/position returned here is
    // never stale even on a serverless host where no timer is running.
    // Throttled internally to one tick per 5s per warm instance.
    await maybeProcessQueueTick(req.io);

    const queue = await Queue.findById(req.params.id)
      .populate('businessId', 'name location phone address')
      .populate('serviceId', 'name durationMinutes')
      .populate('customerId', 'name phone');

    if (!queue) {
      return res.status(404).json({
        success: false,
        message: 'Queue entry not found',
      });
    }

    // 1-based place in line (1 = you are next); 0 while you are being served.
    const { placeInLine, peopleAhead } = await computePlaceInLine(queue);

    res.status(200).json({
      success: true,
      data: {
        queueId: queue._id,
        queueNumber: queue.queueNumber,
        status: queue.status,
        placeInLine,
        peopleAhead,
        estimatedWaitMinutes: queue.estimatedWaitMinutes,
        joinedAt: queue.joinedAt,
        startedAt: queue.startedAt,
        expectedEndAt: queue.expectedEndAt,
        extensionMinutes: queue.extensionMinutes || 0,
        customer: {
          name: queue.customerId?.name,
        },
        service: {
          name: queue.serviceId?.name,
          durationMinutes: queue.serviceId?.durationMinutes,
        },
        business: {
          id: queue.businessId?._id,
          name: queue.businessId?.name,
          location: queue.businessId?.location,
          address: queue.businessId?.address,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Look up an active ticket by customer name or ticket number
 * @route   POST /api/customer/queue/track
 * @access  Public
 *
 *          Customers only ever receive their queueId at join time, so anyone
 *          who lost that link (or closed the tab) can still find their place
 *          in the line by typing the name or the ticket number they were given.
 *          Only still-active tickets are returned, never phone numbers.
 */
const trackQueue = async (req, res, next) => {
  try {
    const rawQuery = String(req.body?.query || req.query.q || '').trim();
    const businessId = req.body?.businessId || req.query.businessId;

    if (rawQuery.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Enter your name (at least 2 characters) or your ticket number (e.g. K001).',
      });
    }

    if (rawQuery.length > 60) {
      return res.status(400).json({
        success: false,
        message: 'That search is too long. Please enter just your name or ticket number.',
      });
    }

    // Advance the engine first: a place in line that is even one tick stale is
    // exactly the complaint this endpoint exists to answer.
    await maybeProcessQueueTick(req.io);

    const escaped = rawQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const ticketCandidate = rawQuery.replace(/[\s-]/g, '').toUpperCase();

    const clauses = [
      { queueNumber: { $regex: `^${escaped}$`, $options: 'i' } },
      { queueNumber: ticketCandidate },
    ];

    // Match the name on the customer record, then join it to active queue entries
    const namedCustomers = await Customer.find({
      name: { $regex: escaped, $options: 'i' },
    })
      .select('name')
      .limit(50);

    if (namedCustomers.length > 0) {
      clauses.push({ customerId: { $in: namedCustomers.map((c) => c._id) } });
    }

    const filter = {
      status: { $in: ['WAITING', 'SERVING'] },
      $or: clauses,
    };

    if (businessId) {
      filter.businessId = businessId;
    }

    const entries = await Queue.find(filter)
      .populate('businessId', 'name location address')
      .populate('serviceId', 'name durationMinutes')
      .populate('customerId', 'name')
      .sort({ joinedAt: 1, _id: 1 })
      .limit(10);

    // Shared desk context per business: who is being served and how long the line is
    const businessIds = [
      ...new Set(entries.map((entry) => businessIdOf(entry).toString())),
    ];

    const contextByBusiness = {};

    await Promise.all(
      businessIds.map(async (id) => {
        const [serving, totalWaiting] = await Promise.all([
          Queue.findOne({ businessId: id, status: 'SERVING' }).select('queueNumber'),
          Queue.countDocuments({ businessId: id, status: 'WAITING' }),
        ]);

        contextByBusiness[id] = {
          nowServing: serving?.queueNumber || null,
          totalWaiting,
        };
      })
    );

    const matches = await Promise.all(
      entries.map(async (entry) => {
        const { placeInLine, peopleAhead } = await computePlaceInLine(entry);
        const key = businessIdOf(entry).toString();
        const context = contextByBusiness[key] || {};

        return {
          queueId: entry._id,
          queueNumber: entry.queueNumber,
          status: entry.status,
          placeInLine,
          peopleAhead,
          estimatedWaitMinutes: entry.estimatedWaitMinutes,
          joinedAt: entry.joinedAt,
          startedAt: entry.startedAt,
          expectedEndAt: entry.expectedEndAt,
          extensionMinutes: entry.extensionMinutes || 0,
          customer: {
            name: entry.customerId?.name,
          },
          service: {
            name: entry.serviceId?.name,
            durationMinutes: entry.serviceId?.durationMinutes,
          },
          business: {
            id: businessIdOf(entry),
            name: entry.businessId?.name,
            location: entry.businessId?.location,
          },
          nowServing: context.nowServing || null,
          totalWaiting: context.totalWaiting || 0,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: matches.length,
      data: {
        query: rawQuery,
        matches,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Customer voluntarily leaves queue
 * @route   POST /api/customer/queue/:id/leave
 * @access  Public
 */
const leaveQueue = async (req, res, next) => {
  try {
    const queue = await Queue.findById(req.params.id);

    if (!queue) {
      return res.status(404).json({
        success: false,
        message: 'Queue entry not found',
      });
    }

    if (queue.status === 'COMPLETED' || queue.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: `Cannot leave: queue is already ${queue.status.toLowerCase()}.`,
      });
    }

    const wasServing = queue.status === 'SERVING';
    queue.status = 'LEFT';
    queue.leftAt = new Date();
    await queue.save();

    if (wasServing) {
      await promoteNextCustomer(queue.businessId, req.io);
    } else {
      await recalculateWaitTimes(queue.businessId);
    }

    if (req.io) {
      req.io.to(`business:${queue.businessId}`).emit('queue_updated', {
        action: 'customer_left',
        queueNumber: queue.queueNumber,
      });
    }

    res.status(200).json({
      success: true,
      message: 'You have left the queue.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get live business queue for Staff and Business Owner
 * @route   GET /api/business/queue OR GET /api/staff/queue
 * @access  Private (BUSINESS_OWNER, STAFF)
 */
const getBusinessActiveQueue = async (req, res, next) => {
  try {
    // Keep the staff console live: auto-complete expired services and promote
    // the next customer before we read the queue (throttled to 5s/instance).
    await maybeProcessQueueTick(req.io);

    const businessId = req.user.businessId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [currentServing, waitingList, recentlyCompleted] = await Promise.all([
      Queue.findOne({ businessId, status: 'SERVING' })
        .populate('serviceId', 'name durationMinutes')
        .populate('customerId', 'name phone'),
      Queue.find({ businessId, status: 'WAITING' })
        .populate('serviceId', 'name durationMinutes')
        .populate('customerId', 'name phone')
        .sort({ joinedAt: 1, _id: 1 }),
      Queue.find({
        businessId,
        status: 'COMPLETED',
        completedAt: { $gte: today },
      })
        .populate('serviceId', 'name durationMinutes')
        .populate('customerId', 'name')
        .sort({ completedAt: -1 })
        .limit(10),
    ]);

    res.status(200).json({
      success: true,
      data: {
        currentServing,
        waitingList,
        recentlyCompleted,
        totalWaiting: waitingList.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Staff time adjustment (+5, +10, +15, -5, -10 minutes)
 * @route   POST /api/staff/queue/:id/adjust-time
 * @access  Private (STAFF, BUSINESS_OWNER)
 */
const staffAdjustTime = async (req, res, next) => {
  try {
    const { minutes } = req.body;
    const queueId = req.params.id;
    const businessId = req.user.businessId;

    const updatedQueue = await adjustServiceTime(
      businessId,
      queueId,
      minutes,
      req.io
    );

    res.status(200).json({
      success: true,
      message: `Service duration adjusted by ${minutes > 0 ? '+' : ''}${minutes} minutes.`,
      data: updatedQueue,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Finish the service at the desk now and call the next customer
 * @route   POST /api/staff/queue/:id/complete
 * @access  Private (STAFF, BUSINESS_OWNER)
 */
const completeService = async (req, res, next) => {
  try {
    const { completed, nextServing } = await completeCurrentService(
      req.user.businessId,
      req.params.id,
      req.io
    );

    res.status(200).json({
      success: true,
      message: nextServing
        ? `${completed.queueNumber} completed. ${nextServing.queueNumber} is now being served.`
        : `${completed.queueNumber} completed. The waiting line is now empty.`,
      data: { completed, nextServing },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Cancel a queue entry (no-show or administrative cancellation)
 * @route   POST /api/business/queue/:id/cancel
 * @access  Private (BUSINESS_OWNER, STAFF)
 */
const cancelQueueEntry = async (req, res, next) => {
  try {
    const queue = await Queue.findOne({
      _id: req.params.id,
      businessId: req.user.businessId,
    });

    if (!queue) {
      return res.status(404).json({
        success: false,
        message: 'Queue entry not found in your business.',
      });
    }

    const wasServing = queue.status === 'SERVING';
    queue.status = 'CANCELLED';
    await queue.save();

    if (wasServing) {
      await promoteNextCustomer(req.user.businessId, req.io);
    } else {
      await recalculateWaitTimes(req.user.businessId);
    }

    if (req.io) {
      req.io.to(`business:${req.user.businessId}`).emit('queue_updated', {
        action: 'customer_cancelled',
        queueNumber: queue.queueNumber,
      });
      req.io.to(`queue:${queue._id}`).emit('customer_status_changed', {
        status: 'CANCELLED',
      });
    }

    res.status(200).json({
      success: true,
      message: `Queue entry ${queue.queueNumber} cancelled.`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  joinQueue,
  getQueueStatus,
  trackQueue,
  leaveQueue,
  getBusinessActiveQueue,
  staffAdjustTime,
  completeService,
  cancelQueueEntry,
};
