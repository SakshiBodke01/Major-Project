package com.dms.edge.cv.mediapipe

/**
 * Clean result container produced by MediaPipe facial landmark & EAR detection module.
 * Separated cleanly from driver score calculations.
 */
data class DrowsinessDetectionResult(
    val faceDetected: Boolean,
    val leftEAR: Float,
    val rightEAR: Float,
    val averageEAR: Float,
    val eyesClosed: Boolean,
    val prolongedClosure: Boolean,
    val closureDurationMs: Long = 0L,
    val timestamp: Long = System.currentTimeMillis()
)
