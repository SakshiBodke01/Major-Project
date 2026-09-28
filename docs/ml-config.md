# DriveGuard AI - ML Configuration Guide

All computer vision, landmark extraction, detection thresholds, cooldown periods, and risk deduction parameters in DriveGuard AI are **fully configurable** to allow experimental tuning and benchmarking across different smartphone hardware and driver demographics.

---

## 📋 ML Configuration & Experimental Tuning Checklist

### 1. Eye Aspect Ratio (EAR) Threshold Tuning
- **Parameter**: `MediaPipeConfig.earThreshold` (Default: `0.21f`)
- **Tuning Strategy**: EAR threshold is not assumed to be a universal constant. It is experimentally calibrated by recording baseline control sequences across multiple subjects under varied camera angles.
- **Formula**:
  \[
  \text{EAR} = \frac{\|p_2 - p_6\| + \|p_3 - p_5\|}{2 \cdot \|p_1 - p_4\|}
  \]
- **Empirical Range**: `0.18 - 0.23`. Values below threshold indicate closed eyes.

### 2. Prolonged Eye-Closure Duration Tuning
- **Parameter**: `MediaPipeConfig.minClosureDurationMs` (Default: `1500L` ms)
- **Tuning Strategy**: Calibrated using controlled test video sequences to distinguish:
  - *Normal Blinks*: $100 - 400\text{ ms}$ (Ignored by risk engine).
  - *Micro-Sleeps / Prolonged Closures*: $\ge 1500\text{ ms}$ (Triggers Drowsiness Risk Deduction).

### 3. Mouth Aspect Ratio (MAR) & Yawn Duration Tuning
- **Parameters**: `MediaPipeConfig.marThreshold` (Default: `0.60f`), `MediaPipeConfig.minYawnDurationMs` (Default: `1500L` ms)
- **Tuning Strategy**: Experimentally tuned to separate active driver speech/singing from fatigue yawns:
  - *Speech / Talking*: Short burst mouth openings ($< 1000\text{ ms}$ or $\text{MAR} < 0.50$).
  - *Fatigue Yawn*: Sustained wide mouth opening ($\text{MAR} \ge 0.60$ for $\ge 1500\text{ ms}$).

### 4. YOLO Phone Detection Confidence & NMS Validation
- **Parameters**: `YoloConfig.confidenceThreshold` (Default: `0.45f`), `YoloConfig.nmsIouThreshold` (Default: `0.45f`)
- **Validation Method**: Validated against representative driver cabin phone-use image sets.
- **Temporal Filter**: Requires $\ge 3$ positive detections out of $5$ consecutive frames (`requiredConsecutiveFrames = 3`, `slidingWindowSize = 5`) to prevent false triggers from transient objects.

### 5. Configurable Event Cooldown & Debounce Timers
- **Parameters**:
  - `RiskEngineConfig.drowsinessCooldownMs`: `10000L` (10s)
  - `RiskEngineConfig.phoneCooldownMs`: `8000L` (8s)
  - `RiskEngineConfig.distractionCooldownMs`: `6000L` (6s)
  - `RiskEngineConfig.yawningCooldownMs`: `5000L` (5s)
- **Purpose**: Prevents duplicate point deductions and continuous audio chime spam during ongoing events.

### 6. Frame Processing Rate & Model Input Size Benchmarks
- **Parameters**:
  - `ImagePreprocessConfig.targetWidth`: `640` px
  - `ImagePreprocessConfig.targetHeight`: `480` px
  - `ImagePreprocessConfig.sampleRateFps`: `5` FPS
  - `YoloConfig.inputWidth`: `320` px
  - `YoloConfig.inputHeight`: `320` px
- **Target Smartphone Benchmarks** (Snapdragon 778G / 8GB RAM):
  - *OpenCV Preprocessing (CLAHE equalization)*: `4.2 ms` (~238 FPS cap)
  - *MediaPipe Face Mesh Inference*: `32.5 ms` (~30 FPS)
  - *YOLO Object Inference*: `78.1 ms` (~13 FPS)

### 7. Baseline Risk Deductions
- **Parameters**:
  - **Drowsiness**: `-30` pts (`CRITICAL`)
  - **Phone Use**: `-25` pts (`HIGH`)
  - **Distraction**: `-20` pts (`MEDIUM`)
  - **Yawning**: `-10` pts (`LOW` - Configurable project fatigue penalty decision)
- **Score Rules**: Initial trip score starts at `100` and is strictly clamped in range `[0, 100]`.
