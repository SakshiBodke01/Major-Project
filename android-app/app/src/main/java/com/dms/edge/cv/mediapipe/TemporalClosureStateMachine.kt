package com.dms.edge.cv.mediapipe

import com.dms.edge.utils.Logger

/**
 * Temporal State Machine for Eye Closure Tracking.
 * Distinguishes normal eye blinks (100ms - 250ms) from prolonged eye closure (>= 1500ms).
 */
class TemporalClosureStateMachine(
    private val config: MediaPipeConfig = MediaPipeConfig()
) {

    private var closureStartTimeMs: Long? = null

    /**
     * Process frame EAR metrics and update temporal state.
     * @param faceDetected Whether driver face was detected in current frame
     * @param leftEAR Left Eye Aspect Ratio
     * @param rightEAR Right Eye Aspect Ratio
     * @param currentTimeMs Current timestamp
     */
    @Synchronized
    fun update(
        faceDetected: Boolean,
        leftEAR: Float,
        rightEAR: Float,
        currentTimeMs: Long = System.currentTimeMillis()
    ): DrowsinessDetectionResult {

        if (!faceDetected) {
            // Reset state safely when face is lost without throwing errors
            closureStartTimeMs = null
            if (config.enableDebugLogging) {
                Logger.d("TemporalStateMachine", "Face lost. Resetting eye closure timers safely.")
            }
            return DrowsinessDetectionResult(
                faceDetected = false,
                leftEAR = 0.0f,
                rightEAR = 0.0f,
                averageEAR = 0.0f,
                eyesClosed = false,
                prolongedClosure = false,
                closureDurationMs = 0L,
                timestamp = currentTimeMs
            )
        }

        val avgEAR = (leftEAR + rightEAR) / 2.0f
        val isClosedCurrentFrame = avgEAR < config.earThreshold

        if (isClosedCurrentFrame) {
            if (closureStartTimeMs == null) {
                closureStartTimeMs = currentTimeMs
            }

            val closureDuration = currentTimeMs - closureStartTimeMs!!
            val isProlonged = closureDuration >= config.minClosureDurationMs

            if (config.enableDebugLogging && isProlonged) {
                Logger.w("TemporalStateMachine", "PROLONGED EYE CLOSURE DETECTED! Duration: ${closureDuration}ms (EAR: ${"%.3f".format(avgEAR)})")
            }

            return DrowsinessDetectionResult(
                faceDetected = true,
                leftEAR = leftEAR,
                rightEAR = rightEAR,
                averageEAR = avgEAR,
                eyesClosed = true,
                prolongedClosure = isProlonged,
                closureDurationMs = closureDuration,
                timestamp = currentTimeMs
            )
        } else {
            // Eyes open: reset closure timer cleanly (Normal blink concluded)
            closureStartTimeMs = null

            return DrowsinessDetectionResult(
                faceDetected = true,
                leftEAR = leftEAR,
                rightEAR = rightEAR,
                averageEAR = avgEAR,
                eyesClosed = false,
                prolongedClosure = false,
                closureDurationMs = 0L,
                timestamp = currentTimeMs
            )
        }
    }

    @Synchronized
    fun reset() {
        closureStartTimeMs = null
    }
}
