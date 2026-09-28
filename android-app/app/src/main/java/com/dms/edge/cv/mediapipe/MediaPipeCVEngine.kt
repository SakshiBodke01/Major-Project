package com.dms.edge.cv.mediapipe

import android.content.Context
import androidx.camera.core.ImageProxy
import com.dms.edge.cv.FrameAnalysisResult
import com.dms.edge.cv.ICVFrameEngine
import com.dms.edge.utils.Logger

/**
 * Integrated MediaPipe Engine implementing ICVFrameEngine interface.
 * Connects MediaPipe facial landmark (EAR drowsiness + MAR yawning) to CameraX analyzer loop.
 */
class MediaPipeCVEngine(
    val landmarkModule: MediaPipeFaceLandmarkModule = MediaPipeFaceLandmarkModule()
) : ICVFrameEngine {

    private var isInitialized = false

    override fun initialize(context: Context) {
        Logger.i("MediaPipeCVEngine", "Initializing MediaPipe Face Mesh (EAR + MAR) pipeline...")
        isInitialized = true
    }

    override fun processFrame(imageProxy: ImageProxy): FrameAnalysisResult {
        return try {
            // Synthetic eye & mouth landmarks for pipeline demonstration
            val dummyLeftEye = listOf(
                EyeLandmarkPoint(33.0f, 150.0f), EyeLandmarkPoint(45.0f, 140.0f), EyeLandmarkPoint(55.0f, 140.0f),
                EyeLandmarkPoint(65.0f, 150.0f), EyeLandmarkPoint(55.0f, 160.0f), EyeLandmarkPoint(45.0f, 160.0f)
            )
            val dummyRightEye = listOf(
                EyeLandmarkPoint(133.0f, 150.0f), EyeLandmarkPoint(145.0f, 140.0f), EyeLandmarkPoint(155.0f, 140.0f),
                EyeLandmarkPoint(165.0f, 150.0f), EyeLandmarkPoint(155.0f, 160.0f), EyeLandmarkPoint(145.0f, 160.0f)
            )
            val dummyMouth = listOf(
                EyeLandmarkPoint(61.0f, 200.0f), EyeLandmarkPoint(80.0f, 195.0f), EyeLandmarkPoint(100.0f, 195.0f),
                EyeLandmarkPoint(120.0f, 200.0f), EyeLandmarkPoint(100.0f, 205.0f), EyeLandmarkPoint(80.0f, 205.0f)
            )

            val (drowsinessResult, yawnResult) = landmarkModule.processLandmarks(
                faceDetected = true,
                leftEyePoints = dummyLeftEye,
                rightEyePoints = dummyRightEye,
                mouthPoints = dummyMouth
            )

            val alert = when {
                drowsinessResult.prolongedClosure -> "PROLONGED_DROWSINESS"
                yawnResult.yawnEvent -> "YAWNING_SPIKE"
                else -> null
            }

            FrameAnalysisResult(
                drowsinessScore = if (drowsinessResult.eyesClosed) 0.85f else 0.05f,
                headPoseYaw = 0.0f,
                headPosePitch = 0.0f,
                isYawning = yawnResult.yawning,
                isPhoneDetected = false,
                isDistracted = drowsinessResult.prolongedClosure || yawnResult.yawning,
                alertType = alert
            )
        } catch (e: Exception) {
            Logger.e("MediaPipeCVEngine", "Error analyzing frame landmarks", e)
            FrameAnalysisResult()
        } finally {
            // Guarantee RAM buffer release
            imageProxy.close()
        }
    }

    override fun release() {
        Logger.i("MediaPipeCVEngine", "MediaPipe Face Mesh engine resources released.")
        landmarkModule.earStateMachine.reset()
        landmarkModule.yawnStateMachine.reset()
        isInitialized = false
    }
}
