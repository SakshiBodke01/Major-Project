package com.dms.edge.ml

import com.dms.edge.config.AppConfig
import com.dms.edge.engine.RiskEngineEvent
import com.dms.edge.network.NetworkClient
import com.dms.edge.network.models.LocationData
import com.dms.edge.network.models.RiskEventRequest
import com.dms.edge.utils.Logger
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID

/**
 * Telemetry Network Transmitter running on Android Edge node.
 * Receives RiskEngineEvent triggers and posts numerical telemetry payloads to the backend API.
 */
class RiskEventDetector(
    private val driverId: String = AppConfig.DEFAULT_DRIVER_ID,
    private val tripId: String = "TRIP_" + UUID.randomUUID().toString().substring(0, 8)
) {

    private val scope = CoroutineScope(Dispatchers.IO)
    private val isoFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)

    /**
     * Transmit risk event telemetry to backend REST API.
     */
    fun transmitRiskEvent(event: RiskEngineEvent, locationData: LocationData) {
        val request = RiskEventRequest(
            eventId = event.eventId,
            tripId = tripId,
            driverId = driverId,
            eventType = event.eventType,
            severity = event.severity,
            drowsinessScore = event.pointsDeducted.toFloat(),
            distractionDurationSec = null,
            headPoseYaw = 0.0f,
            headPosePitch = 0.0f,
            location = locationData,
            timestamp = isoFormat.format(Date(event.timestamp))
        )

        scope.launch {
            try {
                val response = NetworkClient.apiService.postRiskEvent(request)
                if (response.isSuccessful) {
                    Logger.i("RiskEventDetector", "Risk event telemetry uploaded cleanly. Status: ${response.code()}")
                } else {
                    Logger.e("RiskEventDetector", "Telemetry upload failed: ${response.errorBody()?.string()}")
                }
            } catch (e: Exception) {
                Logger.e("RiskEventDetector", "Network error transmitting risk telemetry", e)
            }
        }
    }
}
