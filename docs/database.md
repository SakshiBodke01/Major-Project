# DriveGuard AI - Database Schemas & Data Dictionary

DriveGuard AI uses MongoDB with Mongoose ODM schemas in production, backed by a hybrid in-memory fallback store for offline testing and development.

---

## 🗄 Collections & Schemas

### 1. `Driver` Collection (`drivers`)

| Field Name | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `driverId` | `String` | **Yes** | Unique UUID | Primary unique identifier for driver (Indexed, Unique) |
| `name` | `String` | **Yes** | - | Driver full name |
| `phone` | `String` | No | `null` | Contact phone number |
| `status` | `String` | **Yes** | `'ACTIVE'` | Status enum: `ACTIVE`, `ON_TRIP`, `INACTIVE` |
| `safetyRating` | `Number` | **Yes** | `100` | Baseline or cumulative safety score rating `[0, 100]` |
| `createdAt` | `Date` | **Yes** | `Date.now` | Registration timestamp |
| `updatedAt` | `Date` | **Yes** | `Date.now` | Last update timestamp |

---

### 2. `Trip` Collection (`trips`)

| Field Name | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `tripId` | `String` | **Yes** | Unique UUID | Primary unique identifier for trip (Indexed, Unique) |
| `driverId` | `String` | **Yes** | - | Foreign key to `Driver.driverId` (Indexed) |
| `startTime` | `Date` | **Yes** | `Date.now` | Trip start timestamp |
| `endTime` | `Date` | No | `null` | Trip conclusion timestamp |
| `status` | `String` | **Yes** | `'ACTIVE'` | Status enum: `ACTIVE`, `MONITORING`, `COMPLETED`, `PAUSED` |
| `startingLocation` | `Object` | **Yes** | - | `{ latitude, longitude, speedKmh, address }` |
| `endingLocation` | `Object` | No | `null` | `{ latitude, longitude, speedKmh, address }` |
| `finalScore` | `Number` | **Yes** | `100` | Current/Final safety score `[0, 100]` |
| `totalAlerts` | `Number` | **Yes** | `0` | Cumulative count of risk events in trip |
| `gpsPoints` | `Array` | No | `[]` | List of location waypoints recorded during trip |

---

### 3. `RiskEvent` Collection (`riskevents`)

| Field Name | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `eventId` | `String` | **Yes** | Unique UUID | Unique event identifier enforcing idempotency (Indexed, Unique) |
| `tripId` | `String` | **Yes** | - | Foreign key to `Trip.tripId` (Indexed) |
| `driverId` | `String` | **Yes** | - | Foreign key to `Driver.driverId` (Indexed) |
| `type` | `String` | **Yes** | - | Event type enum: `DROWSINESS`, `PHONE`, `PHONE_USE`, `DISTRACTION`, `YAWNING` |
| `severity` | `String` | **Yes** | `'MEDIUM'` | Severity enum: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` |
| `pointsDeducted` | `Number` | **Yes** | `5` | Points deducted from trip safety score |
| `latitude` | `Number` | **Yes** | - | GPS latitude coordinate |
| `longitude` | `Number` | **Yes** | - | GPS longitude coordinate |
| `confidence` | `Number` | No | `null` | Detection confidence `[0.0, 1.0]` |
| `metadata` | `Object` | No | `{}` | Key-value store (e.g. `earScore`, `marScore`, `closureDurationMs`) |
| `timestamp` | `Date` | **Yes** | `Date.now` | Timestamp of event occurrence |

---

### 4. `ScoreSnapshot` Collection (`scoresnapshots`)

| Field Name | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `tripId` | `String` | **Yes** | - | Foreign key to `Trip.tripId` (Indexed) |
| `score` | `Number` | **Yes** | - | Safety score after deduction `[0, 100]` |
| `timestamp` | `Date` | **Yes** | `Date.now` | Snapshot timestamp |
| `reason` | `String` | **Yes** | - | Trigger reason (e.g. `EVENT_DROWSINESS`, `EVENT_PHONE`, `TRIP_START`) |

---

## 💾 Dual-Mode Persistence Architecture

1. **MongoDB Mode**: Activated when a valid MongoDB connection is established (`readyState === 1`). Enforces collection schemas, validation, and compound indexes.
2. **In-Memory Map Fallback**: Activated automatically if MongoDB is unreachable (`readyState !== 1`). Stores records inside thread-safe JavaScript `Map` structures in memory, allowing complete REST API operations and integration tests to execute with zero external daemon requirements.

---

## 🔒 Security & Privacy Invariants

1. **Zero Binary Video Storage**: Neither `RiskEvent` nor any MongoDB collection stores binary video chunks, camera frames, or face images.
2. **Payload Sanitization**: Ingestion middleware and services automatically inspect metadata fields and discard any base64 payload strings exceeding 500 characters prior to database persistence.
3. **Idempotency Guarantee**: The unique index on `eventId` prevents duplicate submissions, responding with `HTTP 409 Conflict`.
