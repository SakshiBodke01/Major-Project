package com.dms.edge.cv.yolo

/**
 * Structured YOLO object detection prediction.
 */
data class DetectedObject(
    val className: String,
    val classId: Int,
    val confidence: Float,
    val boundingBox: BoundingBox,
    val timestamp: Long = System.currentTimeMillis()
)
