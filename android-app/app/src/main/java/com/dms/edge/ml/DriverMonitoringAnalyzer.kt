package com.dms.edge.ml

import androidx.camera.core.ImageAnalysis
import androidx.camera.core.ImageProxy
import com.dms.edge.cv.FrameAnalysisResult
import com.dms.edge.cv.ICVFrameEngine
import com.dms.edge.cv.MockCVEngine
import com.dms.edge.utils.Logger

/**
 * CameraX Frame Analyzer connecting CameraX preview frames to pluggable CV engines.
 * Throttles frame rate for power efficiency and guarantees RAM buffer release.
 */
class DriverMonitoringAnalyzer(
    private val cvEngine: ICVFrameEngine = MockCVEngine(),
    private val onResult: (FrameAnalysisResult) -> Unit
) : ImageAnalysis.Analyzer {

    private var lastProcessedTimestamp = 0L

    override fun analyze(imageProxy: ImageProxy) {
        val currentTimestamp = System.currentTimeMillis()

        try {
            // Throttle processing rate to ~5 FPS to prevent thermal throttling on vehicle dash mount
            if (currentTimestamp - lastProcessedTimestamp < 200) {
                imageProxy.close()
                return
            }
            lastProcessedTimestamp = currentTimestamp

            // Pass frame in RAM to pluggable CV Engine (MediaPipe, OpenCV, TFLite, YOLO)
            val result = cvEngine.processFrame(imageProxy)
            onResult(result)

        } catch (e: Exception) {
            Logger.e("DriverMonitoringAnalyzer", "Error analyzing frame", e)
            imageProxy.close()
        }
    }
}
