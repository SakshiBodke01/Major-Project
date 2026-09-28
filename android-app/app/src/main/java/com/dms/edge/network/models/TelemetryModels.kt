package com.dms.edge.network.models

import com.google.gson.annotations.SerializedName

/**
 * Data classes for numerical telemetry and trip lifecycle transmitted over REST API.
 * Contains ZERO video content - only calculated numerical scores, timestamps, and GPS coordinates.
 */
data class LocationData(
    @SerializedName("latitude") val latitude: Double,
    @SerializedName("longitude") val longitude: Double,
    @SerializedName("speedKmh") val speedKmh: Double = 0.0,
    @SerializedName("accuracyMeters") val accuracyMeters: Float = 5.0f,
    @SerializedName("address") val address: String = ""
)

data class TripStartRequest(
    @SerializedName("tripId") val tripId: String,
    @SerializedName("driverId") val driverId: String,
    @SerializedName("startingLocation") val startingLocation: LocationData,
    @SerializedName("startTime") val startTime: String
)

data class TripFinishRequest(
    @SerializedName("endingLocation") val endingLocation: LocationData?,
    @SerializedName("endTime") val endTime: String,
    @SerializedName("finalScore") val finalScore: Int
)

data class RiskEventRequest(
    @SerializedName("eventId") val eventId: String, // Idempotency Key (UUID)
    @SerializedName("tripId") val tripId: String,
    @SerializedName("driverId") val driverId: String,
    @SerializedName("eventType") val eventType: String,
    @SerializedName("severity") val severity: String,
    @SerializedName("drowsinessScore") val drowsinessScore: Float?,
    @SerializedName("distractionDurationSec") val distractionDurationSec: Float?,
    @SerializedName("headPoseYaw") val headPoseYaw: Float?,
    @SerializedName("headPosePitch") val headPosePitch: Float?,
    @SerializedName("location") val location: LocationData,
    @SerializedName("timestamp") val timestamp: String
)

data class ApiResponse<T>(
    @SerializedName("success") val success: Boolean,
    @SerializedName("message") val message: String,
    @SerializedName("data") val data: T?,
    @SerializedName("errors") val errors: List<Any>?,
    @SerializedName("timestamp") val timestamp: String
)
