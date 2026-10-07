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
