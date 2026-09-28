# DriveGuard AI - Testing & Verification Specification

This document summarizes test execution procedures, unit test suites, integration tests, and edge pipeline latency benchmarks.

---

## 🧪 Automated Test Execution Commands

```bash
# 1. End-to-End Integration Suite
cd backend
node test-end-to-end-integration.js

# 2. Telemetry REST API Test Suite
node test-telemetry-module.js

# 3. Server-Side Analytics Aggregation Test Suite
node test-analytics-module.js

# 4. Web Dashboard Production Build Verification
cd ../web-dashboard
npm run build
```

---

## 📋 Test Coverage Matrix

| Component | Test Suite | Verification Focus |
| :--- | :--- | :--- |
| **OpenCV Preprocessing** | `OpenCVPreprocessorTest.kt` | `YUV_420_888` conversion, rotation, CLAHE cabin illumination contrast enhancement |
| **MediaPipe EAR Module** | `MediaPipeFaceLandmarkTest.kt` | 6-point EAR calculation & $\ge 1500\text{ ms}$ prolonged eye closure qualification |
| **MAR Yawning Module** | `YawnDetectionTest.kt` | MAR calculation, $\ge 1500\text{ ms}$ yawn duration, and $5000\text{ ms}$ cooldown debouncing |
| **YOLO Distraction Module** | `YoloDetectionTest.kt` | IoU NMS and $3/5$ sliding window temporal confirmation filter |
| **Risk Engine** | `RiskEngineTest.kt` | `-30/-25/-20/-10` deductions, score clamping `[0, 100]`, and cooldown recovery |
| **GPS & Telemetry Queue** | `GpsTripTrackingTest.kt` | Local SQLite/SharedPref queueing, exponential backoff, and UUID idempotency |
| **Alerts & State Machine** | `TripStateAndAlertTest.kt` | State transitions (`IDLE` -> `MONITORING` -> `COMPLETED`) & tone chimes |
| **End-to-End REST APIs** | `test-end-to-end-integration.js` | 8-phase workflow from driver registration to multi-trip execution & analytics |
