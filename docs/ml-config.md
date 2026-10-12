# DriveGuard AI - Machine Learning Configuration & Tuning Guide

All computer vision thresholds, facial landmark ratios, temporal filters, cooldown periods, and risk deduction penalties in DriveGuard AI are **fully configurable** to facilitate empirical tuning and benchmarking across varying smartphone hardware and driver demographics.

---

## ⚙️ Configurable Parameter Reference

### 1. Eye Aspect Ratio (EAR) Threshold Tuning
- **Configuration Parameter**: `MediaPipeConfig.earThreshold` (Default: `0.21f`)
- **Mathematical Formula**:
  $$\text{EAR} = \frac{\|p_2 - p_6\| + \|p_3 - p_5\|}{2 \cdot \|p_1 - p_4\|}$$
  Where $p_1 \dots p_6$ correspond to the 6 canonical 2D/3D eye landmarks extracted by MediaPipe 468-point mesh.
- **Empirical Calibration**:
  - Open eye baseline: $\text{EAR} \in [0.28, 0.38]$
  - Partially closed / squinting: $\text{EAR} \in [0.22, 0.27]$
  - Closed eye: $\text{EAR} < 0.21$
- **Code Location**: `com.dms.edge.cv.mediapipe.MediaPipeConfig.kt` and `EarCalculator.kt`

### 2. Prolonged Eye-Closure Duration (Drowsiness)
- **Configuration Parameter**: `MediaPipeConfig.minClosureDurationMs` (Default: `1500L` ms)
- **Classification Thresholds**:
  - *Normal Physiological Blinks*: $100 - 400\text{ ms}$ (Ignored by Risk Engine)
  - *Slow Blinks*: $400 - 1200\text{ ms}$ (Flagged for vigilance degradation)
  - *Micro-Sleeps / Prolonged Closure*: $\ge 1500\text{ ms}$ (Triggers `DROWSINESS` critical alert `-30` pts)

### 3. Mouth Aspect Ratio (MAR) & Yawn Detection
- **Configuration Parameters**:
  - `MediaPipeConfig.marThreshold` (Default: `0.60f`)
  - `MediaPipeConfig.minYawnDurationMs` (Default: `1500L` ms)
  - `MediaPipeConfig.yawnCooldownMs` (Default: `5000L` ms)
- **Mathematical Formula**:
  $$\text{MAR} = \frac{\|p_{13} - p_{14}\|}{\|p_{78} - p_{308}\|}$$
- **Speech vs. Yawn Discrimination**:
  - *Normal Speech / Singing*: Brief mouth openings ($< 1000\text{ ms}$ or $\text{MAR} < 0.50$)
  - *Fatigue Yawn*: Sustained wide mouth opening ($\text{MAR} \ge 0.60$ for $\ge 1500\text{ ms}$)

### 4. YOLO Distraction Detection & Temporal Filter
- **Configuration Parameters**:
  - `YoloConfig.confidenceThreshold` (Default: `0.45f`)
  - `YoloConfig.nmsIouThreshold` (Default: `0.45f`)
  - `YoloConfig.slidingWindowSize` (Default: `5` frames)
  - `YoloConfig.requiredConsecutiveFrames` (Default: `3` frames)
- **Temporal Sliding-Window Filter**: Requires positive handheld phone detection in at least $3$ out of $5$ consecutive frames to eliminate momentary false triggers caused by vehicle reflections or shadows.

### 5. Event Cooldown & Anti-Chatter Timers
- **Configuration Parameters** (`RiskEngineConfig.kt`):
  - `drowsinessCooldownMs`: `10000L` (10 seconds)
  - `phoneCooldownMs`: `8000L` (8 seconds)
  - `distractionCooldownMs`: `6000L` (6 seconds)
  - `yawningCooldownMs`: `5000L` (5 seconds)
- **Purpose**: Prevents repeated point deductions and continuous audio chime spam while an existing violation persists.

---

## 🏎 Edge Hardware Benchmark Targets

Benchmarked on mid-range reference hardware (Qualcomm Snapdragon 778G / 8GB RAM / Android 14):

| Pipeline Stage | Module File | Execution Time | Max Frame Rate |
| :--- | :--- | :--- | :--- |
| **Frame Preprocessing (CLAHE)** | `OpenCVPreprocessor.kt` | `4.2 ms` | ~238 FPS cap |
| **Face Mesh (468 Landmarks)** | `MediaPipeFaceLandmarkModule.kt` | `32.5 ms` | ~30 FPS |
| **YOLO Phone Detector** | `YoloMobileEngine.kt` | `78.1 ms` | ~13 FPS |
| **Combined Pipeline** | `DriverMonitoringAnalyzer.kt` | `38.0 ms` | **~26 FPS** |

---

## 🎯 Baseline Risk Deduction Schedule

Trip score is initialized to `100` and is strictly clamped in the range `[0, 100]`:

| Risk Event Type | Severity Code | Points Deducted | In-Cabin Audio Chime |
| :--- | :--- | :--- | :--- |
| **DROWSINESS** | `CRITICAL` | `-30` pts | High-priority repeating tone (`TONE_CDMA_HIGH_L`) |
| **PHONE_USE** | `HIGH` | `-25` pts | Prompt double alert tone (`TONE_PROP_BEEP2`) |
| **DISTRACTION** | `MEDIUM` | `-20` pts | Single alert tone (`TONE_PROP_BEEP`) |
| **YAWNING** | `LOW` | `-10` pts | Gentle reminder chime (`TONE_PROP_PROMPT`) |
