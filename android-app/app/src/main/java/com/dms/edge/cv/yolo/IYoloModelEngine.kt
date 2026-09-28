package com.dms.edge.cv.yolo

import android.content.Context
import androidx.camera.core.ImageProxy

/**
 * Model interface for Mobile YOLO Object Detection Engine.
 * Supports drop-in YOLOv8 Nano / TFLite quantized object detection models.
 */
interface IYoloModelEngine {
    fun initialize(context: Context): Boolean
    fun detect(imageProxy: ImageProxy): YoloDetectionResult
    fun isModelLoaded(): Boolean
    fun release()
}
