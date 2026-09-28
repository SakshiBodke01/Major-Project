package com.dms.edge.cv.mediapipe

/**
 * Configurable thresholds for MediaPipe Drowsiness (EAR) & Yawning (MAR) detection modules.
 */
data class MediaPipeConfig(
    // Eye Aspect Ratio (EAR) Drowsiness parameters
    val earThreshold: Float = 0.21f,              // Eye Aspect Ratio threshold (eyes closed if < threshold)
    val minClosureDurationMs: Long = 1500L,        // Minimum closure duration in ms to distinguish prolonged closure from normal blink

    // Mouth Aspect Ratio (MAR) Yawning parameters
    val marThreshold: Float = 0.60f,              // Mouth Aspect Ratio threshold (mouth open if >= threshold)
    val minYawnDurationMs: Long = 1500L,           // Minimum mouth open duration in ms to distinguish yawn from talking
    val yawnCooldownMs: Long = 5000L,              // Cooldown / debounce duration in ms between distinct yawn events

    val enableDebugLogging: Boolean = true         // Can be disabled in production environment
)
