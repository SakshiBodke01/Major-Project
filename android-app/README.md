# DriveGuard AI - Android Edge Application

Kotlin + CameraX + OpenCV + MediaPipe + YOLO Mobile Edge Application for real-time driver safety monitoring.

---

## 📱 Subsystem Overview

- **Location**: `android-app/app`
- **Language & Runtime**: Kotlin (Android SDK API 24+)
- **Camera Pipeline**: CameraX front-facing camera (`DEFAULT_FRONT_CAMERA`)
- **Frame Preprocessing**: OpenCV YUV-to-Mat conversion, CLAHE cabin contrast enhancement, rotation handling
- **Facial Landmark Module**: MediaPipe 468-point 3D face mesh for EAR (Eye Aspect Ratio) and MAR (Mouth Aspect Ratio) fatigue analysis
- **Distraction Detection Engine**: YOLO mobile object detector with IoU NMS and a 3/5 sliding window temporal confirmation filter
- **Risk Engine & Alerts**: `RiskEngine.kt` (starting score 100, `-30/-25/-20/-10` deductions) with audio tone chimes and HUD alerts
- **Offline Telemetry Queue**: SQLite/SharedPreferences queue with exponential backoff and UUID idempotency

---

## 🚀 Setup & Build Instructions

1. Open `/android-app` in **Android Studio** (Electric Eel or newer).
2. Sync Gradle dependencies (`app/build.gradle.kts`).
3. Deploy to a physical Android device or emulator with camera permissions enabled.
4. Select between **Real ML Pipeline Mode** and **Demo Simulation Mode** on the top HUD toggle.
