package com.dms.edge.config

/**
 * Central configuration settings for Android Edge application.
 * Controls API endpoints, frame sampling rate, and detection thresholds.
 */
object AppConfig {
    // Backend REST API Base URL (Change to host IP when running on physical Android device)
    const val BASE_URL = "http://10.0.2.2:5000/api/v1/"

    // Frame processing frequency (FPS limit to save edge device battery/thermal)
    const val SAMPLE_RATE_FPS = 5

    // Drowsiness EAR (Eye Aspect Ratio) threshold placeholder
    const val DROWSINESS_EAR_THRESHOLD = 0.22f

    // Distraction threshold in seconds
    const val DISTRACTION_TIMEOUT_SEC = 3.0f

    // Default Driver & Trip IDs for edge session initialization
    const val DEFAULT_DRIVER_ID = "DRV_DEFAULT_001"
    const val DEFAULT_VEHICLE_ID = "VEH_DEFAULT_101"
}
