package com.dms.edge.network

import android.content.Context
import android.net.ConnectivityManager
import android.net.NetworkCapabilities
import com.dms.edge.utils.Logger

/**
 * Network Connectivity Monitor & Telemetry Status Observer.
 */
class NetworkMonitor(private val context: Context) {

    private var previousOnlineState: Boolean = false

    fun isOnline(): Boolean {
        val connectivityManager = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
            ?: return false

        val activeNetwork = connectivityManager.activeNetwork ?: return false
        val capabilities = connectivityManager.getNetworkCapabilities(activeNetwork) ?: return false

        val isConnected = capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) &&
                capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED)

        if (isConnected != previousOnlineState) {
            previousOnlineState = isConnected
            Logger.i("NetworkMonitor", "Network connectivity state changed: ${if (isConnected) "ONLINE" else "OFFLINE"}")
        }

        return isConnected
    }
}
