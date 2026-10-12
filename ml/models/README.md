# DriveGuard AI - Trained Model Checkpoints & Export Directory

This directory stores offline trained weights, ONNX intermediate graphs, and exported TensorFlow Lite (`.tflite`) binaries for DriveGuard AI's edge vision modules.

---

## 📦 Model Artifact Specifications

### 1. `yolov8n_phone.tflite` (Handheld Smartphone Detection)
- **Format**: TensorFlow Lite FlatBuffer (INT8 Quantized)
- **Source Model**: Ultralytics YOLOv8 Nano (`yolov8n.pt`)
- **Input Dimensions**: `1 x 320 x 320 x 3` (Normalized RGB float/int8)
- **Output Tensors**: Bounding box coordinates `[cx, cy, w, h]`, class confidence score `[0.0, 1.0]`
- **Target Class**: COCO Class ID `67` (`cell phone`)
- **Deployment Destination**:
  ```text
  android-app/app/src/main/assets/yolov8n_phone.tflite
  ```

### 2. MediaPipe Face Landmark Bundle
- Handled natively through the Google MediaPipe Android Face Landmark Task library (`com.google.mediapipe:tasks-vision`).
- Dynamically loads the 468-point 3D canonical face mesh model for EAR and MAR computation.

---

## 🛡 Fallback Mode when Model Asset is Absent

When `yolov8n_phone.tflite` is not deployed in `android-app/app/src/main/assets/`, the mobile application's `YoloMobileEngine.kt` automatically enters **Model-Interface Mode**:
- Logs a clear informational diagnostic message without crashing.
- Maintains CameraX frame analysis lifecycle, HUD overlay rendering, and risk engine state transitions.
- Allows full unit testing and academic demonstration via the HUD **Demo Simulation Toggle**.
