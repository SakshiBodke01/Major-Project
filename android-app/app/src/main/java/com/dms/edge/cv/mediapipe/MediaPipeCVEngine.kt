package com.dms.edge.cv.mediapipe

import android.content.Context
import androidx.annotation.OptIn
import androidx.camera.core.ExperimentalGetImage
import androidx.camera.core.ImageProxy
import com.dms.edge.cv.FrameAnalysisResult
import com.dms.edge.cv.ICVFrameEngine
import com.dms.edge.utils.Logger
import com.google.android.gms.tasks.Tasks
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.face.FaceDetection
import com.google.mlkit.vision.face.FaceDetector
import com.google.mlkit.vision.face.FaceDetectorOptions
import java.util.concurrent.TimeUnit
import kotlin.math.abs

/**
 * Real-time on-device Computer Vision Engine for DriveGuard AI.
 * Uses ML Kit on-device face detector with EAR temporal closure state machine.
 */
class MediaPipeCVEngine(
    val landmarkModule: MediaPipeFaceLandmarkModule = MediaPipeFaceLandmarkModule()
) : ICVFrameEngine {

    private var isInitialized = false
    private var faceDetector: FaceDetector? = null

    @Volatile
    var lastDrowsinessResult: DrowsinessDetectionResult? = null
        private set

    @Volatile
    var lastYawnResult: YawnDetectionResult? = null
        private set

    @Volatile
    var lastHeadYaw: Float = 0.0f
        private set

    override fun initialize(context: Context) {
        try {
            Logger.i("MediaPipeCVEngine", "Initializing ML Kit Face Detection pipeline...")
            val options = FaceDetectorOptions.Builder()
                .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_FAST)
                .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_ALL)
                .build()
            faceDetector = FaceDetection.getClient(options)
            isInitialized = true
        } catch (e: Exception) {
            Logger.e("MediaPipeCVEngine", "Error initializing face detector", e)
        }
    }

    @OptIn(ExperimentalGetImage::class)
    override fun processFrame(imageProxy: ImageProxy): FrameAnalysisResult {
        val currentTimeMs = System.currentTimeMillis()
        return try {
            val mediaImage = imageProxy.image
            val detector = faceDetector

            if (mediaImage != null && detector != null) {
                val inputImage = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
                val faces = Tasks.await(detector.process(inputImage), 500, TimeUnit.MILLISECONDS)

                if (faces.isNotEmpty()) {
                    val face = faces[0]
                    val leftOpen = face.leftEyeOpenProbability ?: 1.0f
                    val rightOpen = face.rightEyeOpenProbability ?: 1.0f
                    val headYaw = face.headEulerAngleY
                    val headPitch = face.headEulerAngleX
                    lastHeadYaw = headYaw

                    // Map eye openness probability (0.0 - 1.0) into EAR scale (0.0 - 0.35)
                    // earThreshold is 0.21. When eyes close (prob < 0.35), EAR drops below 0.20
                    val leftEAR = leftOpen * 0.35f
                    val rightEAR = rightOpen * 0.35f

                    val drowsinessResult = landmarkModule.earStateMachine.update(
                        faceDetected = true,
                        leftEAR = leftEAR,
                        rightEAR = rightEAR,
                        currentTimeMs = currentTimeMs
                    )

                    // Distraction triggered if driver turns head away from road (yaw > 25 degrees)
                    val isDistracted = abs(headYaw) > 25.0f

                    val alert = when {
                        drowsinessResult.prolongedClosure -> "PROLONGED_DROWSINESS"
                        isDistracted -> "HEAD_DISTRACTED"
                        else -> null
                    }

                    lastDrowsinessResult = drowsinessResult
                    lastYawnResult = YawnDetectionResult(
                        mar = 0.2f,
                        mouthOpen = false,
                        yawning = false,
                        yawnEvent = false,
                        timestamp = currentTimeMs
                    )

                    FrameAnalysisResult(
                        drowsinessScore = if (drowsinessResult.eyesClosed) 0.85f else 0.05f,
                        headPoseYaw = headYaw,
                        headPosePitch = headPitch,
                        isYawning = false,
                        isPhoneDetected = false,
                        isDistracted = isDistracted || drowsinessResult.prolongedClosure,
                        alertType = alert
                    )
                } else {
                    val drowsinessResult = landmarkModule.earStateMachine.update(
                        faceDetected = false,
                        leftEAR = 0.0f,
                        rightEAR = 0.0f,
                        currentTimeMs = currentTimeMs
                    )
                    lastDrowsinessResult = drowsinessResult
                    FrameAnalysisResult(alertType = null)
                }
            } else {
                FrameAnalysisResult(alertType = null)
            }
        } catch (e: Exception) {
            Logger.e("MediaPipeCVEngine", "Error analyzing frame", e)
            FrameAnalysisResult()
        } finally {
            imageProxy.close()
        }
    }

    override fun release() {
        try {
            faceDetector?.close()
            faceDetector = null
            landmarkModule.earStateMachine.reset()
            landmarkModule.yawnStateMachine.reset()
            isInitialized = false
        } catch (e: Exception) {
            Logger.e("MediaPipeCVEngine", "Error releasing face detector", e)
        }
    }
}
