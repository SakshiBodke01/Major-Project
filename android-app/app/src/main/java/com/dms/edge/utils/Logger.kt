package com.dms.edge.utils

import android.util.Log

/**
 * Basic Logging strategy for Android Edge App.
 * Wraps Logcat output with standard formatting and tag prefixes.
 */
object Logger {
    private const val TAG_PREFIX = "DMS_EDGE_"

    fun d(tag: String, message: String) {
        try {
            Log.d(TAG_PREFIX + tag, message)
        } catch (_: Throwable) {
            println("DEBUG: [$tag] $message")
        }
    }

    fun i(tag: String, message: String) {
        try {
            Log.i(TAG_PREFIX + tag, message)
        } catch (_: Throwable) {
            println("INFO: [$tag] $message")
        }
    }

    fun w(tag: String, message: String) {
        try {
            Log.w(TAG_PREFIX + tag, message)
        } catch (_: Throwable) {
            println("WARN: [$tag] $message")
        }
    }

    fun e(tag: String, message: String, throwable: Throwable? = null) {
        try {
            Log.e(TAG_PREFIX + tag, message, throwable)
        } catch (_: Throwable) {
            println("ERROR: [$tag] $message")
            throwable?.printStackTrace()
        }
    }
}
