# DriveGuard AI - ML Offline Evaluation & Benchmark Tests

This directory contains offline test scripts and benchmark harnesses for evaluating model precision, inference latency, and quantization loss before deploying models to Android edge devices.

---

## 🎯 Offline Evaluation Metrics

Before deploying any `.tflite` model to the Android client, candidates are evaluated against standard computer vision benchmarks:

| Evaluation Metric | Target Threshold | Description |
| :--- | :--- | :--- |
| **mAP@0.5 (Phone Detection)** | $\ge 0.85$ | Mean Average Precision for handheld phone detection at IoU threshold $0.50$. |
| **Recall (Drowsiness EAR)** | $\ge 0.92$ | Proportion of prolonged closed-eye frames correctly flagged ($\text{EAR} < 0.21$). |
| **Precision (Yawn MAR)** | $\ge 0.88$ | Distinguishes yawning from driver conversation or singing to minimize false alarms. |
| **Quantization Degradation** | $< 2.5\%$ drop | Allowable accuracy reduction when converting FP32 weights to INT8. |
| **Simulated Latency (ARM v8)** | $\le 30\text{ ms}$ | Average inference duration per frame on ARM mobile CPU/NPU cores. |

---

## 🧪 Benchmark Test Execution

```bash
# 1. Install evaluation dependencies
pip install -r requirements.txt

# 2. Run precision & recall evaluation on benchmark test set
python evaluate_phone_detector.py --model ../models/yolov8n_phone.tflite --dataset ./test_data/

# 3. Benchmark TFLite inference latency
python benchmark_latency.py --model ../models/yolov8n_phone.tflite --runs 500
```
