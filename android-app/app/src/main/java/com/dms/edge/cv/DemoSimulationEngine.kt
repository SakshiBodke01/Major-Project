package com.dms.edge.cv

import android.content.Context
import androidx.camera.core.ImageProxy
import com.dms.edge.cv.mediapipe.DrowsinessDetectionResult
import com.dms.edge.cv.mediapipe.YawnDetectionResult
import com.dms.edge.cv.yolo.YoloDetectionResult
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
                leftEar = 0.16f,
                rightEar = 0.15f,
                averageEar = 0.155f,
                eyesClosed = true,
                prolongedClosure = true,
                closureDurationMs = 1800L
            )
        }

        // 2. Replay Phone Usage Event at t = 14s
        if (elapsedSec in 14..16) {
            yoloResult = YoloDetectionResult(
                phoneDetected = true,
                className = "cell phone",
                confidence = 0.92f
            )
        }

        // 3. Replay Yawning Fatigue Event at t = 22s
        if (elapsedSec in 22..24) {
            yawnResult = YawnDetectionResult(
                faceDetected = true,
                mar = 0.62f,
                mouthOpen = true,
                yawning = true,
                yawnEvent = true
            )
        }

        return Triple(drowsinessResult, yawnResult, yoloResult)
    }
}
