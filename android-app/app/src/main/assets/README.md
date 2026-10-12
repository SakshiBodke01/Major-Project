# DriveGuard AI - Mobile Edge Model Assets Directory

This directory stores quantized TensorFlow Lite (`.tflite`) model files packaged into the Android application APK and loaded at runtime by the edge computer vision engines.

---

## 📦 Required Model Assets

### 1. YOLOv8 Nano Distraction & Phone Detection Model
- **Filename**: `yolov8n_phone.tflite`
- **Target Resolution**: `320 x 320 x 3` (RGB) or `640 x 640 x 3`
- **Target Class**: Class ID `67` (`"cell phone"`) in COCO dataset, or custom trained driver-distraction dataset (`"phone"`, `"handheld_device"`).
- **Quantization**: INT8 or FP16 quantized for ARM NN / NNAPI mobile acceleration.
- **Config Path**: Configured via `YoloConfig.kt` (`modelAssetPath = "yolov8n_phone.tflite"`).

---

## 🛠 Model Conversion & Export Instructions

Execute the following Python commands in the `/ml` directory to generate the required `.tflite` model:

```bash
# 1. Install Ultralytics suite
pip install ultralytics

# 2. Export YOLOv8 Nano checkpoint to TFLite INT8 format
yolo export model=yolov8n.pt format=tflite int8=True imgsz=320

# 3. Copy the quantized artifact into this assets directory
cp yolov8n_saved_model/yolov8n_int8.tflite android-app/app/src/main/assets/yolov8n_phone.tflite
```

---

## 🛡 Graceful Fallback Mode

If `yolov8n_phone.tflite` is not present in this folder:
- `YoloMobileEngine.kt` automatically activates **Model-Interface Mode**, logging diagnostic notices (`Logger.i`).
- The CameraX video pipeline, OpenCV CLAHE preprocessor, MediaPipe 468-point face mesh, NMS algorithms, and UI HUD run continuously without crashing.
- Demonstration and integration testing can proceed seamlessly via the HUD **Demo Simulation Toggle**.
