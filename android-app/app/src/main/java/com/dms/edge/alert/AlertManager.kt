package com.dms.edge.alert

import android.media.AudioManager
import android.media.ToneGenerator
import com.dms.edge.engine.RiskEngineEvent
import com.dms.edge.utils.Logger

/**
 * Audio & Visual Driver Warning Manager for DriveGuard AI.
 * 
 * Rules:
 * 1. Plays distinct, non-distracting audio warning tones via Android ToneGenerator.
 * 2. Enforces per-event-type audio cooldowns to prevent alarm chime spamming during driving.
 * 3. Formats concise, high-visibility driver warning reasons for HUD visual banners.
 */
class AlertManager {

    private var toneGenerator: ToneGenerator? = null
    private val lastAudioAlertMap = mutableMapOf<String, Long>()
    private val audioCooldownMs = 5000L // 5s audio cooldown to prevent chime spamming

    init {
        try {
            toneGenerator = ToneGenerator(AudioManager.STREAM_ALARM, 90)
        } catch (e: Exception) {
            Logger.e("AlertManager", "Failed to initialize ToneGenerator", e)
        }
    }

    /**
     * Trigger audio chime and visual banner formatting for a confirmed risk event.
     */
    fun triggerAlert(event: RiskEngineEvent): String {
        playAudioChime(event.eventType)
        return formatDriverWarningText(event)
    }

    private fun playAudioChime(eventType: String) {
        val currentTime = System.currentTimeMillis()
        val lastTime = lastAudioAlertMap[eventType] ?: 0L

        if (currentTime - lastTime < audioCooldownMs) {
            // Suppress audio alert spamming within cooldown
            return
        }

        lastAudioAlertMap[eventType] = currentTime

        try {
            when (eventType) {
                "DROWSINESS" -> toneGenerator?.startTone(ToneGenerator.TONE_CDMA_HIGH_L, 500)
                "PHONE_USE" -> toneGenerator?.startTone(ToneGenerator.TONE_PROP_BEEP2, 350)
                "DISTRACTION" -> toneGenerator?.startTone(ToneGenerator.TONE_PROP_BEEP, 300)
                "YAWNING" -> toneGenerator?.startTone(ToneGenerator.TONE_PROP_PROMPT, 200)
                else -> toneGenerator?.startTone(ToneGenerator.TONE_PROP_BEEP, 200)
            }
            Logger.i("AlertManager", "Audio alert tone played for event: $eventType")
        } catch (e: Exception) {
            Logger.e("AlertManager", "Error playing audio tone", e)
        }
    }

    private fun formatDriverWarningText(event: RiskEngineEvent): String {
        return when (event.eventType) {
            "DROWSINESS" -> "DROWSINESS WARNING (-30 pts)"
            "PHONE_USE" -> "PHONE IN USE (-25 pts)"
            "DISTRACTION" -> "DISTRACTION ALERT (-20 pts)"
            "YAWNING" -> "FATIGUE WARNING (-10 pts)"
            else -> "${event.eventType} (-${event.pointsDeducted} pts)"
        }
    }

    fun release() {
        try {
            toneGenerator?.release()
            toneGenerator = null
            lastAudioAlertMap.clear()
        } catch (e: Exception) {
            Logger.e("AlertManager", "Error releasing ToneGenerator", e)
        }
    }
}
