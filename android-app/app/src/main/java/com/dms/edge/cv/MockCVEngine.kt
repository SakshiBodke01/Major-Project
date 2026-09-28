package com.dms.edge.cv

import android.content.Context
import androidx.camera.core.ImageProxy
import com.dms.edge.utils.Logger

/**
 * Foundation / Placeholder Computer Vision Engine implementation.
 * Ensures zero frame data is saved/uploaded and demonstrates RAM buffer release.
 */
class MockCVEngine : ICVFrameEngine {

    private var isInitialized = false

    override fun initialize(context: Context) {
        Logger.i("MockCVEngine", "Initializing Computer Vision Pipeline placeholder...")
        isInitialized = true
    }

    override fun processFrame(imageProxy: ImageProxy): FrameAnalysisResult {
        return try {
            // Placeholder: In future modules, MediaPipe / OpenCV / TFLite / YOLO
            // convert YUV_420_888 imageProxy buffers in RAM to calculate face landmarks & head pose.

            FrameAnalysisResult(
                drowsinessScore = 0.05f,
                headPoseYaw = 0.0f,
                headPosePitch = 0.0f,
                isYawning = false,
                isPhoneDetected = false,
                isDistracted = false
            )
        } catch (e: Exception) {
            Logger.e("MockCVEngine", "Error analyzing local frame", e)
            FrameAnalysisResult()
        } finally {
            // Release ImageProxy RAM buffer immediately
            imageProxy.close()
        }
    }

    override fun release() {
        Logger.i("MockCVEngine", "Releasing Computer Vision Pipeline resources.")
        isInitialized = false
    }
}
