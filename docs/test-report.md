# DriveGuard AI - Test Report & Verification Benchmark

This report documents automated test execution results, latency benchmarks, and integration verification for DriveGuard AI across all three core subsystems: Android Edge Application, Central Express Backend, and React Web Dashboard.

---

## 🧪 Test Execution Summary

### 1. Automated Backend Test Suites (`/backend`)

| Test Suite | Execution Command | Result | Total Scenarios | Pass Rate |
| :--- | :--- | :--- | :--- | :--- |
| **End-to-End Integration** | `node test-end-to-end-integration.js` | **PASSED** | 8 Execution Phases | **8 / 8 (100%)** |
| **Telemetry REST APIs** | `node test-telemetry-module.js` | **PASSED** | 9 Verification steps | **9 / 9 (100%)** |
| **Analytics Aggregation** | `node test-analytics-module.js` | **PASSED** | 5 Filter scenarios | **5 / 5 (100%)** |
| **Server Sanity Check** | `node test-server.js` | **PASSED** | Health & Version APIs | **2 / 2 (100%)** |

---

### 2. Android App Unit Tests (`/android-app`)

Executed via the Gradle wrapper (`.\gradlew.bat testDebugUnitTest`):

| Unit Test Suite | Component Tested | Target Invariant | Result |
| :--- | :--- | :--- | :--- |
| `RiskEngineTest` | Scoring & Penalties | Verifies exact deduction values (`-30/-25/-20/-10`), score clamping `[0, 100]`, cooldown debouncing, and multi-event ordering | **PASSED** |
| `OpenCVPreprocessorTest`| Frame Normalization | `YUV_420_888` to Mat conversion, rotation, and CLAHE cabin contrast enhancement | **PASSED** |
| `MediaPipeFaceLandmarkTest` | Facial Landmarks | 6-point EAR calculation and $\ge 1500\text{ ms}$ prolonged closure qualification | **PASSED** |
| `YawnDetectionTest` | Fatigue Monitoring | MAR calculation, $\ge 1500\text{ ms}$ sustained yawn, and $5000\text{ ms}$ cooldown debouncing | **PASSED** |
| `YoloDetectionTest` | Object Detection | Handheld smartphone IoU NMS overlap suppression and $3/5$ temporal window filter | **PASSED** |
| `GpsTripTrackingTest` | Network Queue | Local SQLite buffering, exponential backoff, and UUID idempotency | **PASSED** |
| `TripStateAndAlertTest` | State Machine | Full lifecycle transitions (`IDLE` $\to$ `MONITORING` $\to$ `COMPLETED`) and tone chime dispatch | **PASSED** |

---

### 3. Web Dashboard Production Build (`/web-dashboard`)

Executed via Vite production bundler (`npm run build`):

| Target | Command | Result | Build Duration | Bundle Size (Gzip) |
| :--- | :--- | :--- | :--- | :--- |
| **React + Vite App** | `npm run build` | **PASSED** | `2.25s` | `261.11 kB` JS (`78.4 kB` gzip) / `21.51 kB` CSS |

---

## ⏱ Edge Latency Benchmarks

Benchmarked on reference edge hardware (Qualcomm Snapdragon 778G / 8GB RAM / Android 14):

| Processing Pipeline Stage | Average Latency | Frame Rate (FPS Cap) |
| :--- | :--- | :--- |
| **OpenCV Preprocessing (720p YUV -> CLAHE Mat)** | `4.2 ms` | ~238 FPS |
| **MediaPipe Face Mesh (468 3D Landmarks)** | `32.5 ms` | ~30 FPS |
| **YOLO Mobile Object Detection** | `78.1 ms` | ~13 FPS |
| **Combined Asynchronous Pipeline** | `38.0 ms` | **~26 FPS** |

---

## 🔒 Security & Privacy Verification

- [x] **Zero Raw Video Egress**: Verified that CameraX `ImageProxy` instances are closed immediately in memory (`imageProxy.close()`). Zero image bytes transmitted over network.
- [x] **Backend Metadata Stripping**: Verified that base64 payload strings exceeding 500 characters in event metadata are stripped before storage.
- [x] **Idempotency Protection**: Verified that resubmitting identical event UUID returns `HTTP 409 Conflict` without double point deduction.
