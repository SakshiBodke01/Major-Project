# DriveGuard AI - REST API Specification

All API requests and responses use JSON formatting and return a standardized envelope structure.

---

## 📬 Standard Response Envelope Format

### Success Response (`HTTP 200 / 201`)
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
  "timestamp": "2026-09-06T11:00:00.000Z"
}
```

### Error Response (`HTTP 400 / 404 / 409 / 500`)
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    { "field": "driverId", "message": "driverId is required" }
  ],
  "timestamp": "2026-09-06T11:00:00.000Z"
}
```

---

## 🚗 API Endpoints Reference

### 1. Driver Management

#### `POST /api/drivers`
Registers a new fleet driver.
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
Retrieves a paginated list of drivers.
- **Query Params**: `page`, `limit`
- **Response**: `200 OK`

#### `GET /api/drivers/:id`
Retrieves a single driver by ID.
- **Response**: `200 OK`

---

### 2. Trip Session Management

#### `POST /api/trips`
Starts a new driver trip session. Initial score starts at `100`.
- **Request Body**:
  ```json
  {
    "tripId": "TRIP_20260906_01",
    "driverId": "DRV_101",
    "startingLocation": {
      "latitude": 37.7749,
      "longitude": -122.4194,
      "speedKmh": 0,
      "address": "SF Fleet Hub"
    }
  }
  ```
- **Response**: `201 Created`

#### `GET /api/trips`
Retrieves all recorded trips.
- **Query Params**: `page`, `limit`
- **Response**: `200 OK`

#### `GET /api/trips/active`
Retrieves active monitored trips (`status === 'ACTIVE'`).
- **Response**: `200 OK`

#### `GET /api/trips/:id`
Retrieves a specific trip record by ID.
- **Response**: `200 OK`

#### `PATCH /api/trips/:id/finish`
Concludes a trip session.
- **Request Body**:
  ```json
  {
    "endingLocation": {
      "latitude": 37.8044,
      "longitude": -122.2712,
      "speedKmh": 0
    },
    "finalScore": 75
  }
  ```
- **Response**: `200 OK`

---

### 3. Risk Event Ingestion

#### `POST /api/risk-events`
Ingests an edge-detected risk event.
- **Request Body**:
  ```json
  {
    "eventId": "EVT_550e8400-e29b-41d4-a716-446655440000",
    "tripId": "TRIP_20260906_01",
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
- **Response**: `201 Created` (Returns `409 Conflict` if `eventId` already exists).

#### `GET /api/risk-events/trip/:tripId`
Retrieves all risk events for a specific trip.
- **Response**: `200 OK`

---

### 4. Score History & Analytics

#### `GET /api/score-snapshots/trip/:tripId`
Retrieves historical score deduction snapshots for a trip.
- **Response**: `200 OK`

#### `GET /api/analytics/overview`
Retrieves aggregated fleet analytics.
- **Query Params**: `startDate`, `endDate`, `driverId`
- **Response**: `200 OK`
  ```json
  {
    "success": true,
    "data": {
      "summary": {
        "totalTrips": 12,
        "activeTrips": 2,
        "totalRiskEvents": 18,
        "avgFleetScore": 88,
        "avgTripScore": 84,
        "driverCount": 5
      },
      "eventTypeDistribution": { "DROWSINESS": 4, "PHONE": 6, "DISTRACTION": 3, "YAWNING": 5 },
      "severityDistribution": { "CRITICAL": 4, "HIGH": 6, "MEDIUM": 5, "LOW": 3 }
    }
  }
  ```
