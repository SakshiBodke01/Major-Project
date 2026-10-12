# DriveGuard AI - ML Threshold & Pipeline Configuration Guide

> [!NOTE]
> This guide is synchronized with [ML Configuration Guide](ml-config.md). Refer to `docs/ml-config.md` for extended formulas, benchmark data, and code references.

All computer vision thresholds, facial landmark ratios, temporal filters, cooldown periods, and risk deduction penalties in DriveGuard AI are **fully configurable** to facilitate empirical tuning and benchmarking across varying smartphone hardware and driver demographics.

---

## ⚙️ Summary of Threshold Values

| Module | Configuration Key | Default Value | Tuned Range | Functional Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **EAR Eye Closure** | `MediaPipeConfig.earThreshold` | `0.21f` | `0.18 - 0.23` | Identifies closed eyes |
| **Eye Closure Duration** | `MediaPipeConfig.minClosureDurationMs` | `1500L` ms | `1000 - 2000L` | Qualifies drowsiness / micro-sleep |
| **MAR Yawn Opening** | `MediaPipeConfig.marThreshold` | `0.60f` | `0.55 - 0.65` | Distinguishes yawning from talking |
| **Yawn Duration** | `MediaPipeConfig.minYawnDurationMs` | `1500L` ms | `1200 - 2000L` | Sustained yawn duration requirement |
| **Yawn Cooldown** | `MediaPipeConfig.yawnCooldownMs` | `5000L` ms | `3000 - 8000L` | Debounce period between yawns |
| **YOLO Confidence** | `YoloConfig.confidenceThreshold` | `0.45f` | `0.40 - 0.60` | Minimum detection confidence score |
| **YOLO NMS IoU** | `YoloConfig.nmsIouThreshold` | `0.45f` | `0.40 - 0.50` | Overlap suppression threshold |
| **Temporal Window** | `YoloConfig.slidingWindowSize` | `5` frames | `3 - 7` | Sliding confirmation history |
| **Required Confirmations**| `YoloConfig.requiredConsecutiveFrames` | `3` frames | `2 - 4` | Required detections inside window |

---

## 🎯 Scoring & Penalty Rules

- **Initial Score**: `100` points
- **Score Range**: Strictly clamped to `[0, 100]`
- **Penalties**:
  - `DROWSINESS`: `-30` points (`CRITICAL`)
  - `PHONE_USE`: `-25` points (`HIGH`)
  - `DISTRACTION`: `-20` points (`MEDIUM`)
  - `YAWNING`: `-10` points (`LOW`)
- **Anti-Spam Cooldowns**:
  - Drowsiness: `10000 ms` (10s)
  - Phone: `8000 ms` (8s)
  - Distraction: `6000 ms` (6s)
  - Yawning: `5000 ms` (5s)
