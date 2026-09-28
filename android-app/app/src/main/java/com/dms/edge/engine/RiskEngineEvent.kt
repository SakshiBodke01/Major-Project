package com.dms.edge.engine

/**
 * Traceable risk event object produced by Risk Engine whenever score deduction occurs.
 * Contains human-readable explanation for UI display and backend synchronization.
 */
data class RiskEngineEvent(
    val eventId: String,
    val eventType: String,               // DROWSINESS, PHONE_USE, DISTRACTION, YAWNING
    val pointsDeducted: Int,
    val previousScore: Int,
    val currentScore: Int,
    val severity: String,                // LOW, MEDIUM, HIGH, CRITICAL
    val explanation: String,             // Traceable human-readable explanation
    val timestamp: Long = System.currentTimeMillis()
)
