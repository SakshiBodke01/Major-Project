package com.dms.edge

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.camera.view.PreviewView
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.dms.edge.alert.AlertManager
import com.dms.edge.camera.CameraManager
import com.dms.edge.cv.DemoSimulationEngine
import com.dms.edge.cv.mediapipe.MediaPipeCVEngine
import com.dms.edge.engine.RiskEngine
import com.dms.edge.engine.RiskEngineEvent
import com.dms.edge.location.LocationTracker
import com.dms.edge.ml.DriverMonitoringAnalyzer
import com.dms.edge.session.TripSessionManager
import com.dms.edge.state.TripState
import com.dms.edge.utils.Logger

/**
 * DriveGuard AI Edge Smartphone Application - Main Driver Monitoring Screen.
 * Integrated with Explicit Trip State Machine, Audio/Visual Alert Manager & Recent Event HUD.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var cameraManager: CameraManager
    private lateinit var locationTracker: LocationTracker
    private lateinit var riskEngine: RiskEngine
    private lateinit var tripSessionManager: TripSessionManager
    private lateinit var alertManager: AlertManager
    private val mediaPipeEngine = MediaPipeCVEngine()
    private val demoEngine = DemoSimulationEngine()

    private lateinit var viewFinder: PreviewView
    private lateinit var tvScoreValue: TextView
    private lateinit var tvMonitoringStatus: TextView
    private lateinit var tvGpsStatus: TextView
    private lateinit var tvAlertMessage: TextView
    private lateinit var tvDriverBadge: TextView
    private lateinit var btnTripToggle: Button
    private lateinit var btnModeToggle: Button

    private var recentEventText: String = "None"
    private var isDemoMode: Boolean = false
    private var currentDriverId: String = com.dms.edge.config.AppConfig.DEFAULT_DRIVER_ID
    private var currentDriverName: String = "Driver"

    // Periodic 1-second ticker for safe driving score recovery (+20 pts after 1 min clean driving)
    private val recoveryCheckHandler = Handler(Looper.getMainLooper())
    private val recoveryCheckRunnable = object : Runnable {
        override fun run() {
            if (tripSessionManager.isTripActive && tripSessionManager.currentState != TripState.PAUSED) {
                riskEngine.checkCleanDrivingRecovery()
            }
            recoveryCheckHandler.postDelayed(this, 1000L)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Initialize UI Views
        viewFinder = findViewById(R.id.viewFinder)
        tvScoreValue = findViewById(R.id.tvScoreValue)
        tvMonitoringStatus = findViewById(R.id.tvMonitoringStatus)
        tvGpsStatus = findViewById(R.id.tvGpsStatus)
        tvAlertMessage = findViewById(R.id.tvAlertMessage)
        tvDriverBadge = findViewById(R.id.tvDriverBadge)
        btnTripToggle = findViewById(R.id.btnTripToggle)
        btnModeToggle = findViewById(R.id.btnModeToggle)

        // Read logged in driver credentials
        currentDriverId = intent.getStringExtra(com.dms.edge.auth.LoginActivity.EXTRA_DRIVER_ID)
            ?: com.dms.edge.config.AppConfig.DEFAULT_DRIVER_ID
        tvDriverBadge.text = "DRIVER: $currentDriverId"

        // Initialize Audio & Visual Alert Manager
        alertManager = AlertManager(this)

        // Initialize Location Tracker & Central Risk Engine
        locationTracker = LocationTracker(this)
        riskEngine = RiskEngine { event ->
            runOnUiThread {
                handleRiskAlert(event)
            }
        }

        // Initialize Trip Session Manager with State Machine Observer
        tripSessionManager = TripSessionManager(this, locationTracker, riskEngine) { newState ->
            runOnUiThread {
                updateUiForState(newState)
            }
        }

        // Initialize MediaPipe / ML Kit Face Detector Engine
        mediaPipeEngine.initialize(this)

        // Setup Pipeline Mode Toggle (Live Camera vs Demo Simulation)
        btnModeToggle.setOnClickListener {
            isDemoMode = !isDemoMode
            if (isDemoMode) {
                btnModeToggle.text = "MODE: DEMO"
                btnModeToggle.backgroundTintList = ContextCompat.getColorStateList(this, R.color.purple_500)
                Toast.makeText(this, "DEMO MODE: Automated driver risk scenario", Toast.LENGTH_SHORT).show()
            } else {
                btnModeToggle.text = "MODE: LIVE"
                btnModeToggle.backgroundTintList = ContextCompat.getColorStateList(this, R.color.card_bg)
                Toast.makeText(this, "LIVE MODE: Real-time camera eye & face tracking", Toast.LENGTH_SHORT).show()
            }
        }

        // Create Frame Analyzer connected to live CV engine
        val analyzer = DriverMonitoringAnalyzer(mediaPipeEngine) { frameResult ->
            runOnUiThread {
                if (tripSessionManager.isTripActive && tripSessionManager.currentState != TripState.PAUSED) {
                    if (isDemoMode) {
                        val (simDrowsiness, simYawn, simYolo) = demoEngine.evaluateDemoStep()
                        riskEngine.processSignals(
                            drowsiness = simDrowsiness,
                            yawn = simYawn,
                            yolo = simYolo
                        )
                    } else {
                        val drowsiness = mediaPipeEngine.lastDrowsinessResult
                        val yawn = mediaPipeEngine.lastYawnResult
                        riskEngine.processSignals(
                            drowsiness = drowsiness,
                            yawn = yawn,
                            isDistracted = frameResult.isDistracted && !(drowsiness?.prolongedClosure ?: false)
                        )
                    }
                }
            }
        }

        cameraManager = CameraManager(this, viewFinder, this, analyzer)

        // Setup Start/Stop Trip Listener
        btnTripToggle.setOnClickListener {
            if (tripSessionManager.isTripActive) {
                stopTrip()
            } else {
                startTrip()
            }
        }

        // Initialize UI state
        updateUiForState(tripSessionManager.currentState)
        updateGpsAndNetworkIndicators()
    }

    private fun startTrip() {
        if (!allPermissionsGranted()) {
            ActivityCompat.requestPermissions(
                this, REQUIRED_PERMISSIONS, REQUEST_CODE_PERMISSIONS
            )
            return
        }

        recentEventText = "None"
        alertManager.stopEmergencySiren()
        if (isDemoMode) {
            demoEngine.startDemoSimulation()
        }

        // Start periodic 1-second clean driving recovery evaluation
        recoveryCheckHandler.removeCallbacks(recoveryCheckRunnable)
        recoveryCheckHandler.postDelayed(recoveryCheckRunnable, 1000L)

        tripSessionManager.startTrip(driverId = currentDriverId) {
            cameraManager.startCamera(
                onSuccess = {
                    runOnUiThread {
                        updateGpsAndNetworkIndicators()
                        Logger.i("MainActivity", "Trip started for $currentDriverId ($currentDriverName). State: ${tripSessionManager.currentState}")
                    }
                },
                onError = { exc ->
                    runOnUiThread {
                        updateUiForState(tripSessionManager.currentState)
                        Toast.makeText(this, "Camera error: ${exc.message}", Toast.LENGTH_LONG).show()
                    }
                }
            )
        }
    }

    private fun stopTrip() {
        recoveryCheckHandler.removeCallbacks(recoveryCheckRunnable)
        alertManager.stopEmergencySiren()
        if (isDemoMode) {
            demoEngine.stopDemoSimulation()
        }
        cameraManager.stopCamera()
        tripSessionManager.stopTrip {
            runOnUiThread {
                updateGpsAndNetworkIndicators()
                Logger.i("MainActivity", "Trip completed cleanly.")
            }
        }
    }

    private fun handleRiskAlert(event: RiskEngineEvent) {
        // 1. Trigger audio warning chime or high-volume emergency siren and format visual text
        val warningText = alertManager.triggerAlert(event)

        if (event.eventType == "SCORE_RECOVERY") {
            val ptsGained = kotlin.math.abs(event.pointsDeducted)
            recentEventText = "Clean Driving (+${ptsGained} pts)"
        } else {
            recentEventText = "${event.eventType} (-${event.pointsDeducted} pts)"
        }

        // 2. Report risk event through TripSessionManager
        tripSessionManager.reportRiskEvent(event)

        // 3. Update safety score and alert banner on UI
        tvScoreValue.text = event.currentScore.toString()
        if (event.currentScore <= 0) {
            tvScoreValue.setTextColor(ContextCompat.getColor(this, R.color.status_danger))
            tvAlertMessage.text = "🚨 EMERGENCY: SAFETY SCORE AT 0!\n$warningText"
            tvAlertMessage.setBackgroundColor(ContextCompat.getColor(this, R.color.status_danger))
        } else {
            tvScoreValue.setTextColor(ContextCompat.getColor(this, R.color.score_green))
            if (event.eventType == "SCORE_RECOVERY") {
                tvAlertMessage.text = "$warningText\nScore restored to ${event.currentScore}/100"
                tvAlertMessage.setBackgroundColor(ContextCompat.getColor(this, R.color.status_active))
            } else {
                tvAlertMessage.text = "$warningText\nRecent: $recentEventText"
                val alertBgColor = when (event.severity) {
                    "CRITICAL", "HIGH" -> R.color.status_danger
                    "MEDIUM" -> R.color.status_warning
                    else -> R.color.card_bg
                }
                tvAlertMessage.setBackgroundColor(ContextCompat.getColor(this, alertBgColor))
            }
        }
    }

    private fun updateUiForState(state: TripState) {
        tvScoreValue.text = riskEngine.getCurrentScore().toString()
        tvMonitoringStatus.text = state.displayName

        when (state) {
            TripState.MONITORING -> {
                tvMonitoringStatus.setBackgroundColor(ContextCompat.getColor(this, R.color.status_active))
                btnTripToggle.text = getString(R.string.btn_stop_trip)
                btnTripToggle.backgroundTintList = ContextCompat.getColorStateList(this, R.color.btn_stop)
                tvAlertMessage.text = "${getString(R.string.msg_active)}\nRecent: $recentEventText"
                tvAlertMessage.setBackgroundColor(ContextCompat.getColor(this, R.color.card_bg))
            }
            TripState.PAUSED -> {
                tvMonitoringStatus.setBackgroundColor(ContextCompat.getColor(this, R.color.status_warning))
                tvAlertMessage.text = "Monitoring Paused (App Backgrounded)\nRecent: $recentEventText"
                tvAlertMessage.setBackgroundColor(ContextCompat.getColor(this, R.color.status_warning))
            }
            TripState.NETWORK_DEGRADED -> {
                tvMonitoringStatus.text = "OFFLINE"
                tvMonitoringStatus.setBackgroundColor(ContextCompat.getColor(this, R.color.status_warning))
                btnTripToggle.text = getString(R.string.btn_stop_trip)
                btnTripToggle.backgroundTintList = ContextCompat.getColorStateList(this, R.color.btn_stop)
                if (recentEventText != "None") {
                    tvAlertMessage.text = "${getString(R.string.msg_active)}\nRecent: $recentEventText"
                } else {
                    tvAlertMessage.text = "Active Monitoring (Offline Telemetry Queued)"
                }
            }
            TripState.STARTING, TripState.STOPPING -> {
                tvMonitoringStatus.setBackgroundColor(ContextCompat.getColor(this, R.color.status_warning))
            }
            TripState.IDLE, TripState.COMPLETED -> {
                alertManager.stopEmergencySiren()
                tvMonitoringStatus.setBackgroundColor(ContextCompat.getColor(this, R.color.status_idle))
                btnTripToggle.text = getString(R.string.btn_start_trip)
                btnTripToggle.backgroundTintList = ContextCompat.getColorStateList(this, R.color.btn_start)
                tvAlertMessage.text = getString(R.string.msg_standby)
                tvAlertMessage.setBackgroundColor(ContextCompat.getColor(this, R.color.card_bg))
            }
        }
    }

    private fun updateGpsAndNetworkIndicators() {
        val isGpsOn = locationTracker.isGpsAvailable()
        val isOnline = tripSessionManager.networkMonitor.isOnline()
        val queueSize = tripSessionManager.offlineQueue.getQueueSize()

        val gpsText = if (isGpsOn) "GPS ACTIVE" else "GPS SEARCHING"
        val networkText = if (isOnline) {
            if (queueSize > 0) "SYNCING QUEUE ($queueSize)" else "ONLINE"
        } else {
            "OFFLINE QUEUED ($queueSize)"
        }

        tvGpsStatus.text = "$currentDriverId | $gpsText | $networkText"
        val statusColor = if (isGpsOn && isOnline) R.color.status_active else R.color.status_warning
        tvGpsStatus.setTextColor(ContextCompat.getColor(this, statusColor))
    }

    private fun allPermissionsGranted() = REQUIRED_PERMISSIONS.all {
        ContextCompat.checkSelfPermission(baseContext, it) == PackageManager.PERMISSION_GRANTED
    }

    override fun onRequestPermissionsResult(
        requestCode: Int, permissions: Array<String>, grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == REQUEST_CODE_PERMISSIONS) {
            if (allPermissionsGranted()) {
                startTrip()
            } else {
                Toast.makeText(this, "Camera and Location permissions are required for driver monitoring.", Toast.LENGTH_LONG).show()
            }
        }
    }

    override fun onPause() {
        super.onPause()
        alertManager.stopEmergencySiren()
        if (tripSessionManager.isTripActive) {
            Logger.i("MainActivity", "App backgrounded. Pausing camera & monitoring cleanly.")
            cameraManager.stopCamera()
            tripSessionManager.pauseMonitoring()
        }
    }

    override fun onResume() {
        super.onResume()
        updateGpsAndNetworkIndicators()
        if (tripSessionManager.currentState == TripState.PAUSED) {
            Logger.i("MainActivity", "App foregrounded. Resuming monitoring session...")
            tripSessionManager.resumeMonitoring()
            if (allPermissionsGranted()) {
                cameraManager.startCamera()
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        recoveryCheckHandler.removeCallbacks(recoveryCheckRunnable)
        cameraManager.stopCamera()
        locationTracker.stopLocationUpdates()
        alertManager.release()
        mediaPipeEngine.release()
    }

    companion object {
        private const val REQUEST_CODE_PERMISSIONS = 10
        private val REQUIRED_PERMISSIONS = arrayOf(
            Manifest.permission.CAMERA,
            Manifest.permission.ACCESS_FINE_LOCATION
        )
    }
}
