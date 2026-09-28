# DriveGuard AI - Proposed Methodology & End-to-End System Pipeline Mapping

This document maps the 5-step **Proposed Methodology Pipeline** directly to the underlying DriveGuard AI codebase components, files, and architectural execution flow.

---

## 🖼 System Methodology Pipeline

![DRIVEGUARD AI - END-TO-END SYSTEM PIPELINE](file:///C:/Users/saksh/.gemini/antigravity/brain/5a8d0a15-3a8a-4d4e-9bc7-237df159e829/proposed_methodology_pipeline.png)

---

## 🔗 Step-by-Step Methodology to Codebase Mapping

### STEP 01: Video Capture & Telemetry (Blue Subsystem)
* **Smartphone Camera**: Managed via CameraX front camera in [`CameraManager.kt`](file:///c:/Users/saksh/OneDrive/Documents/Major%20Project/android-app/app/src/main/java/com/dms/edge/camera/CameraManager.kt).
* **Built-in GPS Sensor**: Managed via [`LocationTracker.kt`](file:///c:/Users/saksh/OneDrive/Documents/Major%20Project/android-app/app/src/main/java/com/dms/edge/location/LocationTracker.kt) capturing latitude, longitude, speed, and accuracy.
* **30 FPS Live Stream**: CameraX image analysis analyzer [`DriverMonitoringAnalyzer.kt`](file:///c:/Users/saksh/OneDrive/Documents/Major%20Project/android-app/app/src/main/java/com/dms/edge/ml/DriverMonitoringAnalyzer.kt).
* **In-Cabin Mounting**: High-contrast vehicle HUD UI in [`activity_main.xml`](file:///c:/Users/saksh/OneDrive/Documents/Major%20Project/android-app/app/src/main/res/layout/activity_main.xml) and [`MainActivity.kt`](file:///c:/Users/saksh/OneDrive/Documents/Major%20Project/android-app/app/src/main/java/com/dms/edge/MainActivity.kt).

### STEP 02: Preprocessing Image Pipeline (Green Subsystem)
* **OpenCV Framework**: Core preprocessing routines in [`OpenCVPreprocessor.kt`](file:///c:/Users/saksh/OneDrive/Documents/Major%20Project/android-app/app/src/main/java/com/dms/edge/cv/preprocessing/OpenCVPreprocessor.kt).
* **Face ROI Extraction**: Implemented in [`FrameConverter.kt`](file:///c:/Users/saksh/OneDrive/Documents/Major%20Project/android-app/app/src/main/java/com/dms/edge/cv/preprocessing/FrameConverter.kt) for cropping the facial region of interest.
* **Frame Normalization**: Cabin illumination contrast enhancement using CLAHE in `OpenCVPreprocessor.kt`.
* **Grayscale & Resizing**: Configured via [`ImagePreprocessConfig.kt`](file:///c:/Users/saksh/OneDrive/Documents/Major%20Project/android-app/app/src/main/java/com/dms/edge/cv/preprocessing/ImagePreprocessConfig.kt) (640x480 resolution, rotation correction, and mirroring).

### STEP 03: AI Detection Deep Learning (Orange Subsystem)
* **MediaPipe (EAR/MAR)**: 468 3D face mesh landmark extraction in [`MediaPipeFaceLandmarkModule.kt`](file:///c:/Users/saksh/OneDrive/Documents/Major%20Project/android-app/app/src/main/java/com/dms/edge/cv/mediapipe/MediaPipeFaceLandmarkModule.kt).
* **Eye Blink & Yawn**: 6-point Eye Aspect Ratio in [`EarCalculator.kt`](file:///c:/Users/saksh/OneDrive/Documents/Major%20Project/android-app/app/src/main/java/com/dms/edge/cv/mediapipe/EarCalculator.kt) ($\ge 1500\text{ ms}$ prolonged closure) and Mouth Aspect Ratio in [`MarCalculator.kt`](file:///c:/Users/saksh/OneDrive/Documents/Major%20Project/android-app/app/src/main/java/com/dms/edge/cv/mediapipe/MarCalculator.kt) / [`YawnStateMachine.kt`](file:///c:/Users/saksh/OneDrive/Documents/Major%20Project/android-app/app/src/main/java/com/dms/edge/cv/mediapipe/YawnStateMachine.kt).
* **YOLOv8 (Phone Use)**: Mobile phone object detector in [`YoloMobileEngine.kt`](file:///c:/Users/saksh/OneDrive/Documents/Major%20Project/android-app/app/src/main/java/com/dms/edge/cv/yolo/YoloMobileEngine.kt), IoU NMS in [`NmsUtility.kt`](file:///c:/Users/saksh/OneDrive/Documents/Major%20Project/android-app/app/src/main/java/com/dms/edge/cv/yolo/NmsUtility.kt), and 3/5 temporal filter in [`TemporalDetectionFilter.kt`](file:///c:/Users/saksh/OneDrive/Documents/Major%20Project/android-app/app/src/main/java/com/dms/edge/cv/yolo/TemporalDetectionFilter.kt).
* **Head Pose Estimate**: Head rotation yaw and pitch orientation calculation in [`FrameAnalysisResult.kt`](file:///c:/Users/saksh/OneDrive/Documents/Major%20Project/android-app/app/src/main/java/com/dms/edge/cv/FrameAnalysisResult.kt).

### STEP 04: Risk Engine Safety Scoring (Red Subsystem)
* **Base Score: 100 Pts**: Trip score initialized to 100 in [`RiskEngine.kt`](file:///c:/Users/saksh/OneDrive/Documents/Major%20Project/android-app/app/src/main/java/com/dms/edge/engine/RiskEngine.kt).
* **Dynamic Deductions**: Baseline penalty rules (`-30` Drowsiness, `-25` Phone Use, `-20` Distraction, `-10` Yawning) in [`RiskEngineConfig.kt`](file:///c:/Users/saksh/OneDrive/Documents/Major%20Project/android-app/app/src/main/java/com/dms/edge/engine/RiskEngineConfig.kt).
* **Live In-Cabin Alert**: Visual warning banner and score HUD updates in `MainActivity.kt`.
* **Audio/Buzzer Trigger**: Warning audio chime generation in [`AlertManager.kt`](file:///c:/Users/saksh/OneDrive/Documents/Major%20Project/android-app/app/src/main/java/com/dms/edge/alert/AlertManager.kt) and [`ToneGenerator.kt`](file:///c:/Users/saksh/OneDrive/Documents/Major%20Project/android-app/app/src/main/java/com/dms/edge/alerts/ToneGenerator.kt).

### STEP 05: Fleet Platform Cloud & Web UI (Purple Subsystem)
* **Node.js & Express API**: Express REST controllers and routes in [`backend/src`](file:///c:/Users/saksh/OneDrive/Documents/Major%20Project/backend/src) (`/api/drivers`, `/api/trips`, `/api/risk-events`, `/api/score-snapshots`, `/api/analytics`).
* **MongoDB Cloud DB**: Mongoose data models ([`Driver.js`](file:///c:/Users/saksh/OneDrive/Documents/Major%20Project/backend/src/models/Driver.js), [`Trip.js`](file:///c:/Users/saksh/OneDrive/Documents/Major%20Project/backend/src/models/Trip.js), [`RiskEvent.js`](file:///c:/Users/saksh/OneDrive/Documents/Major%20Project/backend/src/models/RiskEvent.js), [`ScoreSnapshot.js`](file:///c:/Users/saksh/OneDrive/Documents/Major%20Project/backend/src/models/ScoreSnapshot.js)) with hybrid dual-mode persistence.
* **React Web Dashboard**: Responsive React + Tailwind UI in [`web-dashboard/src`](file:///c:/Users/saksh/OneDrive/Documents/Major%20Project/web-dashboard/src) ([`Dashboard.jsx`](file:///c:/Users/saksh/OneDrive/Documents/Major%20Project/web-dashboard/src/pages/Dashboard.jsx), [`Analytics.jsx`](file:///c:/Users/saksh/OneDrive/Documents/Major%20Project/web-dashboard/src/pages/Analytics.jsx), [`ActiveTrips.jsx`](file:///c:/Users/saksh/OneDrive/Documents/Major%20Project/web-dashboard/src/pages/ActiveTrips.jsx), [`TripDetail.jsx`](file:///c:/Users/saksh/OneDrive/Documents/Major%20Project/web-dashboard/src/pages/TripDetail.jsx), [`Drivers.jsx`](file:///c:/Users/saksh/OneDrive/Documents/Major%20Project/web-dashboard/src/pages/Drivers.jsx), [`Alerts.jsx`](file:///c:/Users/saksh/OneDrive/Documents/Major%20Project/web-dashboard/src/pages/Alerts.jsx)).
* **Live Vehicle Tracking**: Interactive GPS coordinate route trail mapping in `TripDetail.jsx` and `Analytics.jsx`.
