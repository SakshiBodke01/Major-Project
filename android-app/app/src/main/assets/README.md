# DriveGuard AI - Mobile Edge Model Assets Directory

This directory holds quantized TensorFlow Lite (`.tflite`) model files deployed on Android edge devices.

---

## Required Model Assets

### 1. YOLOv8 Nano Distraction / Phone Detection Model
- **Filename**: `yolov8n_phone.tflite`
- **Target Input Resolution**: `320 x 320 x 3` (RGB) or `640 x 640 x 3`
- **Target Class**: Class ID `67` (`"cell phone"`) in COCO dataset, or custom trained driver-distraction dataset (`"phone"`, `"handheld_device"`).
- **Quantization**: INT8 or FP16 quantized for ARM NN / NNAPI mobile acceleration.

---

## Model Conversion Instructions (PyTorch / YOLOv8 -> TFLite)

Execute the following Python command in the `/ml` directory to generate the required `.tflite` file:

```bash
# Install Ultralytics YOLOv8
pip install ultralytics

# Export trained YOLOv8 Nano model to TFLite INT8 format
yolo export model=yolov8n.pt format=tflite int8=True imgsz=320
```

Once exported, copy `yolov8n_int8.tflite` into this directory:
`android-app/app/src/main/assets/yolov8n_phone.tflite`

---

## Engine Behavior when Model is Absent
If `yolov8n_phone.tflite` is not present in this assets folder, `YoloMobileEngine.kt` automatically operates in **Model-Interface Mode**, logging diagnostic notices while allowing UI preview, CameraX pipeline, NMS algorithms, and temporal confirmation testing without app crashes.
