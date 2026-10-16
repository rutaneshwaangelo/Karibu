# KARIBU – Smart Queue Management System
> *Pick your place before you arrive.* ❤️

KARIBU is a multi-business smart queue management platform designed to eliminate unnecessary physical waiting rooms and bring automated, professional queueing to businesses.

---

## 🌟 Key Highlights

- **Zero-Friction Customer Experience**: Customers do not authenticate. They find a business, select a service, enter their name, and receive a live digital ticket (`K001`, `K002`...).
- **Automatic Queue Engine**: The backend is the source of truth. The server computes service durations, manages live countdowns, automatically completes expired services, and auto-promotes the next waiting customer without manual button-pressing.
- **Staff Time Adjustment (+5, +10, +15, −5, −10 min)**: Staff can dynamically extend or shorten the current service duration when reality requires it. The system immediately recalculates waiting times for all subsequent customers in line.
- **Strict Multi-Tenant Isolation**: Business data (queues, services, staff, profile) is strictly partitioned by `businessId` verified at the backend database query level.
- **Real-Time Architecture**: Powered by Socket.IO with automatic room routing (`business:{id}` and `queue:{id}`) and a reliable polling safety net.
- **Modern High-End Aesthetics**: Pure Vanilla CSS design system with rich dark surfaces (`#090D16`), warm amber brand gradients (`#F59E0B`), and active pulse emerald indicators (`#10B981`).

---

## 📁 Project Structure

```
karibu/
├── backend/
│   ├── config/          # MongoDB Mongoose connection
│   ├── controllers/     # Auth, Admin, Business, Staff, Queue, Services
│   ├── middleware/      # JWT verifyToken, requireRole, verifyBusinessAccess
│   ├── models/          # 8 Mongoose models (User, Business, Category, Service, Queue, Customer, OpeningHours, Subscription)
│   ├── routes/          # Express API route declarations
│   ├── services/        # Automatic Queue Engine (5s tick, time adjustment, wait time recalculations)
│   ├── utils/           # Database seeder (seedAdmin.js) & JWT generator
│   ├── server.js        # Express & Socket.IO server entry point
│   ├── .env             # Environment configuration
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/  # Navbar, LoginModal, CountdownTimer, StatusBadge, TimeAdjustCluster
│   │   ├── context/     # AuthContext with token & role persistence
│   │   ├── hooks/       # useSocket custom hook
│   │   ├── pages/
│   │   │   ├── customer/# CustomerHome, JoinQueueModal, CustomerQueueStatus
│   │   │   ├── staff/   # StaffDashboard console
│   │   │   ├── business/# BusinessOwnerDashboard (Dashboard, Services, Staff, Hours, Profile, Subscription)
│   │   │   └── admin/   # AdminDashboard (KPIs, Register Business, Categories, Users, Queues, Reports)
│   │   ├── services/    # api.js fetch client with auth interceptor
│   │   ├── App.jsx      # Main application assembly
│   │   ├── index.css    # Comprehensive Vanilla CSS design system
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

---

## 🚀 Running the Project Locally

### Prerequisites
- Node.js (v18+)
- MongoDB running locally on `mongodb://127.0.0.1:27017`

### 1. Backend Setup
```bash
cd karibu/backend
npm install
npm run seed     # Seeds default Platform Admin and 5 business categories
npm run dev      # Runs Express + Socket.IO API on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd karibu/frontend
npm install
npm run dev      # Runs Vite dev server on http://localhost:5173
```

---

## 🔑 Demo Login Credentials

The application includes **1-Click Demo Autofill** in the login modal for effortless evaluation:

| Role | Email | Password |
|---|---|---|
| **System Admin** | `admin@karibu.com` | `Admin@Karibu2026!` |
| **Business Owner** | `john@kibalisalon.com` | `SalonPass2026!` |
| **Staff Member** | `sarah@kibalisalon.com` | `StaffPass2026!` |

---

## 🧪 Testing the Core Queue Engine Workflow

1. Open `http://localhost:5173/` in your browser.
2. Under "All Businesses", select **Kibali Executive Salon & Barber**.
3. Click **Select Business & Join Queue**.
4. Choose **Executive Haircut (30 min)**, enter your name, and click **Confirm & Get Queue Ticket**.
5. You will receive ticket **K003** (or sequential) with a live real-time countdown timer and status badge.
6. Open an incognito window or click **Staff / Admin Login** in the top navbar.
7. Click **Staff** autofill and log in.
8. In the **Live Service Console**, observe the active customer countdown and click **+5 min** or **+10 min** to test dynamic service duration adjustment.
9. Watch the waiting customer's estimated wait time update automatically!
"# Karibu" 

---

## 📋 Non-Functional Requirements

This section documents the **Requirement, Scalability, Security, Performance and Functionality** characteristics of KARIBU, and the engineering work done to hold them in production on Vercel.

### 1. Requirement

| ID | Category | Requirement | Satisfied by |
|----|----------|-------------|--------------|
| R1 | Functional | A customer can join a queue without an account and receive a daily sequential ticket (`K001`, `K002`…) | `POST /api/customer/queue/join`, `generateQueueNumber()` |
| R2 | Functional | The queue advances automatically — expired services are completed and the next customer is promoted with no manual action | `services/queueEngine.js` (`processQueueTick`, `promoteNextCustomer`) |
| R3 | Functional | Staff can extend/shorten the active service (+5/+10/+15/−5/−10 min) and every downstream wait estimate recalculates immediately | `adjustServiceTime()`, `recalculateWaitTimes()` |
| R4 | Functional | Customers see live ticket status, position and countdown | `GET /api/customer/queue/:id`, Socket.IO + polling fallback |
| R5 | Functional | Three isolated portals exist: Customer (public), Staff/Owner, Platform Admin | `routes/*`, role guards in `middleware/auth.js` |
| R6 | Non-functional | Multi-tenant data must never leak between businesses | `verifyBusinessAccess`, every query scoped by `businessId` |
| R7 | Non-functional | Repeated visits must be fast and cheap to serve | Immutable hashed-asset caching, compression, code splitting |
| R8 | Non-functional | The platform must survive spikes in concurrent queue activity without a rewrite | Stateless API, capped connection pool, indexed queries |
| R9 | Non-functional | Credentials and tenant data must be protected against common attacks | bcrypt, JWT, helmet, rate limiting, CORS allowlist, body-size limits |
| R10 | Non-functional | The system must remain correct on a serverless host with no long-lived process | Cached DB connection, opportunistic queue tick, secured cron |
| R11 | Functional | A customer who lost their ticket link can find it again by name or ticket number and see their place in the line | `POST /api/customer/queue/track`, `computePlaceInLine()` |
| R12 | Functional | Staff can finish the current service immediately and call the next customer without waiting for the timer | `completeCurrentService()`, `POST /api/staff/queue/:id/complete` |

### 2. Performance

**Frontend — route-level code splitting.** Only the landing shell is needed for the first paint; the customer flow and the three dashboards are now separate chunks loaded on demand (`frontend/src/App.jsx`). Vendor code is split into cache-stable chunks (`frontend/vite.config.js`) so a deploy does not invalidate React in the browser cache.

**Backend — compression.** `compression()` is enabled on the API. Measured on a representative list response:

| Response | Bytes |
|---|---|
| `GET /api/customer/businesses` (uncompressed) | 7,773 |
| Same response, `Accept-Encoding: gzip` | **609** (−92%) |

**Database — indexing.** Queue reads are served by dedicated compound indexes, so the hot paths (find the `SERVING` entry, list `WAITING` in order, scan expired services) do not fall back to collection scans:

```
{ businessId: 1, status: 1 }
{ status: 1, expectedEndAt: 1 }   // drives the queue-engine expiry sweep
{ businessId: 1, joinedAt: 1 }    // drives FIFO ordering
{ businessId: 1, queueNumber: 1 }
```

**Database — connection reuse.** `config/db.js` caches the connection promise. On a serverless host this turns a per-request TLS handshake into a reused pool, and coalesces concurrent cold-start requests onto a single connection attempt.

**Measured bundle impact** (Vite production build, gzip):

| | Before | After | Change |
|---|---|---|---|
| First-paint JS + CSS (raw) | 396.81 kB | 274.99 kB | **−30.7%** |
| First-paint JS + CSS (gzip) | 110.87 kB | 86.15 kB | **−22.3%** |
| Heaviest single chunk (raw) | 379.42 kB | 211.00 kB | −44.4% |

The Home-page ticket tracker (R11) is the one addition to that critical path: first paint measures **282.65 kB raw / 88.08 kB gzip** with it (−28.8% / −20.6% versus the original 396.81 kB / 110.87 kB). It polls only while a lookup is on screen.

Dashboards and the Socket.IO client are no longer in the critical path — they download only when that view is opened (Admin 23.0 kB, Owner 28.5 kB, Staff 12.6 kB, Socket.IO 41.2 kB raw).

### 3. Scalability

- **Stateless API.** Every request carries its own JWT; no session state is held in the Node process, so the API scales horizontally by adding instances.
- **Bounded connection pool.** `maxPoolSize: 10` per instance with `minPoolSize: 0`. Because serverless platforms create many short-lived instances, an uncapped pool would exhaust the database's connection limit under load — the cap keeps total connections predictable.
- **Fail-fast instead of queueing.** `bufferCommands: false` means an unreachable database produces a prompt `503` rather than requests piling up and timing out.
- **Tenant-partitioned reads.** Every queue query is scoped by `businessId` and covered by a compound index, so one busy business does not slow down reads for others.
- **Throttled serverless tick.** The opportunistic queue tick is coalesced and limited to one run per 5s per warm instance, so a traffic burst does not multiply into a burst of queue-engine work.
- **Compression offloads bandwidth.** A ~92% smaller JSON payload directly reduces egress and mobile transfer time as concurrency grows.

### 4. Security

| Control | Implementation |
|---|---|
| Password storage | `bcryptjs` hashing, never reversible |
| Authentication | Signed JWT (`jsonwebtoken`); `verifyToken` re-loads the user each request and rejects deactivated accounts |
| Authorization | `requireRole(...)` for ADMIN / BUSINESS_OWNER / STAFF |
| Tenant isolation | `verifyBusinessAccess` rejects cross-business access and verifies the business is `ACTIVE` |
| Security headers | `helmet` on the API (HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, CORP, COOP…) plus matching headers on static assets via `vercel.json` |
| Brute-force protection | `express-rate-limit`: **20 login attempts / 15 min** per client (verified: attempt 21 returns `429`) |
| Abuse protection | Global **300 requests / min** per client (`apiLimiter`) |
| Body-size limits | `100kb` cap on JSON and urlencoded payloads |
| CORS | Explicit allowlist from `CLIENT_URL` (comma-separated); unknown origins are rejected instead of reflected |
| Cron endpoint | Fail-closed: requires `Authorization: Bearer $CRON_SECRET`; if the secret is unset the endpoint returns `503` and never runs |
| Error hygiene | Stack traces are returned only when `NODE_ENV=development` |

### 5. Functionality

The queue engine is the heart of the system and previously **did not run in production**: it was gated behind `NODE_ENV !== 'production'`, so on Vercel nothing ever auto-completed or auto-promoted. That is now resolved with three complementary mechanisms:

1. **Timer engine** (`startQueueEngine`) — unchanged, running wherever a long-lived process exists (local dev, self-hosted, Docker).
2. **Opportunistic tick** (`maybeProcessQueueTick`) — called by the customer status and staff console read paths, throttled to one run per 5s per warm instance. This is what keeps the queue live on Vercel, where the HTTP handler is the only code that runs.
3. **Secured cron endpoint** (`GET /api/cron/queue-tick`) — a safety net that sweeps expired services even when nobody has the app open.

The desk is never a hostage of the clock: `POST /api/staff/queue/:id/complete` finishes the customer at the desk immediately and promotes the next one through the same `completeQueueEntry()` bookkeeping the timer uses. Both paths are covered by the request-path tick, including the public ticket lookup, so a place in line is never returned from a stale queue.

Verified end-to-end against a live database (10/10 checks): an expired `SERVING` entry is auto-completed with a computed `actualDurationMinutes`, the next `WAITING` customer is promoted with a fresh `expectedEndAt`, remaining waits are recalculated, and a single tick never double-promotes.

### 6. Production Configuration

Set these in the Vercel project (**Settings → Environment Variables**):

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Signing key for auth tokens |
| `JWT_EXPIRE` | Token lifetime, e.g. `24h` |
| `CLIENT_URL` | Allowed browser origin(s); comma-separate to allow preview deployments |
| `CRON_SECRET` | Shared secret authenticating the queue-tick cron. Generate with:<br>`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `NODE_ENV` | `production` |

> **Package manager:** the backend used npm (`.package-lock.json` present). A stale `pnpm-lock.yaml` was left in the repository and has been removed — with both lockfiles present a host may install a dependency tree that does not match `package.json`.

### 7. Known Limitations

These are documented rather than hidden, because each one is a deliberate trade-off:

- **Socket.IO requires a persistent server.** Vercel's serverless functions cannot hold WebSocket connections open, so on Vercel the real-time layer is unavailable and clients automatically fall back to the polling safety net (`CustomerQueueStatus` every 8s, `StaffDashboard` every 6s). Real-time is fully functional when the API runs on a long-lived host. To get pushed updates on serverless, the API would need to move to a host with persistent connections (or a managed realtime service).
- **Vercel Cron on the Hobby plan runs at most once per day.** The schedule is therefore a daily safety sweep (`0 3 * * *`); a more frequent expression would fail the deployment on Hobby. Tighten it on a Pro plan if you want faster background sweeps - the queue still stays live regardless, via the read-path tick.
- **Rate-limit counters are per instance** on a serverless host, so the effective limit is higher than the configured number when many instances are warm. A shared store (e.g. Redis) would make it global.
- **The 5s tick throttle is per warm instance**, so the tick can run slightly more often than once per 5s while instances are scaling up. This is intentional: it favours freshness over strict tick accounting.

