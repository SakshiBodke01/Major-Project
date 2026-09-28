package com.dms.edge.cv.mediapipe

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

/**
 * Unit Tests for MediaPipe Facial Landmark & EAR Drowsiness Module.
 */
class MediaPipeFaceLandmarkTest {

    private lateinit var module: MediaPipeFaceLandmarkModule
    private val config = MediaPipeConfig(
        earThreshold = 0.21f,
        minClosureDurationMs = 1500L,
        enableDebugLogging = false
    )

    @Before
    fun setUp() {
        module = MediaPipeFaceLandmarkModule(config)
    }

    @Test
    fun testEarCalculationFormula() {
        // Open Eye Coordinates (High Vertical / Horizontal ratio -> EAR ~ 0.35)
        val p1 = EyeLandmarkPoint(0.0f, 0.0f)   // Left corner
        val p2 = EyeLandmarkPoint(3.0f, 7.0f)   // Top-left
        val p3 = EyeLandmarkPoint(7.0f, 7.0f)   // Top-right
        val p4 = EyeLandmarkPoint(10.0f, 0.0f)  // Right corner
        val p5 = EyeLandmarkPoint(7.0f, 0.0f)   // Bottom-right
        val p6 = EyeLandmarkPoint(3.0f, 0.0f)   // Bottom-left

        val ear = EarCalculator.calculateEAR(p1, p2, p3, p4, p5, p6)

        assertTrue("EAR should be positive", ear > 0.0f)
        assertEquals(0.70f, ear, 0.01f)
    }

    @Test
    fun testNormalBlinkingIsNotProlongedDrowsiness() {
        val t0 = 1000000L
        val openEye = listOf(
            EyeLandmarkPoint(0f, 0f), EyeLandmarkPoint(3f, 7f), EyeLandmarkPoint(7f, 7f),
            EyeLandmarkPoint(10f, 0f), EyeLandmarkPoint(7f, 0f), EyeLandmarkPoint(3f, 0f)
        )
        val closedEye = listOf(
            EyeLandmarkPoint(0f, 0f), EyeLandmarkPoint(3f, 0.5f), EyeLandmarkPoint(7f, 0.5f),
            EyeLandmarkPoint(10f, 0f), EyeLandmarkPoint(7f, 0f), EyeLandmarkPoint(3f, 0f)
        )

        // 1. Frame 1: Eyes Open
        val res1 = module.processEyeLandmarks(true, openEye, openEye, timestampMs = t0)
        assertFalse("Eyes should be open", res1.eyesClosed)
        assertFalse("Prolonged closure should be false", res1.prolongedClosure)

        // 2. Frame 2: Normal Blink Start (t = +100ms)
        val res2 = module.processEyeLandmarks(true, closedEye, closedEye, timestampMs = t0 + 100)
        assertTrue("Eyes should be closed during blink", res2.eyesClosed)
        assertFalse("100ms blink is NOT prolonged closure", res2.prolongedClosure)

        // 3. Frame 3: Normal Blink End (t = +250ms, eyes open again)
        val res3 = module.processEyeLandmarks(true, openEye, openEye, timestampMs = t0 + 250)
        assertFalse("Eyes open again", res3.eyesClosed)
        assertFalse("Prolonged closure remains false", res3.prolongedClosure)
    }

    @Test
    fun testProlongedEyeClosureDetection() {
        val t0 = 1000000L
        val closedEye = listOf(
            EyeLandmarkPoint(0f, 0f), EyeLandmarkPoint(3f, 0.5f), EyeLandmarkPoint(7f, 0.5f),
            EyeLandmarkPoint(10f, 0f), EyeLandmarkPoint(7f, 0f), EyeLandmarkPoint(3f, 0f)
        )

        // 1. Start eye closure
        module.processEyeLandmarks(true, closedEye, closedEye, timestampMs = t0)

        // 2. Closure duration = 1000ms (< 1500ms threshold)
        val resMid = module.processEyeLandmarks(true, closedEye, closedEye, timestampMs = t0 + 1000)
        assertTrue(resMid.eyesClosed)
        assertFalse("1000ms closure is not yet prolonged", resMid.prolongedClosure)

        // 3. Closure duration = 1600ms (>= 1500ms threshold)
        val resProlonged = module.processEyeLandmarks(true, closedEye, closedEye, timestampMs = t0 + 1600)
        assertTrue(resProlonged.eyesClosed)
        assertTrue("1600ms closure MUST be flagged as prolonged drowsiness!", resProlonged.prolongedClosure)
        assertEquals(1600L, resProlonged.closureDurationMs)
    }

    @Test
    fun testFaceLossHandledSafelyWithoutCrash() {
        val t0 = 1000000L

        // Process face lost state
        val resFaceLost = module.processEyeLandmarks(
            faceDetected = false,
            leftEyePoints = null,
            rightEyePoints = null,
            timestampMs = t0
        )

        assertNotNull(resFaceLost)
        assertFalse(resFaceLost.faceDetected)
        assertFalse(resFaceLost.eyesClosed)
        assertFalse(resFaceLost.prolongedClosure)
        assertEquals(0.0f, resFaceLost.averageEAR, 0.001f)
    }
}
