package com.dms.edge.alert

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioTrack
import android.media.ToneGenerator
import com.dms.edge.engine.RiskEngineEvent
import com.dms.edge.utils.Logger
import kotlin.math.PI
import kotlin.math.sin

/**
 * Audio & Visual Driver Warning Manager for DriveGuard AI.
 * Plays warning chimes and synthesizes an authentic high-volume police siren when score reaches 0.
 */
class AlertManager(private val context: Context? = null) {

    private var toneGenerator: ToneGenerator? = null
    private val lastAudioAlertMap = mutableMapOf<String, Long>()
    private val audioCooldownMs = 4000L

    private var policeAudioTrack: AudioTrack? = null
    private var isSirenActive = false

    init {
        try {
            toneGenerator = ToneGenerator(AudioManager.STREAM_ALARM, 100)
        } catch (e: Exception) {
            Logger.e("AlertManager", "Failed to initialize ToneGenerator", e)
        }
    }

    /**
     * Start high-volume police siren (wail/yelp) when safety score reaches 0 or below.
     */
    fun startEmergencySiren() {
        if (isSirenActive) return
        isSirenActive = true
        Logger.w("AlertManager", "🚨 POLICE SIREN TRIGGERED! Safety score reached 0! Starting high-volume police siren.")

        try {
            // Force device alarm volume to 100% MAXIMUM if context is available
            context?.let { ctx ->
                val audioManager = ctx.getSystemService(Context.AUDIO_SERVICE) as? AudioManager
                val maxAlarmVol = audioManager?.getStreamMaxVolume(AudioManager.STREAM_ALARM)
                if (audioManager != null && maxAlarmVol != null) {
                    audioManager.setStreamVolume(AudioManager.STREAM_ALARM, maxAlarmVol, 0)
                }
            }

            // Synthesize authentic 1-second looping police siren sound wave (PCM 16-bit)
            val sampleRate = 44100
            val durationSec = 1.0
            val numSamples = (sampleRate * durationSec).toInt()
            val buffer = ShortArray(numSamples)

            val fMin = 650.0  // Base police wail frequency (Hz)
            val fMax = 1450.0 // Peak police wail frequency (Hz)
            var currentPhase = 0.0

            for (i in 0 until numSamples) {
                val t = i.toDouble() / sampleRate
                // Sweeps up for 0.5s and sweeps down for 0.5s
                val freq = if (t < 0.5) {
                    fMin + (fMax - fMin) * (t / 0.5)
                } else {
                    fMax - (fMax - fMin) * ((t - 0.5) / 0.5)
                }

                currentPhase += 2.0 * PI * freq / sampleRate
                if (currentPhase > 2.0 * PI) {
                    currentPhase -= 2.0 * PI
                }

                // Add harmonic overtones (2nd and 3rd harmonics) for sharp, piercing police siren acoustic signature
                val rawWave = sin(currentPhase) + 0.30 * sin(2.0 * currentPhase) + 0.15 * sin(3.0 * currentPhase)
                buffer[i] = (rawWave * 22000.0).toInt().coerceIn(-32767, 32767).toShort()
            }

            // Build and play looping AudioTrack on the high-priority STREAM_ALARM channel
            val track = AudioTrack.Builder()
                .setAudioAttributes(
                    AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build()
                )
                .setAudioFormat(
                    AudioFormat.Builder()
                        .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                        .setSampleRate(sampleRate)
                        .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                        .build()
                )
                .setBufferSizeInBytes(buffer.size * 2)
                .setTransferMode(AudioTrack.MODE_STATIC)
                .build()

            track.write(buffer, 0, buffer.size)
            track.setLoopPoints(0, buffer.size, -1) // Infinite continuous loop
            track.setVolume(1.0f)
            track.play()
            policeAudioTrack = track

        } catch (e: Exception) {
            Logger.e("AlertManager", "Error starting police siren", e)
        }
    }

    /**
     * Stop police siren immediately.
     */
    fun stopEmergencySiren() {
        if (!isSirenActive) return
        isSirenActive = false
        Logger.i("AlertManager", "Stopping police siren.")

        try {
            policeAudioTrack?.let { track ->
                if (track.playState == AudioTrack.PLAYSTATE_PLAYING) {
                    track.stop()
                }
                track.release()
            }
            policeAudioTrack = null
        } catch (e: Exception) {
            Logger.e("AlertManager", "Error stopping police siren", e)
        }
    }

    fun isSirenPlaying(): Boolean = isSirenActive

    /**
     * Trigger audio chime or police siren and return formatted visual text.
     */
    fun triggerAlert(event: RiskEngineEvent): String {
        if (event.eventType == "SCORE_RECOVERY") {
            // When score recovers above 0, immediately silence the emergency police siren!
            if (event.currentScore > 0) {
                stopEmergencySiren()
            }
            playRecoveryChime()
            val bonusPts = kotlin.math.abs(event.pointsDeducted)
            return "✅ REWARD: +$bonusPts PTS (1 MIN CLEAN DRIVING)"
        }

        if (event.currentScore <= 0) {
            startEmergencySiren()
            return "🚨 POLICE SIREN ACTIVE: SCORE AT 0! PULL OVER IMMEDIATELY! 🚨"
        } else {
            playAudioChime(event.eventType)
            return formatDriverWarningText(event)
        }
    }

    private fun playRecoveryChime() {
        try {
            toneGenerator?.startTone(ToneGenerator.TONE_PROP_PROMPT, 350)
            Logger.i("AlertManager", "Clean driving recovery chime played.")
        } catch (e: Exception) {
            Logger.e("AlertManager", "Error playing recovery chime", e)
        }
    }

    private fun playAudioChime(eventType: String) {
        val currentTime = System.currentTimeMillis()
        val lastTime = lastAudioAlertMap[eventType] ?: 0L

        if (currentTime - lastTime < audioCooldownMs) {
            return
        }

        lastAudioAlertMap[eventType] = currentTime

        try {
            when (eventType) {
                "DROWSINESS" -> toneGenerator?.startTone(ToneGenerator.TONE_CDMA_HIGH_L, 600)
                "PHONE_USE" -> toneGenerator?.startTone(ToneGenerator.TONE_PROP_BEEP2, 400)
                "DISTRACTION" -> toneGenerator?.startTone(ToneGenerator.TONE_PROP_BEEP, 350)
                "YAWNING" -> toneGenerator?.startTone(ToneGenerator.TONE_PROP_PROMPT, 250)
                else -> toneGenerator?.startTone(ToneGenerator.TONE_PROP_BEEP, 250)
            }
            Logger.i("AlertManager", "Audio alert tone played for event: $eventType")
        } catch (e: Exception) {
            Logger.e("AlertManager", "Error playing audio tone", e)
        }
    }

    private fun formatDriverWarningText(event: RiskEngineEvent): String {
        return when (event.eventType) {
            "SCORE_RECOVERY" -> "SAFE DRIVING REWARD (+${kotlin.math.abs(event.pointsDeducted)} pts)"
            "DROWSINESS" -> "DROWSINESS WARNING (-30 pts)"
            "PHONE_USE" -> "PHONE IN USE (-25 pts)"
            "DISTRACTION" -> "DISTRACTION ALERT (-20 pts)"
            "YAWNING" -> "FATIGUE WARNING (-10 pts)"
            else -> "${event.eventType} (-${event.pointsDeducted} pts)"
        }
    }

    fun release() {
        stopEmergencySiren()
        try {
            toneGenerator?.release()
            toneGenerator = null
            lastAudioAlertMap.clear()
        } catch (e: Exception) {
            Logger.e("AlertManager", "Error releasing ToneGenerator", e)
        }
    }
}
