# DriveGuard AI - Privacy & Data-Flow Architecture

DriveGuard AI is built on a **Privacy-First By Design** architectural framework. Visual data remains strictly isolated on the driver's smartphone device.

---

## 🔒 Core Privacy Invariants

1. **Zero Video / Image Egress**: Raw camera video frames, face crops, and biometric imagery NEVER leave the mobile device's local memory.
2. **Transient Image Proxy Lifecycle**: CameraX `ImageProxy` YUV buffers are converted to OpenCV/MediaPipe formats in RAM and explicitly closed (`imageProxy.close()`) immediately after inference.
3. **Telemetry Ingestion Scope**: The central server receives only numerical metrics (`drowsinessScore`, `pointsDeducted`), event type codes (`DROWSINESS`, `PHONE_USE`), GPS fixes, and safety scores.
4. **Backend Payload Sanitization**: The Node.js API automatically inspects metadata payloads and discards any base64 string fields exceeding 500 characters.

---

## 🔄 End-to-End Data Flow Sequence

```text
[Driver Front Camera]
        |
        v (CameraX YUV_420_888 ImageProxy in RAM)
[OpenCV Preprocessor] --> (Rotated, Contrast-Enhanced Mat in RAM)
        |
        +---> [MediaPipe Face Mesh] --> (468 3D Landmark Coordinates in RAM)
        |           |
        |           +---> [EarCalculator] --> (EAR Float: 0.16)
        |           +---> [MarCalculator] --> (MAR Float: 0.62)
        |
        +---> [YOLO Engine] ----------> (BoundingBox BBoxes in RAM)
        |
        v
[Central Risk Engine]
        | (Evaluates temporal closure >= 1500ms -> Deducts 30 pts)
        |---> [AlertManager] ---------> (Audio Chime & Visual HUD Alert)
        |
        v (Structured Numerical Telemetry Payload)
[Offline Telemetry Queue]
        |
        v (HTTPS REST API POST /api/risk-events)
[Backend Telemetry API]
        |
        +---> [MongoDB Database]
        |
        v (WebSocket / REST API GET /api/analytics)
[React Fleet Web Dashboard] (Displays Score 70 & Event Type Code)
```

---

## 📄 Transmitted Telemetry Payload Example

Notice the complete absence of raw visual data:

```json
{
  "eventId": "EVT_3a8d0a15-3a8a-4d4e-9bc7-237df159e829",
  "tripId": "TRIP_20260906_101",
  "driverId": "DRV_ALEX_MERCER",
  "type": "DROWSINESS",
  "severity": "CRITICAL",
  "pointsDeducted": 30,
  "latitude": 37.7750,
  "longitude": -122.4195,
  "confidence": 0.94,
  "metadata": {
    "earScore": 0.16,
    "closureDurationMs": 1800
  },
  "timestamp": "2026-09-06T11:15:00.000Z"
}
```
