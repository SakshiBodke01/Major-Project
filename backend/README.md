# DriveGuard AI - Backend REST API & Telemetry Server

Production-grade, privacy-focused central telemetry server for DriveGuard AI built with **Node.js**, **Express.js**, and **MongoDB** (with automatic in-memory fallback store).

---

## 🚀 Subsystem Highlights

- **Dual-Mode Persistence**: Primary online storage in MongoDB with automatic in-memory fallback when MongoDB is unavailable, enabling standalone unit and integration testing without daemon dependencies.
- **Strict Privacy Invariants**: Automatically strips base64 payloads exceeding 500 characters or containing raw video/image frames to guarantee zero visual data storage.
- **UUID Idempotency Enforcement**: Re-submitting existing `eventId` triggers `HTTP 409 Conflict`, preventing duplicate deductions.
- **Dynamic Score Deduction Sync**: Enforces standardized deduction penalties (`-30` Drowsiness, `-25` Phone Use, `-20` Distraction, `-10` Yawning) and records chronological score snapshots.
- **Fleet Analytics Engine**: Aggregates fleet-wide trips, driver safety ratings, event type breakdowns, and severity distributions.

---

## 📁 Architecture & Directory Structure

```text
backend/
├── src/
│   ├── config/
│   │   ├── db.js                      # MongoDB Mongoose connection & shutdown handler
│   │   └── env.js                     # Environment variable validation & defaults
│   ├── controllers/
│   │   ├── driver.controller.js       # Driver registration & querying
│   │   ├── trip.controller.js         # Trip start, lifecycle & finish
│   │   ├── riskEvent.controller.js    # Edge telemetry event ingestion
│   │   ├── scoreSnapshot.controller.js# Score history snapshot queries
│   │   ├── analytics.controller.js    # Aggregated fleet analytics
│   │   ├── health.controller.js       # System health & ready-state checks
│   │   └── version.controller.js      # API versioning metadata
│   ├── middlewares/
│   │   ├── error.middleware.js        # Central error handler with sanitized JSON envelopes
│   │   ├── logger.middleware.js       # HTTP request logger (method, route, latency, IP)
│   │   └── validate.middleware.js     # Schema validation for incoming request payloads
│   ├── models/
│   │   ├── Driver.js                  # Mongoose schema for drivers
│   │   ├── Trip.js                    # Mongoose schema for trips & GPS coordinates
│   │   ├── RiskEvent.js               # Mongoose schema for edge risk events
│   │   └── ScoreSnapshot.js           # Mongoose schema for score deduction history
│   ├── routes/
│   │   ├── driver.routes.js           # /api/drivers
│   │   ├── trip.routes.js             # /api/trips
│   │   ├── riskEvent.routes.js        # /api/risk-events
│   │   ├── scoreSnapshot.routes.js    # /api/score-snapshots
│   │   ├── analytics.routes.js        # /api/analytics
│   │   ├── health.routes.js           # /api/health
│   │   └── version.routes.js          # /api/version
│   ├── services/                      # Business logic & hybrid persistence layers
│   │   ├── driver.service.js
│   │   ├── trip.service.js
│   │   ├── riskEvent.service.js
│   │   ├── scoreSnapshot.service.js
│   │   └── analytics.service.js
│   ├── utils/
│   │   ├── responseHandler.js         # Standard JSON response envelope format
│   │   └── validator.js               # Payload validation rules
│   ├── app.js                         # Express application setup & middleware assembly
│   └── server.js                      # HTTP server listener & graceful shutdown
├── test-end-to-end-integration.js     # 8-phase full integration test suite
├── test-telemetry-module.js           # Telemetry API and idempotency verification
├── test-analytics-module.js           # Fleet analytics aggregation filter tests
├── test-server.js                     # Server health & route sanity checks
└── package.json
```

---

## 🛠 Local Setup Instructions

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- **MongoDB** (Optional: local daemon at `mongodb://localhost:27017` or MongoDB Atlas; in-memory fallback activates automatically if unavailable)

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Configure Environment Variables
Create or verify `.env` in the `/backend` directory:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/driver_monitoring_db
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
LOG_LEVEL=info
```

### Step 3: Start Server
- **Development Mode** (with automatic reload):
  ```bash
  npm run dev
  ```
- **Production Mode**:
  ```bash
  npm start
  ```
- API Base URL: `http://localhost:5000/api`

---

## 📡 Core API Endpoints Reference

### 1. System & Health
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Uptime, memory usage, and MongoDB connection status |
| `GET` | `/api/version` | API metadata and environment information |

### 2. Driver Management
| Method | Endpoint | Request Body / Parameters | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/drivers` | `{ driverId, name, phone, status }` | Register a new driver (Default status: `ACTIVE`, Score: `100`) |
| `GET` | `/api/drivers` | Query: `page`, `limit` | Retrieve paginated driver list |
| `GET` | `/api/drivers/:id` | Param: `driverId` | Retrieve driver details by ID |

### 3. Trip Lifecycle Management
| Method | Endpoint | Request Body / Parameters | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/trips` | `{ tripId, driverId, startingLocation }` | Start a new trip. Sets driver status to `ON_TRIP` and score to `100` |
| `GET` | `/api/trips` | Query: `page`, `limit` | Paginated list of all trips |
| `GET` | `/api/trips/active`| None | List currently monitored active trips |
| `GET` | `/api/trips/:id` | Param: `tripId` | Retrieve trip details, final score, and GPS trail |
| `PATCH`| `/api/trips/:id/finish` | `{ endingLocation, finalScore }` | Conclude trip, mark `COMPLETED`, and restore driver to `ACTIVE` |

### 4. Edge Telemetry & Risk Events
| Method | Endpoint | Request Body / Parameters | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/risk-events` | `{ eventId, tripId, driverId, type, severity, pointsDeducted, latitude, longitude, metadata }` | Ingest edge risk event. Applies score deduction and saves score snapshot. Enforces idempotency via unique `eventId` (`HTTP 409` on duplicate). |
| `GET` | `/api/risk-events/trip/:tripId` | Param: `tripId`, Query: `page`, `limit` | Retrieve chronological risk events for trip |

### 5. Score History Snapshots
| Method | Endpoint | Request Body / Parameters | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/score-snapshots/trip/:tripId` | Param: `tripId` | Historical timeline of score deductions for trip |

### 6. Fleet Analytics
| Method | Endpoint | Request Body / Parameters | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/analytics/overview` | Query: `startDate`, `endDate`, `driverId` | Aggregated fleet KPIs, safety averages, event distribution, and severity breakdown |

---

## 🧪 Automated Testing

The backend includes comprehensive automated integration test scripts that do not require external test runners:

```bash
# 1. Full 8-Phase End-to-End Integration Test
node test-end-to-end-integration.js

# 2. Telemetry Ingestion & Idempotency Test
node test-telemetry-module.js

# 3. Fleet Analytics Aggregation Test
node test-analytics-module.js

# 4. Server Sanity & Route Check
node test-server.js
```
