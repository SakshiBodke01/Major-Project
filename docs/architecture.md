# DriveGuard AI - System & Pipeline Architecture

DriveGuard AI is an **Edge-Based Driver Monitoring System (DMS)** designed for smartphone devices. Computer vision processing (facial landmark analysis, EAR eye aspect ratio tracking, MAR mouth closure tracking, and YOLO mobile object detection) is executed locally on-device.

---

## 🏗 High-Level System Component Diagram

```text
+-------------------------------------------------------------------------------+
|                             SMARTPHONE EDGE DEVICE                            |
|                                                                               |
|  +-------------------+      +-------------------+      +-------------------+  |
|  |  CameraX Capture  | ---> | OpenCV Preprocess | ---> | MediaPipe Landmarks|  |
|  | (Front Camera RAM)|      | (YUV / CLAHE / ROI|      | (468 Face Mesh)   |  |
|  +-------------------+      +-------------------+      +-------------------+  |
|                                                                |              |
|                                                                v              |
|  +-------------------+      +-------------------+      +-------------------+  |
|  | Audio/Visual Alert| <--- |   Central Risk    | <--- |  YOLO Object Det. |  |
|  | (Tone Chimes/HUD) |      | Engine (Score 100)|      | (Mobile Phone Use)|  |
|  +-------------------+      +-------------------+      +-------------------+  |
|                                       |                                       |
|                                       v                                       |
|                             +-------------------+                             |
|                             | Offline Telemetry |                             |
|                             | Queue & Location  |                             |
|                             +-------------------+                             |
+---------------------------------------|---------------------------------------+
                                        |  REST JSON Telemetry Uplink
                                        v  (NO RAW VIDEO OR FACE IMAGES)
+-------------------------------------------------------------------------------+
|                            CENTRAL TELEMETRY BACKEND                          |
|                                                                               |
|  +-------------------+      +-------------------+      +-------------------+  |
|  | Node.js / Express | ---> | Hybrid Persistence| ---> | Server-Side Agg.  |  |
|  | REST API Routes   |      | (MongoDB + RAM)   |      | & Score History   |  |
|  +-------------------+      +-------------------+      +-------------------+  |
+---------------------------------------|---------------------------------------+
                                        |  HTTP API Response
                                        v
+-------------------------------------------------------------------------------+
|                            REACT FLEET WEB DASHBOARD                          |
|                                                                               |
|  +-------------------+      +-------------------+      +-------------------+  |
|  | Overview Fleet KPI|      | Active Trips & GPS|      | Risk Analytics &  |  |
|  | & Driver Rating   |      | Route Waypoints   |      | High Risk Flags   |  |
|  +-------------------+      +-------------------+      +-------------------+  |
+-------------------------------------------------------------------------------+
```

---

## 🔄 Real ML Pipeline vs Demo Simulation Mode

| Feature Component | Real ML Pipeline Mode | Demo Simulation Mode (Academic Replay) |
| :--- | :--- | :--- |
| **Camera & Vision Input** | Live CameraX front camera frame capture | Simulated frame tick generator |
| **Preprocess & Light Norm** | OpenCV YUV_420_888 to Mat, CLAHE equalization | Predefined synthetic frame parameters |
| **Face Mesh Landmarks** | MediaPipe 468-point face mesh model | Precomputed landmark matrices |
| **Drowsiness Signal** | 6-point EAR calculation with 1500ms prolonged closure | Timed replay trigger at t = 5s (`-30` pts) |
| **Phone Use Signal** | YOLO mobile detector with IoU NMS & 3/5 confirmation | Timed replay trigger at t = 14s (`-25` pts) |
| **Yawning Signal** | MAR calculation with 1500ms duration & 5s cooldown | Timed replay trigger at t = 22s (`-10` pts) |
| **UI Banner Identification** | Standard `[MONITORING ACTIVE]` status badge | Bright Amber `[DEMO MODE: REPLAY SIMULATION]` |
| **Telemetry Payload Flag** | `isDemoSimulation: false` | `isDemoSimulation: true` |

---

## 📦 Subsystem Responsibilities

1. **Android App (`/android-app`)**:
   - Manages CameraX preview and frame buffer lifecycle (`ImageProxy.close()`).
   - Implements local audio chime alerts ([AlertManager.kt](file:///c:/Users/saksh/OneDrive/Documents/Major%20Project/android-app/app/src/main/java/com/dms/edge/alert/AlertManager.kt)) and vehicle HUD layout.
   - Manages trip session state machine (`IDLE` -> `STARTING` -> `MONITORING` -> `PAUSED` -> `NETWORK_DEGRADED` -> `STOPPING` -> `COMPLETED`).
   - Handles offline telemetry queueing with UUID idempotency during network loss.

2. **Backend API (`/backend`)**:
   - Express REST API with payload validation middleware.
   - Dual-mode persistence engine: MongoDB online storage + in-memory map fallback for zero-dependency test execution.
   - Exposes analytics aggregation routes (`/api/analytics/overview`) for date & driver filtering.

3. **Web Dashboard (`/web-dashboard`)**:
   - Built with React, Vite, and Tailwind CSS.
   - Renders live active vehicle feeds, safety score cards, driver rosters, filterable alert feeds, and interactive GPS route maps.
