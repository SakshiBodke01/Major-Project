package com.dms.edge.cv.yolo

/**
 * Configurable parameters for YOLO Mobile Inference Engine.
 */
data class YoloConfig(
    val inputWidth: Int = 320,
    val inputHeight: Int = 320,
    val confidenceThreshold: Float = 0.45f,
    val nmsIouThreshold: Float = 0.45f,
    val requiredConsecutiveFrames: Int = 3,       // Required positive frames out of sliding window
    val slidingWindowSize: Int = 5,
    val modelAssetPath: String = "yolov8n_phone.tflite",
    val targetClassId: Int = 67,                  // COCO class 67: "cell phone"
    val targetClassName: String = "cell phone",
    val enableDebugLogging: Boolean = true
)
