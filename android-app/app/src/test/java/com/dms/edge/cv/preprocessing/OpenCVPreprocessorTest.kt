package com.dms.edge.cv.preprocessing

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

/**
 * Unit Tests for OpenCV Preprocessing Utilities & Performance Metrics.
 */
class OpenCVPreprocessorTest {

    private lateinit var preprocessor: OpenCVPreprocessor

    @Before
    fun setUp() {
        val config = ImagePreprocessConfig(
            targetWidth = 640,
            targetHeight = 480,
            enableClahe = true
        )
        preprocessor = OpenCVPreprocessor(config)
    }

    @Test
    fun testAspectScalingPreservesRatio() {
        // Test 1920x1080 (16:9) to 640x480 max bounds
        val (scaledW, scaledH) = preprocessor.calculateScaledDimensions(1920, 1080, 640, 480)
        assertEquals(640, scaledW)
        assertEquals(360, scaledH) // 640 / (16/9) = 360

        // Test 1080x1920 (9:16 portrait) to 640x480 max bounds
        val (portraitW, portraitH) = preprocessor.calculateScaledDimensions(1080, 1920, 640, 480)
        assertEquals(270, portraitW)
        assertEquals(480, portraitH) // 480 * (9/16) = 270
    }

    @Test
    fun testDriverFaceRoiCalculation() {
        val width = 1280
        val height = 720
        val margin = 0.2f

        val roi = preprocessor.calculateDriverFaceRoi(width, height, margin)

        assertNotNull(roi)
        assertTrue(roi.width > 0 && roi.width <= width)
        assertTrue(roi.height > 0 && roi.height <= height)
        assertTrue(roi.left >= 0)
        assertTrue(roi.top >= 0)
    }

    @Test
    fun testPerformanceTrackerMetrics() {
        val tracker = PerformanceTracker(windowSize = 10)

        // Record 5 frames with 20ms duration each
        for (i in 1..5) {
            tracker.recordFrame(20L)
        }

        assertEquals(5L, tracker.getTotalFramesProcessed())
        assertEquals(20.0f, tracker.getAverageLatencyMs(), 0.01f)
        assertEquals(20L, tracker.getMinLatencyMs())
        assertEquals(20L, tracker.getMaxLatencyMs())
        assertEquals(50.0f, tracker.getAchievedFps(), 0.01f) // 1000ms / 20ms = 50 FPS
    }

    @Test
    fun testClaheIlluminationNormalization() {
        val width = 100
        val height = 100
        val dummyYuv = ByteArray(width * height) { (it % 256).toByte() }

        val normalized = preprocessor.applyClaheIlluminationNormalization(dummyYuv, width, height)

        assertNotNull(normalized)
        assertEquals(dummyYuv.size, normalized.size)
    }
}
