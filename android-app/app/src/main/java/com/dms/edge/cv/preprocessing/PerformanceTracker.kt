package com.dms.edge.cv.preprocessing

import java.util.ArrayDeque

/**
 * Performance & Telemetry Tracker for Computer Vision preprocessing pipeline.
 * Measures real-time latency (min, max, rolling average in ms) and achieved FPS.
 */
class PerformanceTracker(private val windowSize: Int = 30) {

    private val frameDurationsMs = ArrayDeque<Long>(windowSize)
    private var totalFramesProcessed = 0L
    private var lastFrameTimestampMs = 0L
    private var minLatencyMs = Long.MAX_VALUE
    private var maxLatencyMs = 0L

    @Synchronized
    fun recordFrame(durationMs: Long) {
        totalFramesProcessed++
        lastFrameTimestampMs = System.currentTimeMillis()

        if (durationMs < minLatencyMs) minLatencyMs = durationMs
        if (durationMs > maxLatencyMs) maxLatencyMs = durationMs

        if (frameDurationsMs.size >= windowSize) {
            frameDurationsMs.pollFirst()
        }
        frameDurationsMs.addLast(durationMs)
    }

    @Synchronized
    fun getAverageLatencyMs(): Float {
        if (frameDurationsMs.isEmpty()) return 0.0f
        val sum = frameDurationsMs.sum()
        return sum.toFloat() / frameDurationsMs.size
    }

    @Synchronized
    fun getMinLatencyMs(): Long {
        return if (minLatencyMs == Long.MAX_VALUE) 0L else minLatencyMs
    }

    @Synchronized
    fun getMaxLatencyMs(): Long {
        return maxLatencyMs
    }

    @Synchronized
    fun getAchievedFps(): Float {
        val avgLatency = getAverageLatencyMs()
        return if (avgLatency > 0) 1000.0f / avgLatency else 0.0f
    }

    @Synchronized
    fun getTotalFramesProcessed(): Long = totalFramesProcessed

    @Synchronized
    fun reset() {
        frameDurationsMs.clear()
        totalFramesProcessed = 0L
        minLatencyMs = Long.MAX_VALUE
        maxLatencyMs = 0L
    }
}
