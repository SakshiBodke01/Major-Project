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

    /**
     * Reset safety score and clear history for a new trip session.
     */
    @Synchronized
    fun resetForNewTrip() {
        currentScore = config.initialScore
        eventHistory.clear()
        lastEventTimeMap.clear()
        Logger.i("RiskEngine", "Safety Score reset to ${config.initialScore} for new trip.")
    }

    @Synchronized
    fun getCurrentScore(): Int = currentScore

    @Synchronized
    fun getEventHistory(): List<RiskEngineEvent> = eventHistory.toList()

    /**
     * Process normalized detection signals from EAR, MAR, and YOLO modules.
     */
    @Synchronized
    fun processSignals(
        drowsiness: DrowsinessDetectionResult? = null,
        yawn: YawnDetectionResult? = null,
        yolo: YoloDetectionResult? = null,
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

        // 3. Evaluate Yawning Fatigue Signal (MAR yawn event trigger)
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
