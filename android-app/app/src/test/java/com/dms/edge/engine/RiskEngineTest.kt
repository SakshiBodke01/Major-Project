package com.dms.edge.engine

import com.dms.edge.cv.mediapipe.DrowsinessDetectionResult
import com.dms.edge.cv.mediapipe.YawnDetectionResult
import com.dms.edge.cv.yolo.YoloDetectionResult
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

/**
 * Unit Tests for DriveGuard AI Central Risk Engine.
 */
class RiskEngineTest {

    private lateinit var riskEngine: RiskEngine
    private val config = RiskEngineConfig()

    @Before
    fun setUp() {
        riskEngine = RiskEngine(config)
    }

    @Test
    fun testInitialScoreIs100() {
        assertEquals(100, riskEngine.getCurrentScore())
    }

    @Test
    fun testDrowsinessDeductionExactValue() {
        val t0 = 1000000L
        val drowsinessSignal = DrowsinessDetectionResult(
            faceDetected = true, leftEAR = 0.15f, rightEAR = 0.15f, averageEAR = 0.15f,
            eyesClosed = true, prolongedClosure = true, closureDurationMs = 1600L, timestamp = t0
        )

        val event = riskEngine.processSignals(drowsiness = drowsinessSignal, currentTimeMs = t0)

        assertNotNull(event)
        assertEquals("DROWSINESS", event?.eventType)
        assertEquals(30, event?.pointsDeducted) // Project synopsis value -30
        assertEquals(70, event?.currentScore)  // 100 - 30 = 70
        assertEquals(70, riskEngine.getCurrentScore())
        assertTrue("Explanation must detail deduction", event?.explanation?.contains("-30 pts") == true)
    }

    @Test
    fun testPhoneUsageDeductionExactValue() {
        val t0 = 1000000L
        val phoneSignal = YoloDetectionResult(phoneDetected = true, timestamp = t0)

        val event = riskEngine.processSignals(yolo = phoneSignal, currentTimeMs = t0)

        assertNotNull(event)
        assertEquals("PHONE_USE", event?.eventType)
        assertEquals(25, event?.pointsDeducted) // Project synopsis value -25
        assertEquals(75, event?.currentScore)  // 100 - 25 = 75
    }

    @Test
    fun testYawningDeductionConfigurableDefault() {
        val t0 = 1000000L
        val yawnSignal = YawnDetectionResult(
            mar = 0.80f, mouthOpen = true, yawning = true, yawnEvent = true, timestamp = t0
        )

        val event = riskEngine.processSignals(yawn = yawnSignal, currentTimeMs = t0)

        assertNotNull(event)
        assertEquals("YAWNING", event?.eventType)
        assertEquals(10, event?.pointsDeducted) // Configured default -10
        assertEquals(90, event?.currentScore)  // 100 - 10 = 90
    }

    @Test
    fun testCooldownSuppressesDuplicateFrameDeductions() {
        val t0 = 1000000L
        val drowsinessSignal = DrowsinessDetectionResult(
            faceDetected = true, leftEAR = 0.15f, rightEAR = 0.15f, averageEAR = 0.15f,
            eyesClosed = true, prolongedClosure = true, closureDurationMs = 1600L, timestamp = t0
        )

        // 1. Initial event at t = 0
        val event1 = riskEngine.processSignals(drowsiness = drowsinessSignal, currentTimeMs = t0)
        assertNotNull(event1)
        assertEquals(70, riskEngine.getCurrentScore())

        // 2. Next frame at t = +200ms (within 10s cooldown window) -> MUST SUPPRESS DEDUCTION
        val event2 = riskEngine.processSignals(drowsiness = drowsinessSignal, currentTimeMs = t0 + 200)
        assertNull("Duplicate frame deduction MUST be suppressed within cooldown window!", event2)
        assertEquals("Score MUST remain 70 during cooldown", 70, riskEngine.getCurrentScore())
    }

    @Test
    fun testScoreClampingAtZeroLowerBound() {
        val t0 = 1000000L

        // Trigger multiple deductions over time past cooldowns
        riskEngine.processSignals(
            drowsiness = DrowsinessDetectionResult(true, 0f, 0f, 0f, true, true, 1600L, t0),
            currentTimeMs = t0
        ) // 100 -> 70

        riskEngine.processSignals(
            yolo = YoloDetectionResult(phoneDetected = true, timestamp = t0 + 15000),
            currentTimeMs = t0 + 15000
        ) // 70 -> 45

        riskEngine.processSignals(
            drowsiness = DrowsinessDetectionResult(true, 0f, 0f, 0f, true, true, 1600L, t0 + 30000),
            currentTimeMs = t0 + 30000
        ) // 45 -> 15

        val finalEvent = riskEngine.processSignals(
            drowsiness = DrowsinessDetectionResult(true, 0f, 0f, 0f, true, true, 1600L, t0 + 45000),
            currentTimeMs = t0 + 45000
        ) // 15 - 30 -> Clamped to 0

        assertNotNull(finalEvent)
        assertEquals("Score MUST be clamped at 0 lower bound!", 0, riskEngine.getCurrentScore())
        assertEquals(0, finalEvent?.currentScore)
    }

    @Test
    fun testResetForNewTripRestoresScoreTo100() {
        val t0 = 1000000L
        riskEngine.processSignals(
            drowsiness = DrowsinessDetectionResult(true, 0f, 0f, 0f, true, true, 1600L, t0),
            currentTimeMs = t0
        )
        assertEquals(70, riskEngine.getCurrentScore())

        // Reset for new trip
        riskEngine.resetForNewTrip()

        assertEquals("Score MUST reset to 100 for new trip!", 100, riskEngine.getCurrentScore())
        assertTrue("Event history MUST be cleared on new trip", riskEngine.getEventHistory().isEmpty())
    }
}
