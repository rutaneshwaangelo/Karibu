/**
 * Queue engine regression suite.
 *
 * The queue is the whole product, and it has already shipped broken once: the
 * engine was gated in a way that stopped it running in production, so tickets
 * froze and the next customer was never called. Nobody noticed until customers
 * complained, because nothing tested it.
 *
 * Every test here drives the real controllers and the real engine against a
 * real MongoDB (in-memory), so a regression in promotion, place-in-line,
 * tracking or manual completion fails the build instead of a queue.
 *
 *   npm test
 */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;
let Queue;
let engine;
let queueController;

before(async () => {
  process.env.JWT_SECRET = 'test-secret';

  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri('karibu_test');

  const connectDB = require('../config/db');
  await connectDB();

  ({ Queue } = require('../models'));
  engine = require('../services/queueEngine');
  queueController = require('../controllers/queueController');
});

after(async () => {
  await mongoose.connection.close();
  await mongod.stop();
});

/**
 * Calling a controller directly keeps the test focused on queue behaviour
 * (no HTTP, no auth). The stub mirrors the shape Express hands a handler -
 * including an always-present query/body/params - so the tested path is the
 * one production actually runs.
 */
const call = async (handler, partial = {}) => {
  const req = { query: {}, body: {}, params: {}, ...partial };

  let statusCode = 200;
  let payload = null;
  let thrown = null;

  const res = {
    status(code) {
      statusCode = code;
      return res;
    },
    json(body) {
      payload = body;
      return res;
    },
  };

  await handler(req, res, (err) => {
    thrown = err;
  });

  if (thrown) throw thrown;

  return { statusCode, payload };
};

/** Fresh business + service per test, so tests never depend on each other. */
const createShop = async () => {
  const { Business, Service } = require('../models');

  const business = await Business.create({
    name: 'Kibali Salon',
    categoryId: new mongoose.Types.ObjectId(),
    ownerId: new mongoose.Types.ObjectId(),
    location: 'Kigali',
  });

  const service = await Service.create({
    businessId: business._id,
    name: 'Executive Haircut',
    durationMinutes: 30,
  });

  return { business, service };
};

const join = async (shop, name) => {
  const res = await call(queueController.joinQueue, {
    body: {
      businessId: shop.business._id.toString(),
      serviceId: shop.service._id.toString(),
      customerName: name,
    },
  });

  assert.equal(res.statusCode, 201, res.payload?.message);
  return res.payload.data;
};

const countServing = (businessId) =>
  Queue.countDocuments({ businessId, status: 'SERVING' });

test('the first customer is promoted immediately and the rest wait in FIFO order', async () => {
  const shop = await createShop();

  const first = await join(shop, 'Maya Lin');
  assert.equal(first.status, 'SERVING');

  const second = await join(shop, 'Maya Lin');
  const third = await join(shop, 'Yves Kamanzi');
  assert.equal(second.status, 'WAITING');
  assert.equal(third.status, 'WAITING');

  // The regression that started all of this: two customers served at once.
  assert.equal(await countServing(shop.business._id), 1);

  const started = await Queue.findById(first.queueId);
  assert.ok(started.expectedEndAt > new Date(), 'served ticket needs a future expectedEndAt');
});

test('place in line is 1-based and counts the customer at the desk', async () => {
  const shop = await createShop();
  await join(shop, 'Maya Lin');

  const second = await join(shop, 'Maya Lin');
  const third = await join(shop, 'Yves Kamanzi');

  const two = await call(queueController.getQueueStatus, { params: { id: second.queueId } });
  assert.equal(two.payload.data.placeInLine, 2);
  assert.equal(two.payload.data.peopleAhead, 1);

  const three = await call(queueController.getQueueStatus, { params: { id: third.queueId } });
  assert.equal(three.payload.data.placeInLine, 3);
  assert.equal(three.payload.data.peopleAhead, 2);

  // A waiting customer must never be shown as #0 or "-1 customers ahead".
  assert.ok(three.payload.data.placeInLine > 0);
});

test('the expiry sweep completes the served ticket and calls the next customer', async () => {
  const shop = await createShop();
  const first = await join(shop, 'Maya Lin');
  const second = await join(shop, 'Maya Lin');
  const third = await join(shop, 'Yves Kamanzi');

  await Queue.updateOne(
    { _id: first.queueId },
    { expectedEndAt: new Date(Date.now() - 60 * 1000) }
  );

  await engine.processQueueTick(null);

  const done = await Queue.findById(first.queueId);
  assert.equal(done.status, 'COMPLETED');
  assert.ok(done.completedAt, 'completedAt must be stamped');
  assert.ok(done.actualDurationMinutes >= 1, 'actual duration must be computed');

  const promoted = await Queue.findById(second.queueId);
  assert.equal(promoted.status, 'SERVING');
  assert.ok(promoted.startedAt, 'startedAt must be stamped');
  assert.ok(promoted.expectedEndAt > new Date(), 'promotion must set a fresh expected end');

  const stillWaiting = await Queue.findById(third.queueId);
  assert.equal(stillWaiting.status, 'WAITING');
  assert.equal(stillWaiting.estimatedWaitMinutes, 30, 'wait behind a 30m service must be 30m');

  assert.equal(await countServing(shop.business._id), 1);
});

test('a ticket that is already served does not hold an expired one behind it', async () => {
  const shop = await createShop();
  const first = await join(shop, 'Maya Lin');
  const second = await join(shop, 'Maya Lin');

  await Queue.updateOne(
    { _id: first.queueId },
    { expectedEndAt: new Date(Date.now() - 60 * 1000) }
  );

  // Two ticks racing for the same desk is the shape that double-promotes.
  await Promise.all([engine.processQueueTick(null), engine.processQueueTick(null)]);

  assert.equal(await countServing(shop.business._id), 1);
  assert.equal((await Queue.findById(second.queueId)).status, 'SERVING');
});

test('the request-path tick is throttled per warm instance', async () => {
  await engine.maybeProcessQueueTick(null);
  const throttled = await engine.maybeProcessQueueTick(null);
  assert.equal(throttled, null, 'a second tick inside 5s must be skipped');
});

test('staff can complete the current service and the next customer is called', async () => {
  const shop = await createShop();
  const first = await join(shop, 'Maya Lin');
  const second = await join(shop, 'Diane Uwase');

  const result = await engine.completeCurrentService(shop.business._id, first.queueId, null);

  assert.equal(result.completed.status, 'COMPLETED');
  assert.equal(result.nextServing.status, 'SERVING');
  assert.equal(result.nextServing.queueNumber, second.queueNumber);
  assert.equal(await countServing(shop.business._id), 1);

  await assert.rejects(
    () => engine.completeCurrentService(shop.business._id, first.queueId, null),
    /not SERVING/
  );
});

test('staff cannot complete a ticket belonging to another business', async () => {
  const mine = await createShop();
  const theirs = await createShop();

  const ticket = await join(theirs, 'Maya Lin');

  await assert.rejects(
    () => engine.completeCurrentService(mine.business._id, ticket.queueId, null),
    /not found/
  );

  assert.equal((await Queue.findById(ticket.queueId)).status, 'SERVING');
});

test('a customer can be found by name and see their place in line', async () => {
  const shop = await createShop();
  await join(shop, 'Maya Lin');
  const waiting = await join(shop, 'Maya Lin');

  const res = await call(queueController.trackQueue, { body: { query: 'Maya' } });

  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.count, 2);

  const served = res.payload.data.matches.find((m) => m.status === 'SERVING');
  assert.equal(served.placeInLine, 0, 'someone being served is not waiting in line');

  const inLine = res.payload.data.matches.find((m) => m.queueNumber === waiting.queueNumber);
  assert.equal(inLine.placeInLine, 2);
  assert.equal(inLine.peopleAhead, 1);
  assert.equal(inLine.nowServing, 'K001');
  assert.equal(inLine.totalWaiting, 1);
  assert.equal(inLine.business.name, 'Kibali Salon');
});

test('a customer can be found by ticket number, however they type it', async () => {
  const shop = await createShop();
  await join(shop, 'Maya Lin');
  await join(shop, 'Maya Lin');
  const third = await join(shop, 'Yves Kamanzi');

  for (const typed of ['K003', 'k003', ' k003 ']) {
    const res = await call(queueController.trackQueue, { body: { query: typed } });
    assert.equal(res.payload.count, 1, `"${typed}" should find exactly one ticket`);
    assert.equal(res.payload.data.matches[0].queueNumber, third.queueNumber);
    assert.equal(res.payload.data.matches[0].placeInLine, 3);
  }
});

test('tracking never exposes a phone number and drops finished tickets', async () => {
  const shop = await createShop();
  const ticket = await join(shop, 'Maya Lin');

  await engine.completeCurrentService(shop.business._id, ticket.queueId, null);

  const res = await call(queueController.trackQueue, { body: { query: 'Maya' } });
  assert.equal(res.payload.count, 0, 'a completed ticket is no longer trackable');
  assert.ok(!JSON.stringify(res.payload).includes('phone'));
});

test('tracking rejects junk input instead of scanning the whole queue', async () => {
  const short = await call(queueController.trackQueue, { body: { query: 'a' } });
  assert.equal(short.statusCode, 400);

  const long = await call(queueController.trackQueue, { body: { query: 'x'.repeat(61) } });
  assert.equal(long.statusCode, 400);

  const nothing = await call(queueController.trackQueue, { body: { query: 'Nobody Here' } });
  assert.equal(nothing.statusCode, 200);
  assert.equal(nothing.payload.count, 0);
});

test('a regex in the search box is treated as text, not a pattern', async () => {
  const shop = await createShop();
  await join(shop, 'Maya Lin');

  const res = await call(queueController.trackQueue, { body: { query: '.*' } });
  assert.equal(res.statusCode, 200);
  assert.equal(res.payload.count, 0, 'a wildcard must not match everything');
});

test('the staff console returns the desk, the line and today\'s completed tickets', async () => {
  const shop = await createShop();
  const first = await join(shop, 'Maya Lin');
  const second = await join(shop, 'Diane Uwase');

  await engine.completeCurrentService(shop.business._id, first.queueId, null);

  const res = await call(queueController.getBusinessActiveQueue, {
    user: { businessId: shop.business._id },
  });

  assert.equal(res.payload.data.currentServing.queueNumber, second.queueNumber);
  assert.equal(res.payload.data.waitingList.length, 0);
  assert.equal(res.payload.data.recentlyCompleted.length, 1);
  assert.equal(res.payload.data.totalWaiting, 0);
});

test('wait estimates shrink as the line moves', async () => {
  const shop = await createShop();
  const first = await join(shop, 'Maya Lin');
  const second = await join(shop, 'Diane Uwase');
  const third = await join(shop, 'Yves Kamanzi');

  // Everyone waits 30m for the desk plus one 30m service each in front of them.
  assert.equal((await Queue.findById(second.queueId)).estimatedWaitMinutes, 30);
  assert.equal((await Queue.findById(third.queueId)).estimatedWaitMinutes, 60);

  await engine.completeCurrentService(shop.business._id, first.queueId, null);

  assert.equal((await Queue.findById(third.queueId)).estimatedWaitMinutes, 30);
});
