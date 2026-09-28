# DriveGuard AI - Known Limitations & Hardware Constraints

DriveGuard AI provides an on-device safety monitoring system. To maintain academic rigor and technical transparency, all edge hardware and computer vision limitations are documented below.

---

## ⚠️ Known Computer Vision & Edge Limitations

### 1. Cabin Illumination & Night Driving Constraints
- **Behavior**: OpenCV CLAHE (Contrast Limited Adaptive Histogram Equalization) significantly enhances cabin contrast in low-light environments.
- **Limitation**: In pitch-black night driving without near-infrared (NIR) illuminators or cabin lighting, standard RGB camera sensors cannot capture clear facial landmarks.
- **Safe Fallback**: `faceDetected = false` maintains driver safety score without triggering false alerts.

### 2. Heavy Reflective Sunglasses & Eyewear
- **Behavior**: Clear prescription glasses operate normally with MediaPipe face mesh.
- **Limitation**: Heavy dark reflective sunglasses block pupil and eyelid landmark visibility.
- **Safe Fallback**: Landmark confidence drops below `0.50`, causing the system to bypass EAR deduction rather than spamming false warnings.

### 3. Extreme Head Pose Rotation Angles
- **Behavior**: Head pose yaw angles up to $\pm 45^\circ$ maintain accurate face landmark tracking.
- **Limitation**: Head rotations exceeding $70^\circ$ (driver looking completely backwards or sideways) occlude secondary eye landmarks.

### 4. Hardware Thermal & Battery Impact
- **Behavior**: CameraX and TFLite inference run efficiently on multi-core ARM mobile processors.
- **Limitation**: Continuous real-time camera inference for multi-hour trips generates heat and battery drain if the device is not mounted near a vehicle A/C vent and connected to a charger.

---

## 🛡 Disclaimer Notice

> [!NOTE]
> System metrics reflect edge telemetry ingested from active mobile devices. Operational accuracy assertions require benchmark evaluation on labeled driver datasets.
