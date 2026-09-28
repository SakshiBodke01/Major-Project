package com.dms.edge.cv.yolo

/**
 * Normalized 2D Bounding Box representation [0.0, 1.0].
 */
data class BoundingBox(
    val left: Float,
    val top: Float,
    val right: Float,
    val bottom: Float
) {
    fun width(): Float = (right - left).coerceAtLeast(0.0f)
    fun height(): Float = (bottom - top).coerceAtLeast(0.0f)
    fun area(): Float = width() * height()
}
