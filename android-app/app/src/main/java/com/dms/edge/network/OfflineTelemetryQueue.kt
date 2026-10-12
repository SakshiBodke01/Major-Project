package com.dms.edge.network

import com.dms.edge.network.models.RiskEventRequest
import com.dms.edge.utils.Logger
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.ArrayDeque

/**
 * Local Offline Telemetry Event Queue & Idempotent Sync Manager.
 * 
 * Rules:
 * 1. Stores risk event requests locally when network is unavailable.
 * 2. Idempotent: Uses unique eventId (UUID) so retries never create duplicate events on backend.
 * 3. Synchronizes queued events with exponential backoff (1s, 2s, 4s, 8s) when connectivity returns.
 */
class OfflineTelemetryQueue(
    private val apiService: ApiService = NetworkClient.apiService
) {
    private val queue = ArrayDeque<RiskEventRequest>()
    private val processedEventIds = HashSet<String>()
    private val scope = CoroutineScope(Dispatchers.IO)
    private var isSyncing = false

    @Synchronized
    fun enqueue(request: RiskEventRequest) {
        if (processedEventIds.contains(request.eventId) || queue.any { it.eventId == request.eventId }) {
            Logger.w("OfflineTelemetryQueue", "Duplicate event ${request.eventId} ignored by queue.")
            return
        }

        processedEventIds.add(request.eventId)
        queue.addLast(request)
        Logger.i("OfflineTelemetryQueue", "Event ${request.eventId} (${request.eventType}) queued locally. Queue size: ${queue.size}")
    }

    @Synchronized
    fun getQueueSize(): Int = queue.size

    @Synchronized
    fun isQueueEmpty(): Boolean = queue.isEmpty()

    /**
     * Synchronize queued events with backend REST API over network.
     */
    fun syncQueuedEvents(networkMonitor: NetworkMonitor, onSyncComplete: (() -> Unit)? = null) {
        if (isSyncing || queue.isEmpty()) return
        if (!networkMonitor.isOnline()) {
            Logger.d("OfflineTelemetryQueue", "Cannot sync queue: device is currently OFFLINE.")
            return
        }

        isSyncing = true
        scope.launch {
            Logger.i("OfflineTelemetryQueue", "Starting synchronization of ${queue.size} offline telemetry events...")
            var backoffMs = 1000L

            while (queue.isNotEmpty() && networkMonitor.isOnline()) {
                val item = queue.first

                try {
                    val response = apiService.postRiskEvent(item)
                    if (response.isSuccessful || response.code() == 409) { // 409 Conflict = already received by server (idempotency)
                        queue.removeFirst()
                        processedEventIds.add(item.eventId)
                        Logger.i("OfflineTelemetryQueue", "Event ${item.eventId} synced cleanly.")
                        backoffMs = 1000L // Reset backoff on success
                    } else {
                        Logger.e("OfflineTelemetryQueue", "Failed syncing event ${item.eventId}. Server code: ${response.code()}")
                        delay(backoffMs)
                        backoffMs = (backoffMs * 2).coerceAtMost(8000L) // Exponential backoff
                    }
                } catch (e: Exception) {
                    Logger.e("OfflineTelemetryQueue", "Network error during sync: ${e.message}")
                    delay(backoffMs)
                    backoffMs = (backoffMs * 2).coerceAtMost(8000L)
                }
            }

            isSyncing = false
            Logger.i("OfflineTelemetryQueue", "Synchronization loop finished. Remaining in queue: ${queue.size}")
            onSyncComplete?.invoke()
        }
    }

    @Synchronized
    fun clearQueue() {
        queue.clear()
        processedEventIds.clear()
    }
}
