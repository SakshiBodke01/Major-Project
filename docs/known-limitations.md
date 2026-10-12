# DriveGuard AI - Known Limitations & Hardware Constraints

DriveGuard AI provides an on-device safety monitoring system designed for real-time mobile execution. To uphold academic rigor, technical transparency, and industrial safety compliance, all edge hardware, environmental, and computer vision limitations are documented below.

---

## ⚠️ Environmental & Computer Vision Constraints

### 1. Cabin Illumination & Night Driving Conditions
- **Expected Operation**: OpenCV CLAHE (Contrast Limited Adaptive Histogram Equalization) equalizes local illumination, significantly boosting contrast in dim or shadowed vehicle cabins.
- **Limitation**: In completely pitch-black cabin interiors without ambient dashboard light, street lighting, or Near-Infrared (NIR) illuminators, standard smartphone RGB sensors suffer severe image underexposure.
- **Safe Fallback**: When landmark extraction confidence falls below threshold, `faceDetected = false` is returned. The Risk Engine safely preserves the driver's current safety score without emitting false alerts.

### 2. Eyewear, Tinted Lenses & Heavy Reflections
- **Expected Operation**: Clear prescription glasses, light anti-glare coatings, and standard reading eyewear operate reliably with MediaPipe Face Mesh.
- **Limitation**: Heavy polarized or dark mirrored sunglasses block eyelid and pupil landmark visibility.
- **Safe Fallback**: The facial landmark tracking module evaluates landmark confidence scores ($< 0.50$). If eye landmarks are occluded, EAR deduction is suspended to prevent false drowsiness warnings.

### 3. Extreme Head Pose Rotation Angles
- **Expected Operation**: Driver head yaw rotations within $\pm 45^\circ$ maintain consistent 468-point facial mesh tracking.
- **Limitation**: When a driver turns their head beyond $\pm 70^\circ$ (e.g., checking blind spots over the shoulder or looking into the rear cabin), the far eye becomes occluded.
- **Safe Fallback**: The system uses 3D head pose estimation (`headPoseYaw`, `headPosePitch`) to classify intentional shoulder checks, avoiding false eye-closure triggers.

### 4. Facial Masks & Physical Occlusion
- **Expected Operation**: Detects eye blinks even if lower face landmarks have partial occlusion.
- **Limitation**: Full medical masks (N95) or thick winter scarves covering the mouth prevent Mouth Aspect Ratio (MAR) yawn calculation.
- **Safe Fallback**: The yawn state machine reports indeterminate status while eye monitoring remains fully functional.

---

## 📱 Smartphone Edge Hardware Constraints

### 1. Thermal & Battery Dissipation
- **Observation**: Simultaneous CameraX 30 FPS video streaming, OpenCV CLAHE matrix conversions, and TFLite neural inference place continuous load on mobile CPU/GPU/NPU clusters.
- **Operational Requirement**: The smartphone must be mounted in a vehicle dashboard/windshield holder (ideally aligned with cabin A/C vents) and plugged into continuous 12V/USB-C vehicle power during multi-hour trips.

### 2. Camera Mounting Geometry & Distance
- **Observation**: Smartphone front-facing cameras are wide-angle lenses ($24-28\text{mm}$ equivalent).
- **Operational Requirement**: The phone must be mounted within $50\text{ cm} - 90\text{ cm}$ of the driver's face, positioned near the rearview mirror or dashboard center stack to provide a clear, unobstructed angle.

### 3. Cellular Connectivity Blindspots
- **Observation**: Cellular coverage drops when vehicles enter tunnels, underground parking garages, or remote highway corridors.
- **Resilience Mechanism**: The Android application buffers all numerical telemetry events in a persistent local queue (`OfflineTelemetryQueue.kt`) with exponential backoff retry. No raw data is ever dropped, and score deductions remain active on-device regardless of network state.

---

## 🛡 Academic & Operational Disclaimer

> [!NOTE]
> System metrics and performance indicators reflect edge telemetry ingested from active mobile devices. Operational accuracy assertions require empirical benchmark evaluation on domain-specific, labeled driver video datasets.
