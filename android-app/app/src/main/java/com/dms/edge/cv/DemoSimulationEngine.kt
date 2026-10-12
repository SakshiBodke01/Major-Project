package com.dms.edge.cv

import android.content.Context
import androidx.camera.core.ImageProxy
import com.dms.edge.cv.mediapipe.DrowsinessDetectionResult
import com.dms.edge.cv.mediapipe.YawnDetectionResult
import com.dms.edge.cv.yolo.YoloDetectionResult
import com.dms.edge.cv.yolo.DetectedObject
import com.dms.edge.cv.yolo.BoundingBox
import com.dms.edge.engine.RiskEngineEvent
import com.dms.edge.utils.Logger

/**
 * Demo Simulation Engine for Academic Project Demonstrations.
 * 
 * CLEARLY SEPARATED FROM REAL ML PIPELINE:
 * This engine replays predefined risk events (Drowsiness, Phone Usage, Yawning)
 * with explicit metadata flagging (`isDemoSimulation = true`) to demonstrate
 * score deductions, chime alerts, and web dashboard updates without asserting
 * live ML inference.
 */
class DemoSimulationEngine {

    private var demoStartTimeMs: Long = 0L
    private var isRunning: Boolean = false

    fun startDemoSimulation() {
        demoStartTimeMs = System.currentTimeMillis()
        isRunning = true
        Logger.i("DemoSimulationEngine", "=== DEMO SIMULATION MODE STARTED ===")
    }

    fun stopDemoSimulation() {
        isRunning = false
        Logger.i("DemoSimulationEngine", "=== DEMO SIMULATION MODE STOPPED ===")
    }

    fun isDemoRunning(): Boolean = isRunning

    /**
     * Replays predefined demo risk signals based on elapsed simulation time.
     */
    fun evaluateDemoStep(
        currentTimeMs: Long = System.currentTimeMillis()
    ): Triple<DrowsinessDetectionResult?, YawnDetectionResult?, YoloDetectionResult?> {
        if (!isRunning) return Triple(null, null, null)

        val elapsedSec = (currentTimeMs - demoStartTimeMs) / 1000

        var drowsinessResult: DrowsinessDetectionResult? = null
        var yawnResult: YawnDetectionResult? = null
        var yoloResult: YoloDetectionResult? = null

        // 1. Replay Drowsiness Event at t = 5s
        if (elapsedSec in 5..7) {
            drowsinessResult = DrowsinessDetectionResult(
                faceDetected = true,
                leftEAR = 0.16f,
                rightEAR = 0.15f,
                averageEAR = 0.155f,
                eyesClosed = true,
                prolongedClosure = true,
                closureDurationMs = 1800L
            )
        }

        // 2. Replay Phone Usage Event at t = 14s
        if (elapsedSec in 14..16) {
            val samplePhone = DetectedObject(
                className = "cell phone",
                classId = 67,
                confidence = 0.92f,
                boundingBox = BoundingBox(0.35f, 0.40f, 0.65f, 0.85f)
            )
            yoloResult = YoloDetectionResult(
                phoneDetected = true,
                rawDetections = listOf(samplePhone),
                confirmedDetections = listOf(samplePhone)
            )
        }

        // 3. Replay Yawning Fatigue Event at t = 22s
        if (elapsedSec in 22..24) {
            yawnResult = YawnDetectionResult(
                mar = 0.62f,
                mouthOpen = true,
                yawning = true,
                yawnEvent = true
            )
        }

        // 4. Replay Severe Eye Closure Event at t = 28s (-30 pts, brings score to 5)
        if (elapsedSec in 28..30) {
            drowsinessResult = DrowsinessDetectionResult(
                faceDetected = true,
                leftEAR = 0.14f,
                rightEAR = 0.14f,
                averageEAR = 0.14f,
                eyesClosed = true,
                prolongedClosure = true,
                closureDurationMs = 2000L
            )
        }

        // 5. Replay Critical Distraction at t = 34s (-25 pts, brings score to 0 -> TRIGGERS HIGH-VOLUME SIREN!)
        if (elapsedSec in 34..36) {
            val samplePhone = DetectedObject(
                className = "cell phone",
                classId = 67,
                confidence = 0.95f,
                boundingBox = BoundingBox(0.35f, 0.40f, 0.65f, 0.85f)
            )
            yoloResult = YoloDetectionResult(
                phoneDetected = true,
                rawDetections = listOf(samplePhone),
                confirmedDetections = listOf(samplePhone)
            )
        }

        return Triple(drowsinessResult, yawnResult, yoloResult)
    }
}
