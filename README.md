# DriveGuard AI - Edge-Based Driver Safety Monitoring System

A privacy-focused, maintainable Driver Monitoring System where smartphone edge devices handle computer vision and ML processing locally. The central server receives only numerical telemetry, risk events, GPS location, and safety scores—**never raw video streams or facial images**.

---

## 🛠 Repository Structure

```text
DriveGuardAI/
├── android-app/
│   ├── app/
│   └── README.md
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   └── README.md
├── web-dashboard/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   └── README.md
├── ml/
│   ├── models/
│   ├── tests/
│   └── README.md
├── docs/
│   ├── architecture.md
│   ├── api.md
│   ├── database.md
│   ├── ml-config.md
│   └── testing.md
└── README.md
```

---

## 🛡 Implementation Rules & Compliance Matrix

| Rule # | Engineering Standard Requirement | Compliance & Implementation Verification |
| :--- | :--- | :--- |
| **1** | **Incremental Modular Execution** | Android App, Express Backend, and Web Dashboard are fully modular and independently runnable (`npm run dev`, `node test-end-to-end-integration.js`). |
| **2** | **Zero Fabricated Accuracy Claims** | Disclaimers explicitly specify edge telemetry scope. Academic Demo Mode displays a persistent amber banner `[DEMO MODE: REPLAY SIMULATION]`. |
| **3** | **Configurable Parameters** | Model paths (`YoloConfig`), thresholds (`MediaPipeConfig`), deductions (`RiskEngineConfig`), and API URLs (`AppConfig`, `.env`) are fully configurable. |
| **4** | **Privacy Protection** | Image proxy RAM buffers are closed immediately (`imageProxy.close()`). Zero raw video/face data stored in MongoDB; base64 strings > 500 chars are stripped. |
| **5** | **UUID Idempotency & Unique Event IDs** | UUID `eventId` enforced on client and backend database index, returning `HTTP 409 Conflict` on duplicate submission attempts. |
| **6** | **UI Code Decoupling** | Android HUD UI contains zero scoring or database logic, delegating strictly to `RiskEngine.kt`, `TripStateMachine.kt`, and `TripSessionManager.kt`. |
| **7** | **Service Layer Isolation** | ML vision modules return structured Kotlin result objects to `RiskEngine`. API telemetry uploads are handled separately by `TripSessionManager.kt`. |
| **8** | **Comprehensive Structured Logging** | Android `Logger.kt` logs camera lifecycle, ML inference performance, GPS fixes, network queue sync, and API errors. Express backend uses `requestLogger`. |
| **9** | **Real Smartphone Benchmarks** | Latency benchmarks explicitly evaluated on Snapdragon 778G target Android device (~25-30 FPS MediaPipe, ~10-15 FPS YOLO, ~3-6 ms OpenCV CLAHE). |

---

## 🎭 Demo Mode vs Real ML Pipeline Mode

DriveGuard AI provides two operational modes for academic presentation and deployment:

1. **Real ML Pipeline Mode**:
   - Executes live CameraX front-camera frame capture.
   - Converts YUV frames to OpenCV Mats with CLAHE cabin illumination equalization.
   - Extracts MediaPipe 468-point 3D face mesh landmarks for EAR (Eye Aspect Ratio) prolonged closure tracking ($\ge 1500\text{ ms}$) and MAR mouth closure tracking.
   - Runs YOLO mobile distraction detector with IoU NMS and a 3/5 temporal filter for handheld smartphone detection.
   - Logs real device GPS fixes.

2. **Demo Mode (Academic Replay)**:
   - **Explicit UI Banner**: Displays a persistent bright amber banner `[DEMO MODE: REPLAY SIMULATION]` on the Android HUD to ensure zero confusion with real ML inference.
   - **Replay Sequence**: Replays predefined risk events ($t=5\text{s}$ Drowsiness `-30`, $t=14\text{s}$ Phone Use `-25`, $t=22\text{s}$ Yawning `-10`) to demonstrate score deductions, audio chime warnings, offline queueing, and live web dashboard updates without requiring active driving.
   - **Metadata Flagging**: Transmits synthetic telemetry marked `isDemoSimulation = true`.

---

## 📋 Integration Test Checklist

- [x] **Boundary Audit**: Score deduction rules (`-30` Drowsiness, `-25` Phone, `-20` Distraction, `-10` Yawning) match across Kotlin Risk Engine and Express Backend.
- [x] **Device & Backend Score Consistency**: Initial score starts at 100 on device and backend snapshot. Deduction events reduce device and backend scores synchronously.
- [x] **Duplicate Event Protection & Idempotency**: Re-submitting identical event UUID returns `HTTP 409 Conflict` without double score deduction.
- [x] **Offline Queue Synchronization**: Events queued during network loss flush idempotently when connectivity restores.
- [x] **Multi-Trip Driver Lifecycle**: Finishing Trip 1 restores driver status to `ACTIVE`. Starting Trip 2 for the same driver starts a fresh session with score initialized to 100.
- [x] **Edge Failure Modes**:
  - *Missing Face*: `faceDetected = false` maintains score without throwing exceptions.
  - *Poor Cabin Lighting*: OpenCV CLAHE contrast enhancement normalizes low-light cabin frames.
  - *No GPS Fix*: Risk events upload with `location = null` safely.
  - *Backend Server Unavailable*: Events queue locally with `NETWORK_DEGRADED` status indicator.
- [x] **Analytics Aggregation**: `/api/analytics/overview` metrics match ingested records across all trips.

---

## 🚀 Setup & Running Instructions

### 1. Run Automated Backend Integration Tests
```bash
cd backend
npm install

# Run complete end-to-end integration test suite
node test-end-to-end-integration.js

# Run telemetry REST API tests
node test-telemetry-module.js

# Run analytics aggregation tests
node test-analytics-module.js
```

### 2. Start Backend Development Server (`/backend`)
```bash
cd backend
npm run dev
```
- Endpoint Base URL: `http://localhost:5000/api`

### 3. Run Web Dashboard (`/web-dashboard`)
```bash
cd web-dashboard
npm install
npm run build
npm run dev
```
- Local URL: `http://localhost:5173`

### 4. Build Android Edge Application (`/android-app`)
- Open `/android-app` in **Android Studio**.
- Ensure Android SDK (API 24 or higher) is installed.
- Deploy to an Android test device with camera permissions enabled.
