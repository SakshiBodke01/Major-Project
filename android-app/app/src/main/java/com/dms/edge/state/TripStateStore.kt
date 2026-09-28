package com.dms.edge.state

import android.content.Context
import android.content.SharedPreferences
import com.dms.edge.utils.Logger

/**
 * Local State Persistence Store for Trip State Recovery.
 * Allows active trip monitoring state to recover seamlessly after app interruptions.
 */
class TripStateStore(context: Context) {

    private val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    fun saveActiveTrip(tripId: String, driverId: String, score: Int, state: TripState) {
        prefs.edit()
            .putString(KEY_TRIP_ID, tripId)
            .putString(KEY_DRIVER_ID, driverId)
            .putInt(KEY_SCORE, score)
            .putString(KEY_STATE, state.name)
            .putLong(KEY_TIMESTAMP, System.currentTimeMillis())
            .apply()

        Logger.d("TripStateStore", "Saved active trip state: $tripId ($state, Score: $score)")
    }

    fun getActiveTripId(): String? = prefs.getString(KEY_TRIP_ID, null)

    fun getActiveDriverId(): String? = prefs.getString(KEY_DRIVER_ID, null)

    fun getLastScore(): Int = prefs.getInt(KEY_SCORE, 100)

    fun getSavedState(): TripState {
        val stateName = prefs.getString(KEY_STATE, TripState.IDLE.name)
        return try {
            TripState.valueOf(stateName ?: TripState.IDLE.name)
        } catch (e: Exception) {
            TripState.IDLE
        }
    }

    fun clearActiveTrip() {
        prefs.edit().clear().apply()
        Logger.d("TripStateStore", "Cleared active trip state store.")
    }

    companion object {
        private const val PREFS_NAME = "dms_trip_state_store"
        private const val KEY_TRIP_ID = "active_trip_id"
        private const val KEY_DRIVER_ID = "active_driver_id"
        private const val KEY_SCORE = "last_score"
        private const val KEY_STATE = "trip_state"
        private const val KEY_TIMESTAMP = "saved_timestamp"
    }
}
