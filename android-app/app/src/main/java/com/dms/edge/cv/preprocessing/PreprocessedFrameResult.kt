package com.dms.edge.cv.preprocessing

/**
 * Driver-face Region of Interest (ROI) bounding box coordinates.
 */
data class RoiRect(
    val left: Int,
    val top: Int,
    val width: Int,
    val height: Int
)

/**
 * Output data container of OpenCV preprocessing pipeline.
 * Formatted and normalized for input into downstream MediaPipe and YOLO modules.
 */
data class PreprocessedFrameResult(
    val originalWidth: Int,
    val originalHeight: Int,
    val processedWidth: Int,
    val processedHeight: Int,
    val rotationApplied: Int,
    val processingLatencyMs: Long,
    val achievedFps: Float,
    val faceRoi: RoiRect,
    val isClaheApplied: Boolean = true,
    val byteBuffer: ByteArray? = null
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (javaClass != other?.javaClass) return false
        other as PreprocessedFrameResult
        return originalWidth == other.originalWidth &&
                originalHeight == other.originalHeight &&
                processedWidth == other.processedWidth &&
                processedHeight == other.processedHeight &&
                processingLatencyMs == other.processingLatencyMs
    }

    override fun hashCode(): Int {
        var result = originalWidth
        result = 31 * result + originalHeight
        result = 31 * result + processedWidth
        result = 31 * result + processedHeight
        result = 31 * result + processingLatencyMs.hashCode()
        return result
    }
}
