package com.dms.edge.cv.mediapipe

/**
 * Clean result container produced by Mouth Aspect Ratio (MAR) Yawning Detection Module.
 * Decoupled from score deduction logic.
 */
data class YawnDetectionResult(
    val mar: Float,
    val mouthOpen: Boolean,
    val yawning: Boolean,
    val yawnEvent: Boolean,                  // True ONLY on the single frame a distinct yawn event triggers
    val yawnDurationMs: Long = 0L,
    val timestamp: Long = System.currentTimeMillis()
)
