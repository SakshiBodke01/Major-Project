# DriveGuard AI - REST API Specification

This document details the central telemetry REST API specification for DriveGuard AI. All endpoints operate over HTTP/HTTPS, exchange JSON formatted payloads, and conform to standardized response envelopes.

---

## 📬 Standard Response Envelope Format

### 1. Success Response (`HTTP 200 OK` / `HTTP 201 Created`)
```json
{
  "success": true,
  "data": { ... },
  "message": "Human-readable status summary",
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  },
  "timestamp": "2026-10-12T10:05:00.000Z"
}
```

### 2. Error Response (`HTTP 400` / `404` / `409` / `500`)
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    { "field": "driverId", "message": "driverId is required" }
  ],
  "timestamp": "2026-10-12T10:05:00.000Z"
}
```

---

## 🚦 Status Codes & Error Conventions

| HTTP Status | Semantic Meaning | Common Trigger |
| :--- | :--- | :--- |
| `200 OK` | Request succeeded | Queries, updates, health checks |
| `201 Created` | Resource created | Driver registered, trip started, risk event logged |
| `400 Bad Request` | Validation failure | Missing required fields, invalid coordinate ranges |
| `404 Not Found` | Resource absent | Non-existent `driverId` or `tripId` |
| `409 Conflict` | Idempotency violation | Duplicate `eventId` re-submission attempt |
| `500 Server Error`| Internal fault | Database failure, unhandled runtime exception |

---

## 🚗 API Endpoints Reference

### 1. System Health & Diagnostics

#### `GET /api/health`
Evaluates API process health, memory usage, uptime, and database connectivity.
- **Response**: `200 OK`
```json
{
  "success": true,
  "message": "Server status: UP",
  "data": {
    "status": "UP",
    "uptimeSec": 128,
    "memoryUsage": { "rssMb": 54, "heapTotalMb": 32, "heapUsedMb": 21 },
    "database": {
      "status": "connected",
      "readyState": 1,
      "host": "localhost",
      "name": "driver_monitoring_db",
      "isConnected": true
    }
  },
  "timestamp": "2026-10-12T10:05:00.000Z"
}
```

#### `GET /api/version`
Returns API service name, environment, and semantic version.
- **Response**: `200 OK`

---

### 2. Driver Management

#### `POST /api/drivers`
Registers a new fleet driver with an initial baseline safety rating of `100`.
- **Request Body**:
  ```json
  {
    "driverId": "DRV_101",
    "name": "Alex Mercer",
    "phone": "+1-555-0199",
    "status": "ACTIVE"
  }
  ```
- **Response**: `201 Created`

#### `GET /api/drivers`
Retrieves a paginated roster of fleet drivers.
- **Query Parameters**:
  - `page` *(optional, default: 1)*
  - `limit` *(optional, default: 20)*
- **Response**: `200 OK`

#### `GET /api/drivers/:id`
Retrieves a specific driver record by `driverId`.
- **Response**: `200 OK`

---

### 3. Trip Session Lifecycle

#### `POST /api/trips`
Initiates a new driver monitoring session. Sets driver status to `ON_TRIP` and initializes trip score to `100`.
- **Request Body**:
  ```json
  {
    "tripId": "TRIP_20261012_01",
    "driverId": "DRV_101",
    "startingLocation": {
      "latitude": 37.7749,
      "longitude": -122.4194,
      "speedKmh": 0,
      "address": "SF Logistics Hub"
    }
  }
  ```
- **Response**: `201 Created`

#### `GET /api/trips`
Retrieves a paginated list of recorded trips.
- **Query Parameters**: `page`, `limit`
- **Response**: `200 OK`

#### `GET /api/trips/active`
Retrieves all currently active trips (`status === 'ACTIVE'`).
- **Response**: `200 OK`

#### `GET /api/trips/:id`
Retrieves full details for a trip, including final score and GPS waypoints.
- **Response**: `200 OK`

#### `PATCH /api/trips/:id/finish`
Concludes a trip session, records destination coordinates and final score, updates trip status to `COMPLETED`, and restores driver status to `ACTIVE`.
- **Request Body**:
  ```json
  {
    "endingLocation": {
      "latitude": 37.8044,
      "longitude": -122.2712,
      "speedKmh": 0,
      "address": "Oakland Delivery Terminal"
    },
    "finalScore": 75
  }
  ```
- **Response**: `200 OK`

---

### 4. Edge Telemetry & Risk Events

#### `POST /api/risk-events`
Ingests an edge-detected risk violation event. Applies score deduction, clamps score `[0, 100]`, and creates a score snapshot.
- **Idempotency**: Enforced using unique `eventId`. If `eventId` already exists in the database, returns `HTTP 409 Conflict` without deducting score twice.
- **Privacy Sanitization**: Any base64 string fields exceeding 500 characters in `metadata` are stripped.
- **Request Body**:
  ```json
  {
    "eventId": "EVT_550e8400-e29b-41d4-a716-446655440000",
    "tripId": "TRIP_20261012_01",
    "driverId": "DRV_101",
    "type": "DROWSINESS",
    "severity": "CRITICAL",
    "pointsDeducted": 30,
    "latitude": 37.7750,
    "longitude": -122.4195,
    "confidence": 0.94,
    "metadata": {
      "earScore": 0.16,
      "closureDurationMs": 1800
    }
  }
  ```
- **Supported Event Types**: `DROWSINESS` (`-30`), `PHONE_USE` / `PHONE` (`-25`), `DISTRACTION` (`-20`), `YAWNING` (`-10`).
- **Response**: `201 Created` (or `409 Conflict` if duplicate `eventId`)

#### `GET /api/risk-events/trip/:tripId`
Retrieves chronological risk events recorded for a trip.
- **Query Parameters**: `page`, `limit`
- **Response**: `200 OK`

---

### 5. Score History Snapshots

#### `GET /api/score-snapshots/trip/:tripId`
Retrieves the timeline of score reductions for a trip to plot degradation curves on the dashboard.
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": [
    { "tripId": "TRIP_20261012_01", "score": 100, "reason": "TRIP_START", "timestamp": "2026-10-12T08:00:00Z" },
    { "tripId": "TRIP_20261012_01", "score": 70, "reason": "EVENT_DROWSINESS", "timestamp": "2026-10-12T08:05:00Z" },
    { "tripId": "TRIP_20261012_01", "score": 45, "reason": "EVENT_PHONE", "timestamp": "2026-10-12T08:14:00Z" }
  ]
}
```

---

### 6. Fleet Analytics & Reporting

#### `GET /api/analytics/overview`
Retrieves aggregated fleet performance metrics.
- **Query Parameters**:
  - `driverId` *(optional, filters metrics for single driver)*
  - `startDate` *(optional, ISO 8601)*
  - `endDate` *(optional, ISO 8601)*
- **Response**: `200 OK`
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalTrips": 24,
      "activeTrips": 3,
      "totalRiskEvents": 36,
      "avgFleetScore": 86,
      "avgTripScore": 82,
      "driverCount": 8
    },
    "eventTypeDistribution": {
      "DROWSINESS": 8,
      "PHONE": 14,
      "DISTRACTION": 6,
      "YAWNING": 8
    },
    "severityDistribution": {
      "CRITICAL": 8,
      "HIGH": 14,
      "MEDIUM": 8,
      "LOW": 6
    }
  }
}
```
