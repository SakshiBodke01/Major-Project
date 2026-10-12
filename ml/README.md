# DriveGuard AI - Edge Machine Learning Pipeline & Quantization

This directory contains offline scripts, architecture specifications, and quantization workflows for DriveGuard AI's edge-based machine learning modules.

---

## 🎯 Architectural Rationale: Autonomous Edge Inference

In DriveGuard AI, **zero live ML inference takes place on the cloud server**. All computer vision and deep learning models execute locally on the driver's smartphone.

### Why Edge-First?
1. **Absolute Privacy Preservation**: Eliminates video streaming over the air. Raw camera frames remain volatile in device RAM and are closed immediately upon processing (`imageProxy.close()`).
2. **Deterministic Real-Time Latency**: Eliminates network latency jitter. Alert decisions trigger in milliseconds on-device, critical for driver micro-sleeps.
3. **Resilience to Disconnection**: Continued uninterrupted monitoring and audible alerts through cellular blackouts, tunnels, and remote highways.
4. **Massive Cloud Cost Reduction**: Central servers process only tiny JSON telemetry packets (~300 bytes), avoiding costly multi-stream video decoding infrastructure.

---

## 🔬 Edge Computer Vision Modules

### 1. MediaPipe 468-Point 3D Face Mesh
- **Runtime**: MediaPipe Android Face Landmark Solution.
- **Eye Aspect Ratio (EAR)**: Computes eye openness based on 6 landmark pairs per eye:
  $$\text{EAR} = \frac{\|p_2 - p_6\| + \|p_3 - p_5\|}{2 \cdot \|p_1 - p_4\|}$$
  - **Threshold**: $\text{EAR} < 0.21$ indicates eye closure.
  - **Prolonged Closure**: Eyes closed continuously for $\ge 1500\text{ ms}$ triggers a `DROWSINESS` risk event (`-30` pts). Normal blinks ($100-400\text{ ms}$) are ignored.
- **Mouth Aspect Ratio (MAR)**: Evaluates vertical mouth opening:
  $$\text{MAR} = \frac{\|p_{13} - p_{14}\|}{\|p_{78} - p_{308}\|}$$
  - **Threshold**: $\text{MAR} \ge 0.60$ for $\ge 1500\text{ ms}$ classifies a sustained yawn (`-10` pts) with a 5000 ms debounce cooldown to prevent chatter from speech.

### 2. YOLOv8 Mobile Phone Detection Engine
- **Base Architecture**: Ultralytics YOLOv8 Nano (`yolov8n`), optimized for mobile neural processing.
- **Input Resolution**: $320 \times 320 \times 3$ RGB (quantized INT8).
- **Target Class**: Class ID `67` (`"cell phone"`) in COCO or fine-tuned cabin distraction dataset.
- **Non-Maximum Suppression (NMS)**: Intersection-over-Union (IoU) threshold of $0.45$ eliminates redundant overlapping bounding boxes.
- **Temporal Sliding-Window Filter**: Requires positive detection in at least $\ge 3$ out of the last $5$ consecutive frames (`slidingWindowSize = 5`, `requiredConsecutiveFrames = 3`) to eliminate transient false positives from shadows or mirrors.

---

## 🔄 Model Quantization & Mobile Export Workflow

```text
[PyTorch / YOLOv8 Training (.pt)]
               │
               ▼
   [ONNX Intermediate Export]
               │
               ▼
[TensorFlow Graph Optimization]
               │
               ▼
[Post-Training Quantization (INT8)]
  - Calibration on cabin images
  - Dynamic range clamping
               │
               ▼
    [Quantized .tflite File]
               │
               ▼
[android-app/app/src/main/assets/]
```

### Export Commands:
```bash
# 1. Install Ultralytics suite
pip install ultralytics onnx tensorflow

# 2. Export YOLOv8 Nano checkpoint to INT8 TFLite
yolo export model=yolov8n.pt format=tflite int8=True imgsz=320

# 3. Copy quantized artifact to Android assets
cp yolov8n_saved_model/yolov8n_int8.tflite ../android-app/app/src/main/assets/yolov8n_phone.tflite
```

---

## 📐 Mobile Hardware Performance Constraints

| Constraint Parameter | Design Specification | Rationale |
| :--- | :--- | :--- |
| **Model Size** | $\le 15\text{ MB}$ | Fast cold-start loading into mobile RAM |
| **Inference Latency** | $\le 35\text{ ms}$ per frame | Maintains $\ge 25\text{ FPS}$ smooth real-time pipeline |
| **Quantization Precision** | INT8 / FP16 | Enables hardware acceleration via Android NNAPI & GPU |
| **Buffer Management** | Immediate closure (`imageProxy.close()`) | Prevents camera frame buffer starvation in CameraX |
