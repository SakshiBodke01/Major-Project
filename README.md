# DriveGuard AI - Edge-Based Driver Safety Monitoring System

[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20Node.js%20%7C%20React-blue.svg)](https://github.com/SakshiBodke01/Major-Project)
[![Architecture](https://img.shields.io/badge/Architecture-Edge--AI%20%7C%20Privacy--First-green.svg)](docs/architecture.md)
[![License](https://img.shields.io/badge/License-Academic%20Evaluation-orange.svg)](README.md)

A privacy-focused, modular Driver Monitoring System (DMS) where smartphone edge devices execute computer vision and machine learning models locally in RAM. The central server receives exclusively numerical telemetry, GPS fixes, risk event codes, and safety scores—**never raw video streams or facial imagery**.

---

## 🛠 Repository Structure

```text
DriveGuardAI/
├── android-app/                       # Android Edge Mobile Application (Kotlin)
│   ├── app/
│   │   ├── src/main/java/com/dms/edge/
│   │   │   ├── alert/                 # Audio ToneGenerator & visual alert manager
│   │   │   ├── camera/                # CameraX preview & frame lifecycle
│   │   │   ├── config/                # App & server configuration
│   │   │   ├── cv/                    # Computer vision engines & preprocessing
│   │   │   │   ├── mediapipe/         # 468-point face mesh, EAR & MAR calculators
│   │   │   │   ├── preprocessing/     # OpenCV YUV-to-Mat, CLAHE normalization
│   │   │   │   └── yolo/              # YOLO phone detector, NMS & temporal filter
│   │   │   ├── engine/                # Central Risk Engine & score deductor
│   │   │   ├── location/              # GPS sensor & speed tracker
│   │   │   ├── network/               # Retrofit API & offline queue manager
│   │   │   ├── session/               # Trip session manager & lifecycle
│   │   │   ├── state/                 # Trip state machine & persistence
│   │   │   └── utils/                 # Structured logging & telemetry helpers
│   │   ├── src/main/assets/           # TFLite quantized models & assets README
│   │   └── build.gradle.kts           # AGP 9 / Kotlin / targetSdk 34
│   ├── gradle/                        # Gradle wrapper files
│   ├── gradlew / gradlew.bat          # Gradle 9 wrapper scripts
│   └── README.md                      # Android setup, CLI run & build guide
├── backend/                           # Central Telemetry API (Node.js & Express)
│   ├── src/
│   │   ├── config/                    # DB connection & environment settings
│   │   ├── controllers/               # Express route handlers
│   │   ├── middlewares/               # Request logging, error handling & validation
│   │   ├── models/                    # Mongoose schemas (Driver, Trip, RiskEvent, ScoreSnapshot)
│   │   ├── routes/                    # REST API route endpoints
│   │   ├── services/                  # Business logic & dual-mode persistence
│   │   └── utils/                     # Response handlers & validation helpers
│   ├── test-end-to-end-integration.js # 8-phase full integration test suite
│   ├── test-telemetry-module.js       # Telemetry ingestion & idempotency tests
│   ├── test-analytics-module.js       # Analytics aggregation filter tests
│   └── README.md                      # Backend architecture & API documentation
├── web-dashboard/                     # Fleet Management Web Dashboard (React + Vite)
│   ├── src/
│   │   ├── components/                # Reusable UI widgets, alerts & KPI cards
│   │   ├── pages/                     # Dashboard, Analytics, ActiveTrips, Drivers, Alerts
│   │   ├── services/                  # Axios API client & backend integration
│   │   └── utils/                     # Formatting & metric calculation utilities
│   └── README.md                      # Dashboard setup, features & build guide
├── ml/                                # Offline ML Training & Quantization Pipeline
│   ├── models/                        # Pretrained models, checkpoints & TFLite files
│   ├── tests/                         # Precision, recall, and quantization benchmarks
│   └── README.md                      # Edge ML rationale & model conversion guidelines
├── docs/                              # Project Technical Documentation
│   ├── api.md                         # Complete REST API specification
│   ├── architecture.md                # System pipeline & edge-to-cloud architecture
│   ├── database.md                    # Database schemas, collections & data dictionary
│   ├── known-limitations.md           # Hardware constraints & computer vision edge cases
│   ├── ml-config.md                   # ML configuration, thresholds & benchmark guide
│   ├── ml-configuration.md            # Extended threshold reference
│   ├── privacy-dataflow.md            # Privacy invariants & RAM dataflow sequence
│   ├── proposed-methodology.md        # 5-step proposed methodology & code mapping
│   ├── test-report.md                 # Test execution summary & edge latency benchmarks
│   ├── testing.md                     # Comprehensive testing guide & test matrices
│   ├── troubleshooting.md             # Troubleshooting FAQ & issue resolutions
│   └── ui-consistency-guide.md        # Design tokens, color semantics & HUD layout
└── README.md                          # Root project README
```

---

## 🛡 Implementation Rules & Compliance Matrix

| Rule # | Engineering Standard Requirement | Compliance & Implementation Verification |
| :--- | :--- | :--- |
| **1** | **Incremental Modular Execution** | Android App, Express Backend, and Web Dashboard are fully modular and independently runnable (`.\gradlew.bat assembleDebug`, `npm run dev`, `node test-end-to-end-integration.js`). |
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

DriveGuard AI provides two operational modes for academic presentation and real-world deployment:

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

### 1. Central Backend (`/backend`)
```bash
cd backend
npm install

# Run automated backend test suites
node test-end-to-end-integration.js
node test-telemetry-module.js
node test-analytics-module.js

# Start backend server in development mode
npm run dev
```
- Endpoint Base URL: `http://localhost:5000/api`
- Health Check: `http://localhost:5000/api/health`

### 2. Fleet Web Dashboard (`/web-dashboard`)
```bash
cd web-dashboard
npm install
npm run build
npm run dev
```
- Dashboard URL: `http://localhost:5173`

### 3. Android Edge Application (`/android-app`)

#### Prerequisites:
- **JDK 17** (e.g. Eclipse Temurin JDK 17)
- **Android SDK** API 34 (`platforms/android-34`, `build-tools/34.0.0`)
- Physical device with **USB Debugging** enabled or Android Emulator.

#### Option A: Antigravity CLI / PowerShell Command
```powershell
cd android-app
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"

# Build debug APK
.\gradlew.bat assembleDebug

# Install on connected device
adb install -r -d app\build\outputs\apk\debug\app-debug.apk

# Launch Main Activity
adb shell am start -n com.dms.edge/com.dms.edge.MainActivity
```

#### Option B: Android Studio
1. Open the `/android-app` folder in Android Studio.
2. Select **JDK 17** under Gradle Settings.
3. Sync Gradle and click **Run** (`Shift + F10`).

---

## 📚 Technical Documentation Index

| Document | Description |
| :--- | :--- |
| [System Architecture](docs/architecture.md) | High-level component interactions, edge pipeline, and cloud integration. |
| [REST API Specification](docs/api.md) | Full API route contracts, payload schemas, and response formats. |
| [Database Schemas](docs/database.md) | MongoDB collections, indexes, and privacy invariants. |
| [Proposed Methodology](docs/proposed-methodology.md) | 5-step methodology mapped directly to codebase implementations. |
| [Privacy & Data Flow](docs/privacy-dataflow.md) | Privacy-by-design guarantees and zero-video egress verification. |
| [ML Configuration Guide](docs/ml-config.md) | EAR/MAR formulas, YOLO parameters, and mobile benchmarks. |
| [Testing & Verification](docs/testing.md) | Unit test commands, coverage matrices, and integration protocols. |
| [Test Report](docs/test-report.md) | Verification results, pass rates, and hardware latency measurements. |
| [Troubleshooting Guide](docs/troubleshooting.md) | Resolving port conflicts, ADB connection issues, and permission traps. |
| [UI Consistency Guide](docs/ui-consistency-guide.md) | Design tokens, color schemes, and dashboard/HUD design principles. |
| [Known Limitations](docs/known-limitations.md) | Hardware constraints, illumination limits, and technical edge cases. |
