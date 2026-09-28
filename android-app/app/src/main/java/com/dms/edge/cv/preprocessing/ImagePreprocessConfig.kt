package com.dms.edge.cv.preprocessing

/**
 * Configurable parameters for OpenCV Preprocessing Pipeline.
 * Allows resolution, frame rate, illumination contrast, and rotation to be tuned dynamically.
 */
data class ImagePreprocessConfig(
    val targetWidth: Int = 640,
    val targetHeight: Int = 480,
    val sampleRateFps: Int = 5,
    val enableClahe: Boolean = true,          // Contrast Limited Adaptive Histogram Equalization for cabin lighting
    val enableDenoise: Boolean = false,        // Fast noise reduction
    val rotationDegrees: Int = 0,             // Sensor/device rotation degrees (0, 90, 180, 270)
    val isFrontCamera: Boolean = true,        // Handles horizontal mirroring for front driver camera
    val roiCropMarginRatio: Float = 0.15f      // Driver face region margin ratio
)
