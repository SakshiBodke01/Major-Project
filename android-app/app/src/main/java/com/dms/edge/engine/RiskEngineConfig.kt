package com.dms.edge.engine

/**
 * Configuration parameters and deduction rules for DriveGuard AI Risk Engine.
 * All thresholds, deduction amounts, and cooldown durations are fully configurable.
 */
data class RiskEngineConfig(
    val initialScore: Int = 100,
    val minScore: Int = 0,
    val maxScore: Int = 100,

    // Stated Project Synopsis Deductions
    val drowsinessDeduction: Int = 30,             // Drowsiness penalty (-30)
    val phoneDeduction: Int = 25,                  // Phone usage penalty (-25)
    val distractionDeduction: Int = 20,            // General distraction penalty (-20)
    
    // Project Configuration Decision for Fatigue Signaling
    val yawningDeduction: Int = 10,                // Configurable Yawning fatigue warning penalty (-10)

    // Cooldown / Recovery Periods (ms) to prevent duplicate deductions during continuous events
    val drowsinessCooldownMs: Long = 10000L,       // 10s cooldown
    val phoneCooldownMs: Long = 8000L,             // 8s cooldown
    val distractionCooldownMs: Long = 6000L,       // 6s cooldown
    val yawningCooldownMs: Long = 5000L            // 5s cooldown
)
