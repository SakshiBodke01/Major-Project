package com.dms.edge.cv.yolo

import java.util.ArrayDeque

/**
 * Sliding Window Temporal Confirmation Filter.
 * Eliminates single-frame false positive glints/reflections by requiring at least N
 * positive detections out of the last M sliding frames before confirming a safety alert signal.
 */
class TemporalDetectionFilter(
    private val requiredPositiveFrames: Int = 3,
    private val windowSize: Int = 5
) {
    private val frameHistory = ArrayDeque<Boolean>(windowSize)

    @Synchronized
    fun update(hasDetectionCurrentFrame: Boolean): Boolean {
        if (frameHistory.size >= windowSize) {
            frameHistory.pollFirst()
        }
        frameHistory.addLast(hasDetectionCurrentFrame)

        val positiveCount = frameHistory.count { it }
        return positiveCount >= requiredPositiveFrames
    }

    @Synchronized
    fun reset() {
        frameHistory.clear()
    }
}
