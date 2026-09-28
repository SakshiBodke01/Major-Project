package com.dms.edge.cv.preprocessing

import androidx.camera.core.ImageProxy
import java.nio.ByteBuffer

/**
 * Fast Memory Converter for CameraX ImageProxy YUV_420_888 frames.
 * Converts raw Y, U, V byte buffers into linear NV21 or Grayscale byte arrays.
 */
object FrameConverter {

    /**
     * Converts YUV_420_888 ImageProxy to NV21 byte array representation.
     */
    fun yuv420ToNv21(image: ImageProxy): ByteArray {
        val yPlane = image.planes[0]
        val uPlane = image.planes[1]
        val vPlane = image.planes[2]

        val yBuffer: ByteBuffer = yPlane.buffer
        val uBuffer: ByteBuffer = uPlane.buffer
        val vBuffer: ByteBuffer = vPlane.buffer

        val ySize = yBuffer.remaining()
        val uSize = uBuffer.remaining()
        val vSize = vBuffer.remaining()

        val nv21 = ByteArray(ySize + (image.width * image.height / 2))

        // Extract Y luminance plane directly
        yBuffer.get(nv21, 0, ySize)

        // Extract Chroma interleaved VU components
        val vPixelStride = vPlane.pixelStride
        val uPixelStride = uPlane.pixelStride

        if (vPixelStride == 2 && uPixelStride == 2 && vBuffer.remaining() == uBuffer.remaining()) {
            // Semi-planar format (NV21 / NV12)
            vBuffer.get(nv21, ySize, vSize)
        } else {
            // Planar format fallback
            var pos = ySize
            val width = image.width / 2
            val height = image.height / 2

            for (row in 0 until height) {
                for (col in 0 until width) {
                    val vIndex = row * vPlane.rowStride + col * vPixelStride
                    val uIndex = row * uPlane.rowStride + col * uPixelStride
                    if (vIndex < vSize) nv21[pos++] = vBuffer.get(vIndex)
                    if (uIndex < uSize) nv21[pos++] = uBuffer.get(uIndex)
                }
            }
        }

        return nv21
    }

    /**
     * Extracts Luminance (Y channel) byte array for fast grayscale operations.
     */
    fun extractLuminance(image: ImageProxy): ByteArray {
        val yBuffer = image.planes[0].buffer
        val bytes = ByteArray(yBuffer.remaining())
        yBuffer.get(bytes)
        return bytes
    }
}
