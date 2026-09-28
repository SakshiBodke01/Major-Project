package com.dms.edge.cv

import android.content.Context
import androidx.camera.core.ImageProxy

/**
 * Pluggable Computer Vision Engine Interface for DriveGuard AI.
 * 
 * Implementations (e.g. MediaPipeFaceMeshEngine, OpenCVHeadPoseEngine, YoloPhoneDetectorEngine)
 * receive in-memory camera frames, analyze them locally, and return numerical metrics.
 * 
 * CRITICAL: Implementations must ALWAYS call `imageProxy.close()` to release camera buffers.
 */
interface ICVFrameEngine {
    /**
     * Initialize engine models, weights, or asset resources.
     */
    fun initialize(context: Context)

    /**
     * Process a single video frame from RAM and produce numerical analysis.
     */
    fun processFrame(imageProxy: ImageProxy): FrameAnalysisResult

    /**
     * Release all model resources, memory tensors, or native pointers.
     */
    fun release()
}
