package com.dms.edge.cv.mediapipe

/**
 * 2D/3D Facial Landmark Point representation.
 */
data class EyeLandmarkPoint(
    val x: Float,
    val y: Float,
    val z: Float = 0.0f
)
