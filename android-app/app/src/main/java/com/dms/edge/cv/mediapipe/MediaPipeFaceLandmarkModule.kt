package com.dms.edge.cv.mediapipe

import com.dms.edge.utils.Logger

/**
 * Combined MediaPipe Facial Landmark Module (Eye EAR Drowsiness + Mouth MAR Yawning).
 * Integrates single-pass face mesh landmarks for both eye and mouth analytics.
 * 
 * Independent from score deduction logic.
 */
class MediaPipeFaceLandmarkModule(
    val config: MediaPipeConfig = MediaPipeConfig()
) {
    val earStateMachine = TemporalClosureStateMachine(config)
    val yawnStateMachine = YawnStateMachine(config)

    /**
     * Process extracted eye & mouth landmarks in a single face pass.
     */
    fun processLandmarks(
        faceDetected: Boolean,
        leftEyePoints: List<EyeLandmarkPoint>? = null,
        rightEyePoints: List<EyeLandmarkPoint>? = null,
        mouthPoints: List<EyeLandmarkPoint>? = null,
        timestampMs: Long = System.currentTimeMillis()
    ): Pair<DrowsinessDetectionResult, YawnDetectionResult> {

        if (!faceDetected || leftEyePoints == null || rightEyePoints == null || mouthPoints == null ||
            leftEyePoints.size < 6 || rightEyePoints.size < 6 || mouthPoints.size < 6
        ) {
            val drowsinessResult = earStateMachine.update(false, 0f, 0f, timestampMs)
            val yawnResult = yawnStateMachine.update(false, 0f, timestampMs)
            return Pair(drowsinessResult, yawnResult)
        }

        // 1. Calculate EAR
        val leftEAR = EarCalculator.calculateEAR(
            leftEyePoints[0], leftEyePoints[1], leftEyePoints[2],
            leftEyePoints[3], leftEyePoints[4], leftEyePoints[5]
        )
        val rightEAR = EarCalculator.calculateEAR(
            rightEyePoints[0], rightEyePoints[1], rightEyePoints[2],
            rightEyePoints[3], rightEyePoints[4], rightEyePoints[5]
        )
        val drowsinessResult = earStateMachine.update(true, leftEAR, rightEAR, timestampMs)

        // 2. Calculate MAR
        val mar = MarCalculator.calculateMAR(
            mouthPoints[0], mouthPoints[1], mouthPoints[2],
            mouthPoints[3], mouthPoints[4], mouthPoints[5]
        )
        val yawnResult = yawnStateMachine.update(true, mar, timestampMs)

        if (config.enableDebugLogging) {
            Logger.d(
                "MediaPipeFaceLandmarkModule",
                "EAR: ${"%.3f".format(drowsinessResult.averageEAR)}, MAR: ${"%.3f".format(mar)}, " +
                        "Yawning: ${yawnResult.yawning}, YawnEventFired: ${yawnResult.yawnEvent}"
            )
        }

        return Pair(drowsinessResult, yawnResult)
    }

    /**
     * Helper for eye-only landmark processing (used in focused drowsiness analytics & tests).
     */
    fun processEyeLandmarks(
        faceDetected: Boolean,
        leftEyePoints: List<EyeLandmarkPoint>? = null,
        rightEyePoints: List<EyeLandmarkPoint>? = null,
        timestampMs: Long = System.currentTimeMillis()
    ): DrowsinessDetectionResult {
        if (!faceDetected || leftEyePoints == null || rightEyePoints == null ||
            leftEyePoints.size < 6 || rightEyePoints.size < 6
        ) {
            return earStateMachine.update(false, 0f, 0f, timestampMs)
        }
        val leftEAR = EarCalculator.calculateEAR(
            leftEyePoints[0], leftEyePoints[1], leftEyePoints[2],
            leftEyePoints[3], leftEyePoints[4], leftEyePoints[5]
        )
        val rightEAR = EarCalculator.calculateEAR(
            rightEyePoints[0], rightEyePoints[1], rightEyePoints[2],
            rightEyePoints[3], rightEyePoints[4], rightEyePoints[5]
        )
        return earStateMachine.update(true, leftEAR, rightEAR, timestampMs)
    }
}
