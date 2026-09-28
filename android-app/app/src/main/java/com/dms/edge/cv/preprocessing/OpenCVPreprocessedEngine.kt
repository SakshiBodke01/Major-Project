package com.dms.edge.cv.preprocessing

import android.content.Context
import androidx.camera.core.ImageProxy
import com.dms.edge.cv.FrameAnalysisResult
import com.dms.edge.cv.ICVFrameEngine
import com.dms.edge.utils.Logger

/**
 * Integrated Preprocessing Engine implementing ICVFrameEngine.
 * Receives CameraX frames, passes them through OpenCVPreprocessor, and exposes performance metrics.
 */
class OpenCVPreprocessedEngine(
    val preprocessor: OpenCVPreprocessor = OpenCVPreprocessor()
) : ICVFrameEngine {

    private var isInitialized = false

    override fun initialize(context: Context) {
        Logger.i("OpenCVPreprocessedEngine", "OpenCV Preprocessing Pipeline initialized.")
        isInitialized = true
    }

    override fun processFrame(imageProxy: ImageProxy): FrameAnalysisResult {
        return try {
            // Run preprocessing pipeline (Conversion, Rotation, CLAHE, Scaling, ROI)
            val preprocessed = preprocessor.process(imageProxy)

            Logger.d(
                "OpenCVPreprocessedEngine",
                "Frame preprocessed: ${preprocessed.processedWidth}x${preprocessed.processedHeight} " +
                        "in ${preprocessed.processingLatencyMs}ms (Achieved FPS: ${"%.1f".format(preprocessed.achievedFps)})"
            )

            // Return numerical analysis result (Ready for MediaPipe / YOLO)
            FrameAnalysisResult(
                drowsinessScore = 0.02f,
                headPoseYaw = 0.0f,
                headPosePitch = 0.0f,
                isYawning = false,
                isPhoneDetected = false,
                isDistracted = false
            )
        } catch (e: Exception) {
            Logger.e("OpenCVPreprocessedEngine", "Frame processing failed", e)
            FrameAnalysisResult()
        } finally {
            // Guarantee camera RAM buffer release
            imageProxy.close()
        }
    }

    override fun release() {
        Logger.i("OpenCVPreprocessedEngine", "OpenCV Preprocessing Engine released.")
        preprocessor.performanceTracker.reset()
        isInitialized = false
    }
}
