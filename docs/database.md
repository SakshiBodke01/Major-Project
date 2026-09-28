# DriveGuard AI - Database Schemas & Data Dictionary

DriveGuard AI uses MongoDB with Mongoose ODM schemas in production, backed by a hybrid in-memory fallback store for offline testing.

---

## 🗄 Collections & Schemas

### 1. `Driver` Collection (`drivers`)

| Field Name | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `driverId` | `String` | **Yes** | Unique UUID | Primary unique identifier for driver |
| `name` | `String` | **Yes** | - | Driver full name |
| `phone` | `String` | No | `null` | Contact phone number |
| `status` | `String` | **Yes** | `'ACTIVE'` | Status enum: `ACTIVE`, `ON_TRIP`, `INACTIVE` |
| `safetyRating` | `Number` | **Yes** | `100` | Current safety score rating `[0, 100]` |
| `createdAt` | `Date` | **Yes** | `Date.now` | Registration timestamp |
| `updatedAt` | `Date` | **Yes** | `Date.now` | Last update timestamp |

---

### 2. `Trip` Collection (`trips`)

| Field Name | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `tripId` | `String` | **Yes** | Unique UUID | Primary unique identifier for trip |
| `driverId` | `String` | **Yes** | - | Foreign key to `Driver.driverId` |
| `startTime` | `Date` | **Yes** | `Date.now` | Trip start timestamp |
| `endTime` | `Date` | No | `null` | Trip conclusion timestamp |
| `status` | `String` | **Yes** | `'ACTIVE'` | Status enum: `ACTIVE`, `MONITORING`, `COMPLETED`, `PAUSED` |
| `startingLocation` | `Object` | **Yes** | - | `{ latitude, longitude, speedKmh, address }` |
| `endingLocation` | `Object` | No | `null` | `{ latitude, longitude, speedKmh, address }` |
| `finalScore` | `Number` | **Yes** | `100` | Current/Final safety score `[0, 100]` |
| `totalAlerts` | `Number` | **Yes** | `0` | Cumulative count of risk events in trip |
| `gpsPoints` | `Array` | No | `[]` | List of location fixes recorded during trip |

---

### 3. `RiskEvent` Collection (`riskevents`)

| Field Name | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `eventId` | `String` | **Yes** | Unique UUID | Unique event identifier (Enforces Idempotency) |
| `tripId` | `String` | **Yes** | - | Foreign key to `Trip.tripId` |
| `driverId` | `String` | **Yes** | - | Foreign key to `Driver.driverId` |
| `type` | `String` | **Yes** | - | Event type enum: `DROWSINESS`, `PHONE_USE`, `DISTRACTION`, `YAWNING` |
| `severity` | `String` | **Yes** | `'MEDIUM'` | Severity enum: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW` |
| `pointsDeducted` | `Number` | **Yes** | `5` | Points deducted from safety score |
| `latitude` | `Number` | **Yes** | - | GPS latitude coordinate |
| `longitude` | `Number` | **Yes** | - | GPS longitude coordinate |
| `confidence` | `Number` | No | `null` | Detection confidence `[0.0, 1.0]` |
| `metadata` | `Object` | No | `{}` | Key-value store (EAR score, MAR score, duration) |
| `timestamp` | `Date` | **Yes** | `Date.now` | Timestamp of event occurrence |

---

### 4. `ScoreSnapshot` Collection (`scoresnapshots`)

| Field Name | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `tripId` | `String` | **Yes** | - | Foreign key to `Trip.tripId` |
| `score` | `Number` | **Yes** | - | Safety score after deduction `[0, 100]` |
| `timestamp` | `Date` | **Yes** | `Date.now` | Snapshot timestamp |
| `reason` | `String` | **Yes** | - | Trigger reason (e.g. `EVENT_DROWSINESS`, `TRIP_START`) |

---

## 🔒 Security & Privacy Invariants

1. **No Binary Video Storage**: Neither `RiskEvent` nor any mongo collection includes binary image chunks, video frames, or base64 streams.
2. **Metadata Sanitization**: Request validation middleware automatically strips out base64 payload strings exceeding 500 characters prior to storage.
