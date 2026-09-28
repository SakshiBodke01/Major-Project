package com.dms.edge.cv.yolo

/**
 * Output data container of YOLO Object Detection pipeline.
 * Separated cleanly from risk engine scoring logic.
 */
data class YoloDetectionResult(
    val phoneDetected: Boolean,
    val rawDetections: List<DetectedObject> = emptyList(),
    val confirmedDetections: List<DetectedObject> = emptyList(),
    val inferenceLatencyMs: Long = 0L,
    val achievedFps: Float = 0.0f,
    val timestamp: Long = System.currentTimeMillis()
)
