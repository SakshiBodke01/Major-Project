package com.dms.edge.location

import android.content.Context
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Bundle
import com.dms.edge.network.models.LocationData
import com.dms.edge.utils.Logger

/**
 * GPS Location Tracker & Telemetry Provider for DriveGuard AI.
 */
class LocationTracker(private val context: Context) : LocationListener {

    private val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
    private var lastKnownLocation: Location? = null
    private var isTrackingActive = false

    fun startLocationUpdates() {
        if (isTrackingActive) return
        try {
            if (isGpsAvailable()) {
                locationManager?.requestLocationUpdates(
                    LocationManager.GPS_PROVIDER,
                    2000L, // Minimum 2s interval
                    5.0f,  // Minimum 5m distance change
                    this
                )
                isTrackingActive = true
                Logger.i("LocationTracker", "GPS Location updates started successfully.")
            }
        } catch (e: SecurityException) {
            Logger.e("LocationTracker", "Location permission missing", e)
        } catch (e: Exception) {
            Logger.e("LocationTracker", "Error starting location updates", e)
        }
    }

    fun stopLocationUpdates() {
        try {
            if (isTrackingActive) {
                locationManager?.removeUpdates(this)
                isTrackingActive = false
                Logger.i("LocationTracker", "GPS Location updates stopped.")
            }
        } catch (e: Exception) {
            Logger.e("LocationTracker", "Error stopping location updates", e)
        }
    }

    fun isGpsAvailable(): Boolean {
        return locationManager?.isProviderEnabled(LocationManager.GPS_PROVIDER) == true ||
               locationManager?.isProviderEnabled(LocationManager.NETWORK_PROVIDER) == true
    }

    fun getCurrentLocation(): LocationData {
        val loc = lastKnownLocation
        return if (loc != null) {
            LocationData(
                latitude = loc.latitude,
                longitude = loc.longitude,
                speedKmh = (loc.speed * 3.6).toDouble(),
                accuracyMeters = loc.accuracy,
                address = "GPS Fix Fix (${loc.latitude.toString().take(6)}, ${loc.longitude.toString().take(6)})"
            )
        } else {
            // Dev placeholder coordinates (San Francisco Financial District)
            LocationData(
                latitude = 37.7749,
                longitude = -122.4194,
                speedKmh = 45.0,
                accuracyMeters = 4.2f,
                address = "San Francisco Financial District"
            )
        }
    }

    override fun onLocationChanged(location: Location) {
        lastKnownLocation = location
        Logger.d("LocationTracker", "New GPS Fix: ${location.latitude}, ${location.longitude} (${location.accuracy}m)")
    }

    override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {}
    override fun onProviderEnabled(provider: String) {}
    override fun onProviderDisabled(provider: String) {}
}
