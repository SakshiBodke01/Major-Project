package com.dms.edge.session

import com.dms.edge.network.OfflineTelemetryQueue
import com.dms.edge.network.models.LocationData
import com.dms.edge.network.models.RiskEventRequest
import com.dms.edge.network.models.TripFinishRequest
import com.dms.edge.network.models.TripStartRequest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import java.util.UUID

/**
 * Unit Tests for GPS Trip Tracking & Offline Telemetry Queue Sync.
 */
class GpsTripTrackingTest {

    private lateinit var offlineQueue: OfflineTelemetryQueue

    @Before
    fun setUp() {
        offlineQueue = OfflineTelemetryQueue()
        offlineQueue.clearQueue()
    }

    @Test
    fun testTripStartPayloadCreation() {
        val tripId = "TRIP_TEST_001"
        val driverId = "DRV_TEST_101"
        val loc = LocationData(37.7749, -122.4194, speedKmh = 50.0, accuracyMeters = 3.5f)
        val startTime = "2026-09-06T10:00:00.000Z"

        val request = TripStartRequest(tripId, driverId, loc, startTime)

        assertNotNull(request)
        assertEquals(tripId, request.tripId)
        assertEquals(driverId, request.driverId)
        assertEquals(37.7749, request.startingLocation.latitude, 0.0001)
        assertEquals(50.0, request.startingLocation.speedKmh, 0.1)
    }

    @Test
    fun testTripFinishPayloadCreation() {
        val loc = LocationData(37.8044, -122.2712, speedKmh = 0.0, accuracyMeters = 4.0f)
        val endTime = "2026-09-06T10:45:00.000Z"

        val request = TripFinishRequest(loc, endTime, finalScore = 85)

        assertNotNull(request)
        assertEquals(85, request.finalScore)
        assertEquals(37.8044, request.endingLocation?.latitude ?: 0.0, 0.0001)
    }

    @Test
    fun testOfflineEventQueueingAndIdempotency() {
        val eventId = "EVT_" + UUID.randomUUID()
        val loc = LocationData(37.7833, -122.4167)
        val request = RiskEventRequest(
            eventId = eventId,
            tripId = "TRIP_001",
            driverId = "DRV_101",
            eventType = "DROWSINESS",
            severity = "HIGH",
            drowsinessScore = 30.0f,
            distractionDurationSec = null,
            headPoseYaw = 0.0f,
            headPosePitch = 0.0f,
            location = loc,
            timestamp = "2026-09-06T10:15:00.000Z"
        )

        // 1. Enqueue offline event
        offlineQueue.enqueue(request)
        assertEquals(1, offlineQueue.getQueueSize())

        // 2. Duplicate enqueue attempt with same eventId -> MUST BE PREVENTED
        offlineQueue.enqueue(request)
        assertEquals("Idempotency MUST prevent duplicate event queueing!", 1, offlineQueue.getQueueSize())
    }

    @Test
    fun testPrivacyGuaranteeNoVideoInPayload() {
        val eventId = "EVT_" + UUID.randomUUID()
        val loc = LocationData(37.7833, -122.4167)
        val request = RiskEventRequest(
            eventId = eventId,
            tripId = "TRIP_001",
            driverId = "DRV_101",
            eventType = "PHONE_USE",
            severity = "HIGH",
            drowsinessScore = 25.0f,
            distractionDurationSec = null,
            headPoseYaw = 0.0f,
            headPosePitch = 0.0f,
            location = loc,
            timestamp = "2026-09-06T10:15:00.000Z"
        )

        // Verify payload string contains NO base64 image or video frames
        val jsonStr = request.toString()
        assertFalse("Payload MUST NOT contain raw image or video data", jsonStr.contains("data:image"))
        assertFalse("Payload MUST NOT contain raw video data", jsonStr.contains("videoFrame"))
    }
}
