package com.dms.edge.network

import com.dms.edge.network.models.ApiResponse
import com.dms.edge.network.models.RiskEventRequest
import com.dms.edge.network.models.TripFinishRequest
import com.dms.edge.network.models.TripStartRequest
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.Path

/**
 * Retrofit interface defining REST endpoints consumed by Android edge application.
 */
interface ApiService {

    /**
     * Start backend trip session
     */
    @POST("trips")
    suspend fun startTrip(
        @Body request: TripStartRequest
    ): Response<ApiResponse<Any>>

    /**
     * Finish backend trip session and send final score & ending GPS location
     */
    @PATCH("trips/{id}/finish")
    suspend fun finishTrip(
        @Path("id") tripId: String,
        @Body request: TripFinishRequest
    ): Response<ApiResponse<Any>>

    /**
     * Transmit numerical risk telemetry event computed on-device.
     */
    @POST("risk-events")
    suspend fun postRiskEvent(
        @Body request: RiskEventRequest
    ): Response<ApiResponse<Any>>
}
