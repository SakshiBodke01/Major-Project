# DriveGuard AI - Troubleshooting & Debugging Guide

This guide addresses common issues encountered during local development, device deployment, integration testing, and academic presentations.

---

## 🛠 Common Issue Resolutions

### 1. Port Conflicts (`EADDRINUSE: port 5000`)
- **Symptom**: Backend fails to start with `Error: listen EADDRINUSE: address already in use :::5000`.
- **Solution**:
  - Terminate the process holding port 5000:
    - **Windows (PowerShell)**:
      ```powershell
      Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process
      ```
    - **Linux/macOS**:
      ```bash
      lsof -i :5000 | awk 'NR>1 {print $2}' | xargs kill -9
      ```
  - Alternatively, configure an alternate port like `PORT=5001` in `backend/.env`.

---

### 2. CORS Blocked Request on Web Dashboard
- **Symptom**: Web Dashboard console displays:
  ```text
  Access to XMLHttpRequest at 'http://localhost:5000/api' from origin 'http://localhost:5173'
  has been blocked by CORS policy.
  ```
- **Solution**:
  - Open `backend/.env` (or `backend/src/config/env.js`) and ensure `http://localhost:5173` is included in `ALLOWED_ORIGINS`:
    ```env
    ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
    ```
  - Restart the backend server (`npm run dev`).

---

### 3. Android Gradle Build Requires JDK 17+
- **Symptom**: Gradle build fails with error:
  ```text
  Android Gradle plugin requires Java 17 to run. You are currently using Java 11/1.8.
  ```
- **Solution**:
  - Point `JAVA_HOME` to JDK 17 (e.g. Eclipse Temurin JDK 17):
    ```powershell
    $env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot"
    $env:Path = "$env:JAVA_HOME\bin;$env:Path"
    .\gradlew.bat assembleDebug
    ```
  - In Android Studio: Navigate to **Settings > Build, Execution, Deployment > Build Tools > Gradle > Gradle JDK** and select **JDK 17**.

---

### 4. ADB Device Shows "Unauthorized" or Not Detected
- **Symptom**: `adb devices` shows `<device_id> unauthorized` or no devices listed.
- **Solution**:
  - Check your physical phone's screen and accept the **"Allow USB debugging?"** prompt. Check "Always allow from this computer".
  - Ensure **USB Debugging** and **Install via USB** are enabled under **Developer Options**.
  - Restart the ADB daemon:
    ```powershell
    adb kill-server
    adb start-server
    adb devices
    ```

---

### 5. Android Camera / Location Permission Denied
- **Symptom**: App displays "Camera and Location permissions are required for driver monitoring" toast and camera preview remains black.
- **Solution**:
  - Open device **Settings -> Apps -> DriveGuard AI -> Permissions**.
  - Enable **Camera** and **Location (While Using App)** permissions.
  - Or grant permissions directly via ADB:
    ```powershell
    adb shell pm grant com.dms.edge android.permission.CAMERA
    adb shell pm grant com.dms.edge android.permission.ACCESS_FINE_LOCATION
    ```

---

### 6. Offline Telemetry Queue Not Syncing to Server
- **Symptom**: Android HUD displays `OFFLINE QUEUED (N)` and backend receives no incoming events.
- **Solution**:
  - Verify mobile device and PC are connected to the same local Wi-Fi network.
  - Update the backend server IP in `android-app/app/src/main/java/com/dms/edge/config/AppConfig.kt`:
    ```kotlin
    const val BASE_URL = "http://<YOUR_PC_LAN_IP>:5000/api/"
    ```
    *(Do not use `localhost` when deploying to a physical smartphone; `localhost` refers to the phone itself).*

---

### 7. MongoDB Connection Timeout & Dual-Mode Fallback
- **Symptom**: Backend console shows `MongoDB Initial Connection Error: connect ECONNREFUSED`.
- **Solution**:
  - **This is expected behavior in fallback dev mode!** DriveGuard AI automatically falls back to its in-memory store. All REST endpoints, analytics queries, and integration tests function properly without requiring local MongoDB daemon setup.
  - If you wish to use MongoDB, start the service via `mongod` or configure a remote MongoDB Atlas URI in `backend/.env`.
