# DriveGuard AI - Testing & Verification Specification

This specification provides comprehensive procedures for running automated unit tests, integration suites, build verification, and edge simulation testing across DriveGuard AI.

---

## 🧪 Automated Test Execution Commands

### 1. Central Backend Test Suites (`/backend`)
```bash
cd backend

# Run 8-phase full end-to-end integration test
node test-end-to-end-integration.js

# Run telemetry REST API and idempotency test
node test-telemetry-module.js

# Run server-side analytics aggregation test
node test-analytics-module.js

# Run server health sanity check
node test-server.js
```

### 2. Android App Unit Tests (`/android-app`)
```powershell
cd android-app
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"

# Run all local JVM unit tests via Gradle wrapper
.\gradlew.bat testDebugUnitTest
```

### 3. Web Dashboard Production Build Verification (`/web-dashboard`)
```bash
cd web-dashboard
npm install
npm run build
```

---

## 📋 Test Coverage Matrix

| Subsystem | Test Suite | Verification Focus |
| :--- | :--- | :--- |
| **Android Vision** | `OpenCVPreprocessorTest.kt` | `YUV_420_888` conversion, rotation, CLAHE cabin illumination contrast enhancement |
| **Android ML** | `MediaPipeFaceLandmarkTest.kt` | 6-point EAR calculation & $\ge 1500\text{ ms}$ prolonged eye closure qualification |
| **Android Fatigue** | `YawnDetectionTest.kt` | MAR calculation, $\ge 1500\text{ ms}$ yawn duration, and $5000\text{ ms}$ cooldown debouncing |
| **Android YOLO** | `YoloDetectionTest.kt` | IoU NMS and $3/5$ sliding window temporal confirmation filter |
| **Android Engine** | `RiskEngineTest.kt` | `-30/-25/-20/-10` deductions, score clamping `[0, 100]`, and cooldown recovery |
| **Android Queue** | `GpsTripTrackingTest.kt` | Local SQLite/SharedPref queueing, exponential backoff, and UUID idempotency |
| **Android State** | `TripStateAndAlertTest.kt` | State transitions (`IDLE` $\to$ `MONITORING` $\to$ `COMPLETED`) & tone chimes |
| **Backend Integration** | `test-end-to-end-integration.js`| 8-phase workflow from driver registration to multi-trip execution & analytics |
| **Backend Telemetry** | `test-telemetry-module.js` | Payload validation, base64 payload stripping, and duplicate event rejection |
| **Backend Analytics** | `test-analytics-module.js` | KPI calculation, date filtering, and driver-specific metric isolation |

---

## 🎭 Manual Edge Simulation Testing (In-App Demo Mode)

To verify the complete pipeline without physical vehicle driving:
1. Launch the Android Edge App on a test device or emulator.
2. Toggle the top HUD switch to **Demo Simulation Mode**.
3. Verify that the bright amber banner `[DEMO MODE: REPLAY SIMULATION]` is displayed.
4. Tap **START TRIP**:
   - At $t=5\text{s}$: Verify `DROWSINESS` event (`-30` pts), HUD displays `Score: 70`, audio chime triggers.
   - At $t=14\text{s}$: Verify `PHONE_USE` event (`-25` pts), HUD displays `Score: 45`, prompt audio beep triggers.
   - At $t=22\text{s}$: Verify `YAWNING` event (`-10` pts), HUD displays `Score: 35`.
5. Open the Web Dashboard (`http://localhost:5173`) and confirm real-time synchronization on the Active Trips and Alert Feed views.
