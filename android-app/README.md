# DriveGuard AI - Android Edge Application

Kotlin + CameraX + OpenCV + MediaPipe + YOLO Mobile Edge Application for real-time driver safety monitoring.

---

## 📱 Subsystem Overview

- **Location**: `android-app/app`
- **Package Name**: `com.dms.edge`
- **Main Activity**: `com.dms.edge.MainActivity`
- **Language & Runtime**: Kotlin (Android SDK API 24+ / targetSdk 34)
- **Camera Pipeline**: CameraX front-facing camera (`DEFAULT_FRONT_CAMERA`)
- **Frame Preprocessing**: OpenCV YUV-to-Mat conversion, CLAHE cabin contrast enhancement, rotation handling
- **Facial Landmark Module**: MediaPipe 468-point 3D face mesh for EAR (Eye Aspect Ratio) and MAR (Mouth Aspect Ratio) fatigue analysis
- **Distraction Detection Engine**: YOLO mobile object detector with IoU NMS and a 3/5 sliding window temporal confirmation filter
- **Risk Engine & Alerts**: `RiskEngine.kt` (starting score 100, `-30/-25/-20/-10` deductions) with audio tone chimes and HUD alerts
- **Offline Telemetry Queue**: SQLite/SharedPreferences queue with exponential backoff and UUID idempotency

---

## 🏗 Package Architecture

```text
android-app/app/src/main/java/com/dms/edge/
├── MainActivity.kt                     # Vehicle HUD UI, camera preview, toggle controls
├── alert/
│   └── AlertManager.kt                 # ToneGenerator audio chimes & HUD visual alerts
├── camera/
│   └── CameraManager.kt                # CameraX preview lifecycle & frame executor
├── config/
│   └── AppConfig.kt                    # Server URL, timeout & default driver configuration
├── cv/
│   ├── DemoSimulationEngine.kt         # Replay simulation engine for academic demonstration
│   ├── FrameAnalysisResult.kt          # Structured result returned from CV engines
│   ├── ICVFrameEngine.kt               # Standard interface for vision engines
│   ├── MockCVEngine.kt                 # Mock engine for lightweight testing
│   ├── mediapipe/                      # MediaPipe 468 Face Mesh, EAR, MAR & yawn state machines
│   ├── preprocessing/                  # OpenCV YUV-to-Mat, CLAHE enhancement, rotation
│   └── yolo/                           # YOLO mobile detector, NMS utility & temporal filters
├── engine/
│   ├── RiskEngine.kt                   # Dynamic scoring, deduction rules, score clamping [0, 100]
│   ├── RiskEngineConfig.kt             # Deductions (-30, -25, -20, -10) & cooldown timers
│   └── RiskEngineEvent.kt              # Structured risk event data class
├── location/
│   └── LocationTracker.kt              # GPS latitude, longitude, and speed telemetry
├── ml/
│   ├── DriverMonitoringAnalyzer.kt     # CameraX ImageAnalysis analyzer bridge
│   └── RiskEventDetector.kt            # High-level risk evaluation coordinator
├── network/
│   ├── ApiService.kt                   # Retrofit REST API client interface
│   ├── NetworkClient.kt                # OkHttpClient configuration & timeouts
│   ├── NetworkMonitor.kt               # Connectivity manager & online/offline listener
│   ├── OfflineTelemetryQueue.kt        # Persistent FIFO queue with exponential retry backoff
│   └── models/TelemetryModels.kt       # Request/Response data models
├── session/
│   └── TripSessionManager.kt           # End-to-end trip session coordinator
├── state/
│   ├── TripState.kt                    # State enum (IDLE, MONITORING, PAUSED, etc.)
│   ├── TripStateMachine.kt             # State transition validation
│   └── TripStateStore.kt               # SharedPreferences persistent session state
└── utils/
    └── Logger.kt                       # Structured logging utility with tag routing
```

---

## 🛠️ Requirements & Prerequisites

### 1. Development Environment
- **Java Development Kit (JDK)**: **JDK 17** (recommended: Eclipse Temurin JDK 17).
  - *Note: Android Gradle Plugin (AGP) 9 requires JDK 17+.*
- **Android SDK**:
  - `platforms/android-34` (Android 14)
  - `build-tools/34.0.0` (or `36.0.0`)
  - `platform-tools` (provides `adb.exe`)
- **Gradle**: Gradle 9.1+ (included via the project wrapper `gradlew` / `gradlew.bat`).
- **Local Configuration**: Ensure `local.properties` contains your Android SDK path:
  ```properties
  sdk.dir=C\:\\Users\\<YourUsername>\\AppData\\Local\\Android\\Sdk
  ```

### 2. Device Requirements
- **Physical Android Device** (Recommended):
  - Android 7.0 (API 24) or higher with a front-facing camera.
  - USB cable connected to PC.
  - **Developer Options** enabled (tap *Build Number* / *Software Version* 7 times in Settings).
  - **USB Debugging** switched **ON**.
  - **Install via USB** switched **ON** (especially on Vivo, Xiaomi, Oppo, Realme devices).
- *(Alternative)* **Android Emulator**:
  - AVD running API 24+ with camera input configured to webcam/virtual scene.

---

## 🚀 How to Run the App

### Option A: From Terminal / PowerShell CLI (Recommended)

1. **Verify Device Connection**:
   Ensure your phone is recognized by ADB:
   ```powershell
   adb devices -l
   ```
   *(Ensure device status shows `device`, not `unauthorized`).*

2. **Build and Assemble the Debug APK**:
   Set `JAVA_HOME` to JDK 17 and run Gradle:
   ```powershell
   $env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot"
   $env:Path = "$env:JAVA_HOME\bin;$env:Path"
   .\gradlew.bat assembleDebug
   ```

3. **Install the APK onto Your Device**:
   ```powershell
   adb install -r -d app\build\outputs\apk\debug\app-debug.apk
   ```

4. **Launch the Application**:
   ```powershell
   adb shell am start -n com.dms.edge/com.dms.edge.MainActivity
   ```

#### ⚡ One-Line Command (Build, Install & Launch):
```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot"; $env:Path = "$env:JAVA_HOME\bin;$env:Path"; .\gradlew.bat assembleDebug; adb install -r -d app\build\outputs\apk\debug\app-debug.apk; adb shell am start -n com.dms.edge/com.dms.edge.MainActivity
```

---

### Option B: Using Android Studio

1. Open **Android Studio** (Electric Eel or newer).
2. Choose **Open** and select the `/android-app` directory (`Major-Project/android-app`).
3. Ensure Gradle uses JDK 17 (**Settings** > **Build, Execution, Deployment** > **Build Tools** > **Gradle** > **Gradle JDK** -> Select **JDK 17**).
4. Wait for Gradle to sync dependencies.
5. Select your connected physical phone or emulator in the device dropdown.
6. Click **Run** (`Shift + F10`) or debug icon.

---

## 🧪 Running Unit Tests

Execute unit tests directly via the Gradle wrapper:
```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
.\gradlew.bat testDebugUnitTest
```
- Includes `RiskEngineTest.kt`, verifying score deductions (`-30/-25/-20/-10`), score clamping `[0, 100]`, cooldown debouncing, and multi-event ordering.

---

## 🔒 Runtime Permissions Required

Upon first launch, ensure you grant the required runtime permissions:
- **Camera** (`android.permission.CAMERA`): Real-time front camera stream for driver landmark detection.
- **Location** (`ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`): Speed calculation and trip GPS telemetry.
- **Network** (`INTERNET`, `ACCESS_NETWORK_STATE`): Backend API telemetry sync.

---

## 🎮 In-App Controls & Features

1. **Start Trip**: Tap the blue **START TRIP** button on the HUD to initiate camera monitoring and the risk scoring loop.
2. **Safety Score**: Starts at `100/100` and dynamically decreases if drowsy eyes, yawning, or phone usage is detected.
3. **Audio Warnings**: Built-in `ToneGenerator` triggers audible warning chimes during high-risk events.
4. **Demo Mode Toggle**: Toggle between **Real ML Pipeline Mode** and **Demo Simulation Mode** on the top HUD. In Demo Mode, an amber banner `[DEMO MODE: REPLAY SIMULATION]` appears, and predefined risk events replay at timed intervals.
5. **End Trip**: Tap **STOP TRIP** to conclude monitoring and review summary telemetry.
