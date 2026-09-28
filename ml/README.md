# ML Model Pipeline & Quantization (Offline Environment)

## Purpose & Edge ML Rationale

In this system, **no live ML inference occurs on the server**. Instead, the smartphone acts as an autonomous edge processing node.

This directory contains offline scripts for:
1. Model training and fine-tuning (e.g. MediaPipe Face Mesh, Eye Aspect Ratio classifiers, PERCLOS estimators).
2. Exporting PyTorch / TensorFlow models to ONNX and TensorFlow Lite (`.tflite`) formats.
3. Post-training INT8 quantization to optimize TFLite models for ARM NPU/GPU execution on smartphones.

---

## Model Deployment Workflow

```
[Offline Training / Notebooks] 
           │
           ▼
[Export to ONNX / TFLite]
           │
           ▼
[INT8 / FP16 Quantization]
           │
           ▼
[Copy .tflite to android-app/app/src/main/assets/]
           │
           ▼
[On-Device Real-time Inference (RAM only)]
```

---

## Guidelines for Adding ML Models
- Target model size: **< 15 MB** for mobile latency (< 30ms per frame).
- Input shape: Standard single/dual RGB frame `(1, 224, 224, 3)`.
- Output: Numerical metrics (`drowsinessScore` `[0.0, 1.0]`, `headPoseYaw` `[-90, +90]`, `eyeClosureRatio`).
- Raw camera frames must **never** be saved or transmitted to any external server during or after inference.
