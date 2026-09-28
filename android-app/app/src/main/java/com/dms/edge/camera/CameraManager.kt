package com.dms.edge.camera

import android.content.Context
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageAnalysis
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.core.content.ContextCompat
import androidx.lifecycle.LifecycleOwner
import com.dms.edge.ml.DriverMonitoringAnalyzer
import com.dms.edge.utils.Logger
import java.util.concurrent.ExecutorService
import java.util.concurrent.Executors

/**
 * Lifecycle-aware CameraX Manager for DriveGuard AI.
 * Controls front camera initialization, preview surface binding, and clean lifecycle unbinding.
 */
class CameraManager(
    private val context: Context,
    private val previewView: PreviewView,
    private val lifecycleOwner: LifecycleOwner,
    private val analyzer: DriverMonitoringAnalyzer
) {
    private var cameraProvider: ProcessCameraProvider? = null
    private var cameraExecutor: ExecutorService? = null
    private var isCameraActive = false

    fun startCamera(onSuccess: (() -> Unit)? = null, onError: ((Exception) -> Unit)? = null) {
        if (isCameraActive) return

        val cameraProviderFuture = ProcessCameraProvider.getInstance(context)
        cameraExecutor = Executors.newSingleThreadExecutor()

        cameraProviderFuture.addListener({
            try {
                cameraProvider = cameraProviderFuture.get()

                // Front-Facing Camera for Driver Facing View
                val cameraSelector = CameraSelector.DEFAULT_FRONT_CAMERA

                val preview = Preview.Builder().build().also {
                    it.setSurfaceProvider(previewView.surfaceProvider)
                }

                val imageAnalysis = ImageAnalysis.Builder()
                    .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                    .build()
                    .also {
                        cameraExecutor?.let { executor ->
                            it.setAnalyzer(executor, analyzer)
                        }
                    }

                cameraProvider?.unbindAll()
                cameraProvider?.bindToLifecycle(
                    lifecycleOwner,
                    cameraSelector,
                    preview,
                    imageAnalysis
                )

                isCameraActive = true
                Logger.i("CameraManager", "Front camera and local frame analysis initialized.")
                onSuccess?.invoke()

            } catch (e: Exception) {
                Logger.e("CameraManager", "Failed to bind CameraX use cases", e)
                isCameraActive = false
                onError?.invoke(e)
            }
        }, ContextCompat.getMainExecutor(context))
    }

    /**
     * Safely stop camera preview and unbind all use cases to release camera hardware.
     */
    fun stopCamera() {
        try {
            cameraProvider?.unbindAll()
            cameraExecutor?.shutdown()
            cameraExecutor = null
            isCameraActive = false
            Logger.i("CameraManager", "Camera resources released safely.")
        } catch (e: Exception) {
            Logger.e("CameraManager", "Error stopping camera", e)
        }
    }

    fun isRunning(): Boolean = isCameraActive
}
