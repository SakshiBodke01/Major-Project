package com.dms.edge.cv.yolo

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

/**
 * Unit Tests for YOLO Mobile Object Detection Pipeline & Filters.
 */
class YoloDetectionTest {

    private lateinit var temporalFilter: TemporalDetectionFilter

    @Before
    fun setUp() {
        temporalFilter = TemporalDetectionFilter(
            requiredPositiveFrames = 3,
            windowSize = 5
        )
    }

    @Test
    fun testNmsIouCalculation() {
        val boxA = BoundingBox(0.0f, 0.0f, 0.5f, 0.5f) // Area = 0.25
        val boxB = BoundingBox(0.0f, 0.0f, 0.5f, 0.5f) // Exact duplicate

        val iouIdentical = NmsUtility.calculateIoU(boxA, boxB)
        assertEquals(1.0f, iouIdentical, 0.001f)

        val boxC = BoundingBox(0.6f, 0.6f, 1.0f, 1.0f) // No overlap
        val iouDisjoint = NmsUtility.calculateIoU(boxA, boxC)
        assertEquals(0.0f, iouDisjoint, 0.001f)
    }

    @Test
    fun testNmsDuplicateSuppression() {
        val det1 = DetectedObject("cell phone", 67, 0.90f, BoundingBox(0.2f, 0.2f, 0.6f, 0.6f))
        val det2 = DetectedObject("cell phone", 67, 0.75f, BoundingBox(0.21f, 0.21f, 0.61f, 0.61f)) // Overlapping duplicate
        val det3 = DetectedObject("cell phone", 67, 0.85f, BoundingBox(0.7f, 0.7f, 0.9f, 0.9f))    // Separate phone

        val rawList = listOf(det1, det2, det3)
        val nmsList = NmsUtility.applyNMS(rawList, iouThreshold = 0.45f, confidenceThreshold = 0.40f)

        assertEquals(2, nmsList.size)
        assertEquals(0.90f, nmsList[0].confidence, 0.01f) // Highest confidence box preserved
        assertEquals(0.85f, nmsList[1].confidence, 0.01f)
    }

    @Test
    fun testTemporalConfirmationFilterSuppressesSingleFrameFalseAlerts() {
        // Frame 1: False positive glint (1st positive frame)
        val res1 = temporalFilter.update(true)
        assertFalse("1-frame detection MUST NOT trigger safety alert!", res1)

        // Frame 2: Negative detection (glint disappeared)
        val res2 = temporalFilter.update(false)
        assertFalse("Alert remains false", res2)

        // Frame 3: Negative detection
        val res3 = temporalFilter.update(false)
        assertFalse("Alert remains false", res3)
    }

    @Test
    fun testTemporalConfirmationFilterConfirmsConsecutiveDetections() {
        // 3 Positive frames in sliding window of 5
        val f1 = temporalFilter.update(true)
        assertFalse(f1) // 1/5

        val f2 = temporalFilter.update(true)
        assertFalse(f2) // 2/5

        val f3 = temporalFilter.update(true)
        assertTrue("3 consecutive positive frames MUST confirm safety alert signal!", f3) // 3/5
    }

    @Test
    fun testEngineModelPresenceHandlingWithoutCrash() {
        val config = YoloConfig(modelAssetPath = "non_existent_dummy_model.tflite")
        val engine = YoloMobileEngine(config)

        assertNotNull(engine)
        assertFalse("Model presence is documented honestly when asset is missing", engine.isModelLoaded())
    }
}
