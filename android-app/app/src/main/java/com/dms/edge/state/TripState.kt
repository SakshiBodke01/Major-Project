package com.dms.edge.state

/**
 * Explicit Trip Lifecycle States for DriveGuard AI.
 * 
 * State transitions:
 * IDLE -> STARTING -> MONITORING -> PAUSED / NETWORK_DEGRADED -> STOPPING -> COMPLETED -> IDLE
 */
enum class TripState(val displayName: String) {
    IDLE("STANDBY"),
    STARTING("STARTING..."),
    MONITORING("MONITORING ACTIVE"),
    PAUSED("MONITORING PAUSED"),
    NETWORK_DEGRADED("OFFLINE QUEUING"),
    STOPPING("STOPPING..."),
    COMPLETED("TRIP COMPLETED")
}
