package com.dms.edge.auth

import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.dms.edge.MainActivity
import com.dms.edge.R
import com.dms.edge.utils.Logger

/**
 * Dedicated Driver Sign-In Screen.
 * Driver logs in simply with Driver ID and Password before accessing the monitoring cockpit.
 */
class LoginActivity : AppCompatActivity() {

    companion object {
        const val EXTRA_DRIVER_ID = "com.dms.edge.EXTRA_DRIVER_ID"

        private const val PREFS_NAME = "driver_auth_prefs"
        private const val KEY_DRIVER_ID = "pref_driver_id"
    }

    private lateinit var etDriverId: EditText
    private lateinit var etPassword: EditText
    private lateinit var btnQuickFillDemo: Button
    private lateinit var btnSignIn: Button

    private lateinit var prefs: SharedPreferences

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login)

        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

        // Initialize view references
        etDriverId = findViewById(R.id.etDriverId)
        etPassword = findViewById(R.id.etPassword)
        btnQuickFillDemo = findViewById(R.id.btnQuickFillDemo)
        btnSignIn = findViewById(R.id.btnSignIn)

        // Preload saved or clean Driver ID
        val savedDriverId = prefs.getString(KEY_DRIVER_ID, "") ?: ""
        if (savedDriverId.isNotEmpty()) {
            etDriverId.setText(savedDriverId)
        }

        // Quick-Fill Demo Button
        btnQuickFillDemo.setOnClickListener {
            etDriverId.setText("DRV-001")
            etPassword.setText("driver123")
            Toast.makeText(this, "Sample Driver credentials filled (DRV-001 / driver123)", Toast.LENGTH_SHORT).show()
        }

        // Driver Login Action
        btnSignIn.setOnClickListener {
            performDriverLogin()
        }
    }

    private fun performDriverLogin() {
        val driverId = etDriverId.text.toString().trim()
        val password = etPassword.text.toString().trim()

        if (driverId.isEmpty()) {
            etDriverId.error = "Driver ID is required"
            etDriverId.requestFocus()
            return
        }

        if (password.isEmpty()) {
            etPassword.error = "Password is required"
            etPassword.requestFocus()
            return
        }

        // Save last logged in Driver ID
        prefs.edit().putString(KEY_DRIVER_ID, driverId).apply()

        Logger.i("LoginActivity", "Driver authenticated: $driverId")
        Toast.makeText(this, "Welcome Driver $driverId! Shift Active.", Toast.LENGTH_SHORT).show()

        // Launch MainActivity cockpit
        val intent = Intent(this, MainActivity::class.java).apply {
            putExtra(EXTRA_DRIVER_ID, driverId)
        }
        startActivity(intent)
        finish()
    }
}
