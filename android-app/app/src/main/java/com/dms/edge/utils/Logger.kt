package com.dms.edge.utils

import android.util.Log

/**
 * Basic Logging strategy for Android Edge App.
 * Wraps Logcat output with standard formatting and tag prefixes.
 */
object Logger {
    private const val TAG_PREFIX = "DMS_EDGE_"

    fun d(tag: String, message: String) {
        Log.d(TAG_PREFIX + tag, message)
    }

    fun i(tag: String, message: String) {
        Log.i(TAG_PREFIX + tag, message)
    }

    fun w(tag: String, message: String) {
        Log.w(TAG_PREFIX + tag, message)
    }

    fun e(tag: String, message: String, throwable: Throwable? = null) {
        Log.e(TAG_PREFIX + tag, message, throwable)
    }
}
