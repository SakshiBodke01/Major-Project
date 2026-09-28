package com.dms.edge.cv

/**
 * Encapsulates the output of a local computer vision frame analysis step.
 * Contains purely numerical scores and detection flags - ZERO image/video data.
 */
data class FrameAnalysisResult(
    val drowsinessScore: Float = 0.0f,      // 0.0 (Alert) to 1.0 (Drowsy)
    val headPoseYaw: Float = 0.0f,          // Head turned left/right degrees
    val headPosePitch: Float = 0.0f,        // Head tilted up/down degrees
    val isYawning: Boolean = false,
    val isPhoneDetected: Boolean = false,
    val isDistracted: Boolean = false,
    val alertType: String? = null,           // e.g. "DROWSINESS", "PHONE", "DISTRACTION"
    val confidence: Float = 1.0f
)
