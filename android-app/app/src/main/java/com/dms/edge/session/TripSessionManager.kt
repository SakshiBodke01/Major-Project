package com.dms.edge.session

import android.content.Context
import com.dms.edge.config.AppConfig
import com.dms.edge.engine.RiskEngine
import com.dms.edge.engine.RiskEngineEvent
import com.dms.edge.location.LocationTracker
import com.dms.edge.network.ApiService
import com.dms.edge.network.NetworkClient
import com.dms.edge.network.NetworkMonitor
import com.dms.edge.network.OfflineTelemetryQueue
import com.dms.edge.network.models.RiskEventRequest
import com.dms.edge.network.models.TripFinishRequest
import com.dms.edge.network.models.TripStartRequest
import com.dms.edge.state.TripState
import com.dms.edge.state.TripStateMachine
import com.dms.edge.state.TripStateStore
import com.dms.edge.utils.Logger
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID

/**
 * Trip Session Manager & Telemetry Orchestrator with explicit TripStateMachine & local state store.
 */
class TripSessionManager(
    private val context: Context,
    val locationTracker: LocationTracker,
    val riskEngine: RiskEngine,
    private val apiService: ApiService = NetworkClient.apiService,
    onStateChanged: ((TripState) -> Unit)? = null
) {
    val networkMonitor = NetworkMonitor(context)
    val offlineQueue = OfflineTelemetryQueue(apiService)
    val stateStore = TripStateStore(context)
    val stateMachine = TripStateMachine(onStateChanged = { _, newState ->
        onStateChanged?.invoke(newState)
    })

    private val scope = CoroutineScope(Dispatchers.IO)
    private val isoFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)

    var activeTripId: String? = null
        private set

    var activeDriverId: String = AppConfig.DEFAULT_DRIVER_ID
        private set

    val currentState: TripState
        get() = stateMachine.getCurrentState()

    val isTripActive: Boolean
        get() = currentState == TripState.MONITORING || currentState == TripState.PAUSED || currentState == TripState.NETWORK_DEGRADED

    /**
     * Start a new Trip Session.
     */
    fun startTrip(driverId: String = AppConfig.DEFAULT_DRIVER_ID, onStarted: () -> Unit) {
        if (!stateMachine.transitionTo(TripState.STARTING)) return

        val tripId = "TRIP_" + UUID.randomUUID().toString().substring(0, 8)
        activeTripId = tripId
        activeDriverId = driverId

        // 1. Reset Risk Engine score to 100 for new trip
        riskEngine.resetForNewTrip()

        // 2. Start GPS Location updates
        locationTracker.startLocationUpdates()
        val startLoc = locationTracker.getCurrentLocation()
        val startTimeStr = isoFormat.format(Date())

        // 3. Save local recovery state
        stateStore.saveActiveTrip(tripId, driverId, 100, TripState.MONITORING)

        // 4. Create trip record on backend REST API
        val startRequest = TripStartRequest(
            tripId = tripId,
            driverId = driverId,
            startingLocation = startLoc,
            startTime = startTimeStr
        )

        scope.launch {
            try {
                if (networkMonitor.isOnline()) {
                    val response = apiService.startTrip(startRequest)
                    if (response.isSuccessful) {
                        Logger.i("TripSessionManager", "Backend Trip $tripId created successfully over REST API.")
                    } else {
                        Logger.e("TripSessionManager", "Error creating backend trip: ${response.code()}")
                    }
                } else {
                    Logger.w("TripSessionManager", "Device OFFLINE. Trip $tripId initialized locally.")
                    stateMachine.transitionTo(TripState.NETWORK_DEGRADED)
                }
            } catch (e: Exception) {
                Logger.e("TripSessionManager", "Network exception starting trip", e)
                stateMachine.transitionTo(TripState.NETWORK_DEGRADED)
            }
        }

        stateMachine.transitionTo(TripState.MONITORING)
        onStarted()
    }

    /**
     * Report a RiskEngineEvent trigger linked to active trip.
     */
    fun reportRiskEvent(event: RiskEngineEvent) {
        val tripId = activeTripId ?: return
        val currentLocation = locationTracker.getCurrentLocation()

        // Save current score to state store
        stateStore.saveActiveTrip(tripId, activeDriverId, event.currentScore, currentState)

        // Backend RiskEvent model strictly records violation events ('DROWSINESS', 'YAWNING', 'PHONE', 'DISTRACTION').
        // Score recovery events are persisted in local state store and synced on trip completion.
        if (event.eventType == "SCORE_RECOVERY") {
            Logger.i("TripSessionManager", "Score recovery event processed locally. New score: ${event.currentScore}")
            return
        }

        val request = RiskEventRequest(
            eventId = event.eventId, // Idempotency UUID
            tripId = tripId,
            driverId = activeDriverId,
            eventType = event.eventType,
            severity = event.severity,
            drowsinessScore = event.pointsDeducted.toFloat(),
            distractionDurationSec = null,
            headPoseYaw = 0.0f,
            headPosePitch = 0.0f,
            location = currentLocation,
            timestamp = isoFormat.format(Date(event.timestamp))
        )

        if (networkMonitor.isOnline()) {
            scope.launch {
                try {
                    val response = apiService.postRiskEvent(request)
                    if (!response.isSuccessful && response.code() != 409) {
                        offlineQueue.enqueue(request)
                        stateMachine.transitionTo(TripState.NETWORK_DEGRADED)
                    } else {
                        Logger.i("TripSessionManager", "Risk event ${event.eventId} transmitted cleanly.")
                        stateMachine.transitionTo(TripState.MONITORING)
                    }
                } catch (e: Exception) {
                    offlineQueue.enqueue(request)
                    stateMachine.transitionTo(TripState.NETWORK_DEGRADED)
                }
            }
        } else {
            offlineQueue.enqueue(request)
            stateMachine.transitionTo(TripState.NETWORK_DEGRADED)
        }
    }

    /**
     * Pause monitoring during app lifecycle interruptions without corrupting trip.
     */
    fun pauseMonitoring() {
        if (currentState == TripState.MONITORING || currentState == TripState.NETWORK_DEGRADED) {
            stateMachine.transitionTo(TripState.PAUSED)
            activeTripId?.let { tripId ->
                stateStore.saveActiveTrip(tripId, activeDriverId, riskEngine.getCurrentScore(), TripState.PAUSED)
            }
        }
    }

    /**
     * Resume monitoring after app interruption.
     */
    fun resumeMonitoring() {
        if (currentState == TripState.PAUSED) {
            val targetState = if (networkMonitor.isOnline()) TripState.MONITORING else TripState.NETWORK_DEGRADED
            stateMachine.transitionTo(targetState)
            activeTripId?.let { tripId ->
                stateStore.saveActiveTrip(tripId, activeDriverId, riskEngine.getCurrentScore(), targetState)
            }
        }
    }

    /**
     * Stop the active Trip Session.
     */
    fun stopTrip(onStopped: () -> Unit) {
        val tripId = activeTripId ?: return
        if (!stateMachine.transitionTo(TripState.STOPPING)) return

        // 1. Stop location updates
        val endLoc = locationTracker.getCurrentLocation()
        locationTracker.stopLocationUpdates()

        val endTimeStr = isoFormat.format(Date())
        val finalScore = riskEngine.getCurrentScore()

        val finishRequest = TripFinishRequest(
            endingLocation = endLoc,
            endTime = endTimeStr,
            finalScore = finalScore
        )

        // 2. Transmit finish trip & flush remaining offline queue
        scope.launch {
            if (networkMonitor.isOnline()) {
                offlineQueue.syncQueuedEvents(networkMonitor)
                try {
                    val response = apiService.finishTrip(tripId, finishRequest)
                    if (response.isSuccessful) {
                        Logger.i("TripSessionManager", "Trip $tripId marked COMPLETED on backend with final score $finalScore.")
                    }
                } catch (e: Exception) {
                    Logger.e("TripSessionManager", "Error marking trip finish over network", e)
                }
            }
            stateStore.clearActiveTrip()
            stateMachine.transitionTo(TripState.COMPLETED)
            stateMachine.transitionTo(TripState.IDLE)
        }

        activeTripId = null
        onStopped()
    }
}
