package com.dms.edge.cv.mediapipe

import com.dms.edge.utils.Logger

/**
 * Temporal State Machine & Debounce Manager for Yawning Detection.
 * 
 * Rules:
 * 1. Distinguishes brief talking/mouth opening (< 1500ms) from true yawning (>= 1500ms).
 * 2. Emits `yawnEvent = true` on the SINGLE frame a yawn is confirmed.
 * 3. Enforces a 5000ms cooldown window to suppress duplicate events during continuous yawning.
 */
class YawnStateMachine(
    private val config: MediaPipeConfig = MediaPipeConfig()
) {

    private var openStartTimeMs: Long? = null
    private var lastYawnEventTimeMs: Long = 0L
    private var hasFiredEventForCurrentYawn = false

    /**
     * Updates yawn state with current frame MAR calculation.
     */
    @Synchronized
    fun update(
        faceDetected: Boolean,
        mar: Float,
        currentTimeMs: Long = System.currentTimeMillis()
    ): YawnDetectionResult {

        if (!faceDetected) {
            openStartTimeMs = null
            hasFiredEventForCurrentYawn = false
            return YawnDetectionResult(
                mar = 0.0f,
                mouthOpen = false,
                yawning = false,
                yawnEvent = false,
                yawnDurationMs = 0L,
                timestamp = currentTimeMs
            )
        }

        val isMouthOpen = mar >= config.marThreshold

        if (isMouthOpen) {
            if (openStartTimeMs == null) {
                openStartTimeMs = currentTimeMs
            }

            val openDuration = currentTimeMs - openStartTimeMs!!
            val isYawning = openDuration >= config.minYawnDurationMs

            // Check Cooldown/Debounce window
            val isInCooldown = (currentTimeMs - lastYawnEventTimeMs) < config.yawnCooldownMs
            var fireYawnEvent = false

            if (isYawning && !hasFiredEventForCurrentYawn && !isInCooldown) {
                fireYawnEvent = true
                hasFiredEventForCurrentYawn = true
                lastYawnEventTimeMs = currentTimeMs

                if (config.enableDebugLogging) {
                    Logger.w("YawnStateMachine", "DISTINCT YAWN EVENT FIRED! Duration: ${openDuration}ms, MAR: ${"%.3f".format(mar)}")
                }
            }

            return YawnDetectionResult(
                mar = mar,
                mouthOpen = true,
                yawning = isYawning,
                yawnEvent = fireYawnEvent,
                yawnDurationMs = openDuration,
                timestamp = currentTimeMs
            )
        } else {
            // Mouth closed: reset open timer & event state
            openStartTimeMs = null
            hasFiredEventForCurrentYawn = false

            return YawnDetectionResult(
                mar = mar,
                mouthOpen = false,
                yawning = false,
                yawnEvent = false,
                yawnDurationMs = 0L,
                timestamp = currentTimeMs
            )
        }
    }

    @Synchronized
    fun reset() {
        openStartTimeMs = null
        lastYawnEventTimeMs = 0L
        hasFiredEventForCurrentYawn = false
    }
}
