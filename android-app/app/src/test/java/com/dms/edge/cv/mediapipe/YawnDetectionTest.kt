package com.dms.edge.cv.mediapipe

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

/**
 * Unit Tests for MediaPipe Mouth Aspect Ratio (MAR) Yawning Detection Module.
 */
class YawnDetectionTest {

    private lateinit var stateMachine: YawnStateMachine
    private val config = MediaPipeConfig(
        marThreshold = 0.60f,
        minYawnDurationMs = 1500L,
        yawnCooldownMs = 5000L,
        enableDebugLogging = false
    )

    @Before
    fun setUp() {
        stateMachine = YawnStateMachine(config)
    }

    @Test
    fun testMarCalculationFormula() {
        // Closed Mouth (Small Vertical height vs Horizontal width)
        val p1Closed = EyeLandmarkPoint(0f, 0f)    // Left corner
        val p2Closed = EyeLandmarkPoint(3f, 1f)    // Top-left
        val p3Closed = EyeLandmarkPoint(7f, 1f)    // Top-right
        val p4Closed = EyeLandmarkPoint(10f, 0f)   // Right corner
        val p5Closed = EyeLandmarkPoint(7f, 0f)    // Bottom-right
        val p6Closed = EyeLandmarkPoint(3f, 0f)    // Bottom-left

        val marClosed = MarCalculator.calculateMAR(p1Closed, p2Closed, p3Closed, p4Closed, p5Closed, p6Closed)
        assertTrue("Closed MAR should be low (< 0.60)", marClosed < 0.60f)
        assertEquals(0.10f, marClosed, 0.01f)

        // Wide Open Mouth (Yawn: Large Vertical height vs Horizontal width)
        val p1Open = EyeLandmarkPoint(0f, 0f)
        val p2Open = EyeLandmarkPoint(3f, 8f)
        val p3Open = EyeLandmarkPoint(7f, 8f)
        val p4Open = EyeLandmarkPoint(10f, 0f)
        val p5Open = EyeLandmarkPoint(7f, 0f)
        val p6Open = EyeLandmarkPoint(3f, 0f)

        val marOpen = MarCalculator.calculateMAR(p1Open, p2Open, p3Open, p4Open, p5Open, p6Open)
        assertTrue("Open MAR should be high (>= 0.60)", marOpen >= 0.60f)
        assertEquals(0.80f, marOpen, 0.01f)
    }

    @Test
    fun testBriefMouthOpeningDoesNotTriggerYawn() {
        val t0 = 1000000L

        // 1. Frame 1: Mouth closed
        val res1 = stateMachine.update(true, mar = 0.20f, currentTimeMs = t0)
        assertFalse("Mouth closed", res1.mouthOpen)
        assertFalse("Not yawning", res1.yawning)
        assertFalse("No event", res1.yawnEvent)

        // 2. Frame 2: Talking / brief opening for 500ms (MAR = 0.75 > 0.60)
        val res2 = stateMachine.update(true, mar = 0.75f, currentTimeMs = t0 + 500)
        assertTrue("Mouth open", res2.mouthOpen)
        assertFalse("500ms talking is NOT a yawn", res2.yawning)
        assertFalse("No yawn event", res2.yawnEvent)

        // 3. Frame 3: Mouth closes again (t = +800ms)
        val res3 = stateMachine.update(true, mar = 0.15f, currentTimeMs = t0 + 800)
        assertFalse("Mouth closed again", res3.mouthOpen)
        assertFalse("Not yawning", res3.yawning)
        assertFalse("No event", res3.yawnEvent)
    }

    @Test
    fun testProlongedYawnTriggersSingleEventAndEnforcesCooldown() {
        val t0 = 1000000L

        // 1. Start mouth opening (MAR = 0.80)
        stateMachine.update(true, mar = 0.80f, currentTimeMs = t0)

        // 2. Open duration = 1000ms (< 1500ms threshold)
        val resMid = stateMachine.update(true, mar = 0.80f, currentTimeMs = t0 + 1000)
        assertTrue(resMid.mouthOpen)
        assertFalse("1000ms open is not yet a yawn event", resMid.yawnEvent)

        // 3. Open duration = 1600ms (>= 1500ms threshold) -> MUST FIRE EXACTLY 1 YAWN EVENT
        val resYawn = stateMachine.update(true, mar = 0.80f, currentTimeMs = t0 + 1600)
        assertTrue("Yawning active", resYawn.yawning)
        assertTrue("Yawn event MUST fire on single trigger frame!", resYawn.yawnEvent)

        // 4. Next frame (t = +1700ms, continuous open mouth) -> MUST SUPPRESS DUPLICATE EVENT
        val resDuplicate = stateMachine.update(true, mar = 0.80f, currentTimeMs = t0 + 1700)
        assertTrue("Yawning remains active", resDuplicate.yawning)
        assertFalse("Duplicate event MUST NOT fire on subsequent frames during same yawn!", resDuplicate.yawnEvent)

        // 5. Subsequent yawn within 5000ms cooldown window -> MUST BE DEBOUNCED
        stateMachine.update(true, mar = 0.15f, currentTimeMs = t0 + 2500) // mouth closes briefly
        val resCooldown = stateMachine.update(true, mar = 0.85f, currentTimeMs = t0 + 3500) // mouth opens again within 5s
        assertFalse("Second yawn within 5s cooldown window MUST be debounced!", resCooldown.yawnEvent)
    }

    @Test
    fun testFaceLossResetsYawnStateSafely() {
        val t0 = 1000000L

        // Process face lost state
        val resFaceLost = stateMachine.update(
            faceDetected = false,
            mar = 0.0f,
            currentTimeMs = t0
        )

        assertNotNull(resFaceLost)
        assertFalse(resFaceLost.mouthOpen)
        assertFalse(resFaceLost.yawning)
        assertFalse(resFaceLost.yawnEvent)
        assertEquals(0.0f, resFaceLost.mar, 0.001f)
    }
}
