package com.dms.edge.state

import com.dms.edge.utils.Logger

/**
 * Predictable Trip Lifecycle State Machine for DriveGuard AI.
 */
class TripStateMachine(
    private var currentState: TripState = TripState.IDLE,
    private val onStateChanged: ((TripState, TripState) -> Unit)? = null
) {

    @Synchronized
    fun getCurrentState(): TripState = currentState

    @Synchronized
    fun transitionTo(newState: TripState): Boolean {
        if (currentState == newState) return true

        if (!isValidTransition(currentState, newState)) {
            Logger.w("TripStateMachine", "Invalid state transition rejected: $currentState -> $newState")
            return false
        }

        val oldState = currentState
        currentState = newState
        Logger.i("TripStateMachine", "Trip State Transition: $oldState -> $newState")
        onStateChanged?.invoke(oldState, newState)
        return true
    }

    private fun isValidTransition(from: TripState, to: TripState): Boolean {
        return when (from) {
            TripState.IDLE -> to == TripState.STARTING
            TripState.STARTING -> to == TripState.MONITORING || to == TripState.IDLE
            TripState.MONITORING -> to == TripState.PAUSED || to == TripState.NETWORK_DEGRADED || to == TripState.STOPPING
            TripState.PAUSED -> to == TripState.MONITORING || to == TripState.STOPPING
            TripState.NETWORK_DEGRADED -> to == TripState.MONITORING || to == TripState.PAUSED || to == TripState.STOPPING
            TripState.STOPPING -> to == TripState.COMPLETED || to == TripState.IDLE
            TripState.COMPLETED -> to == TripState.IDLE || to == TripState.STARTING
        }
    }

    @Synchronized
    fun reset() {
        val oldState = currentState
        currentState = TripState.IDLE
        onStateChanged?.invoke(oldState, TripState.IDLE)
    }
}
