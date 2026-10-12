package com.dms.edge.engine

import com.dms.edge.cv.mediapipe.DrowsinessDetectionResult
import com.dms.edge.cv.mediapipe.YawnDetectionResult
import com.dms.edge.cv.yolo.YoloDetectionResult
import com.dms.edge.utils.Logger
import java.util.UUID
import kotlin.math.max
import kotlin.math.min

/**
 * DriveGuard AI Central Risk Engine.
 * 
 * Rules:
 * 1. Initial Score starts at 100 for each new trip (`resetForNewTrip`).
 * 2. Applies exact project deduction rules:
 *    - Drowsiness: -30 (CRITICAL)
 *    - Phone Use:  -25 (HIGH)
 *    - Distraction: -20 (MEDIUM)
 *    - Yawning:    -10 (LOW - Configurable project fatigue penalty decision)
 * 3. Prevents duplicate deductions during continuous events using per-event cooldown timers.
 * 4. Clamps safety score strictly between 0 and 100.
 * 5. Emits traceable RiskEngineEvent records with explanations for UI display and telemetry sync.
 */
class RiskEngine(
    val config: RiskEngineConfig = RiskEngineConfig(),
    private val onAlertTriggered: ((RiskEngineEvent) -> Unit)? = null
) {
    private var currentScore: Int = config.initialScore
    private val eventHistory = mutableListOf<RiskEngineEvent>()
    private val lastEventTimeMap = mutableMapOf<String, Long>()
    private var lastViolationOrRecoveryTimeMs: Long = System.currentTimeMillis()

    /**
     * Reset safety score and clear history for a new trip session.
     */
    @Synchronized
    fun resetForNewTrip(startTimeMs: Long = System.currentTimeMillis()) {
        currentScore = config.initialScore
        eventHistory.clear()
        lastEventTimeMap.clear()
        lastViolationOrRecoveryTimeMs = startTimeMs
        Logger.i("RiskEngine", "Safety Score reset to ${config.initialScore} for new trip.")
    }

    @Synchronized
    fun getCurrentScore(): Int = currentScore

    @Synchronized
    fun getEventHistory(): List<RiskEngineEvent> = eventHistory.toList()

    @Synchronized
    fun getLastViolationOrRecoveryTimeMs(): Long = lastViolationOrRecoveryTimeMs

    /**
     * Process normalized detection signals from EAR, MAR, and YOLO modules.
     */
    @Synchronized
    fun processSignals(
        drowsiness: DrowsinessDetectionResult? = null,
        yawn: YawnDetectionResult? = null,
        yolo: YoloDetectionResult? = null,
        isDistracted: Boolean = false,
        currentTimeMs: Long = System.currentTimeMillis()
    ): RiskEngineEvent? {

        // 1. Evaluate Drowsiness Signal (EAR prolonged closure >= 1500ms)
        if (drowsiness?.prolongedClosure == true) {
            val event = triggerDeduction(
                eventType = "DROWSINESS",
                deductionAmount = config.drowsinessDeduction,
                severity = "CRITICAL",
                cooldownMs = config.drowsinessCooldownMs,
                reasonText = "Prolonged eye closure detected",
                currentTimeMs = currentTimeMs
            )
            if (event != null) return event
        }

        // 2. Evaluate Phone Usage Signal (YOLO confirmed phone)
        if (yolo?.phoneDetected == true) {
            val event = triggerDeduction(
                eventType = "PHONE_USE",
                deductionAmount = config.phoneDeduction,
                severity = "HIGH",
                cooldownMs = config.phoneCooldownMs,
                reasonText = "Handheld smartphone usage detected",
                currentTimeMs = currentTimeMs
            )
            if (event != null) return event
        }

        // 3. Evaluate Head Pose Distraction Signal (Looking away from road)
        if (isDistracted) {
            val event = triggerDeduction(
                eventType = "DISTRACTION",
                deductionAmount = config.distractionDeduction,
                severity = "MEDIUM",
                cooldownMs = config.distractionCooldownMs,
                reasonText = "Driver distraction / looking away detected",
                currentTimeMs = currentTimeMs
            )
            if (event != null) return event
        }

        // 4. Evaluate Yawning Fatigue Signal (MAR yawn event trigger)
        if (yawn?.yawnEvent == true) {
            val event = triggerDeduction(
                eventType = "YAWNING",
                deductionAmount = config.yawningDeduction,
                severity = "LOW",
                cooldownMs = config.yawningCooldownMs,
                reasonText = "Fatigue signaling (yawning) detected",
                currentTimeMs = currentTimeMs
            )
            if (event != null) return event
        }

        // 5. If no violation triggered, check if driver qualifies for clean driving score recovery (+20 pts after 1 min)
        return checkCleanDrivingRecovery(currentTimeMs)
    }

    /**
     * Checks if the driver has maintained clean driving without breaking any rules for 1 minute (60s).
     * If so, awards +20 points (up to maxScore 100), resets the interval for the next clean minute,
     * and triggers a SCORE_RECOVERY event.
     */
    @Synchronized
    fun checkCleanDrivingRecovery(currentTimeMs: Long = System.currentTimeMillis()): RiskEngineEvent? {
        if (currentScore >= config.maxScore) {
            lastViolationOrRecoveryTimeMs = currentTimeMs
            return null
        }

        val elapsed = currentTimeMs - lastViolationOrRecoveryTimeMs
        if (elapsed >= config.cleanDrivingRecoveryIntervalMs) {
            val previousScore = currentScore
            val bonus = min(config.cleanDrivingBonus, config.maxScore - currentScore)
            currentScore = min(config.maxScore, currentScore + bonus)
            lastViolationOrRecoveryTimeMs = currentTimeMs

            val explanation = "Safe driving for 1 min without violations (+${bonus} pts). Score restored from $previousScore to $currentScore."

            val event = RiskEngineEvent(
                eventId = "EVT_${UUID.randomUUID()}",
                eventType = "SCORE_RECOVERY",
                pointsDeducted = -bonus, // Negative deduction represents points gained (+20)
                previousScore = previousScore,
                currentScore = currentScore,
                severity = "INFO",
                explanation = explanation,
                timestamp = currentTimeMs
            )

            eventHistory.add(event)
            Logger.i("RiskEngine", "SCORE RECOVERY: $explanation")

            onAlertTriggered?.invoke(event)
            return event
        }

        return null
    }

    private fun triggerDeduction(
        eventType: String,
        deductionAmount: Int,
        severity: String,
        cooldownMs: Long,
        reasonText: String,
        currentTimeMs: Long
    ): RiskEngineEvent? {

        val lastTime = lastEventTimeMap[eventType] ?: 0L
        if (currentTimeMs - lastTime < cooldownMs) {
            // Suppress duplicate deduction within cooldown window
            return null
        }

        val previousScore = currentScore
        // Clamp score between min (0) and max (100)
        currentScore = max(config.minScore, min(config.maxScore, currentScore - deductionAmount))
        lastEventTimeMap[eventType] = currentTimeMs
        // Reset 1-minute clean driving recovery timer whenever any rule is broken!
        lastViolationOrRecoveryTimeMs = currentTimeMs

        val explanation = "$reasonText (-$deductionAmount pts). Score reduced from $previousScore to $currentScore."

        val event = RiskEngineEvent(
            eventId = "EVT_${UUID.randomUUID()}",
            eventType = eventType,
            pointsDeducted = deductionAmount,
            previousScore = previousScore,
            currentScore = currentScore,
            severity = severity,
            explanation = explanation,
            timestamp = currentTimeMs
        )

        eventHistory.add(event)
        Logger.w("RiskEngine", "RISK DEDUCTION: $explanation")

        // Trigger local alert listener
        onAlertTriggered?.invoke(event)

        return event
    }
}
