# DriveGuard AI - Troubleshooting & Debugging Guide

This guide addresses common issues encountered during setup, testing, or academic demonstrations.

---

## 🛠 Common Issue Resolutions

### 1. Port Conflicts (`EADDRINUSE: port 5000`)
- **Symptom**: Backend fails to start with `Error: listen EADDRINUSE: address already in use :::5000`.
- **Solution**:
  - Kill the process holding port 5000:
    - **Windows (PowerShell)**:
      ```powershell
      Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process
      ```
    - **Linux/macOS**:
      ```bash
      lsof -i :5000 | awk 'NR>1 {print $2}' | xargs kill -9
      ```
  - Or update `PORT=5001` in `backend/.env`.

---

### 2. CORS Blocked Request on Web Dashboard
- **Symptom**: Web Dashboard console displays `Access to XMLHttpRequest at 'http://localhost:5000/api' from origin 'http://localhost:5173' has been blocked by CORS policy`.
- **Solution**:
  - Open `backend/src/config/env.js` and verify `http://localhost:5173` is listed under `allowedOrigins`.
  - Restart the backend server (`npm run dev`).

---

### 3. Android App Camera Permission Denied
- **Symptom**: App displays "Camera and Location permissions are required for driver monitoring" toast and fails to start preview.
- **Solution**:
  - Open device **Settings -> Apps -> DriveGuard AI -> Permissions**.
  - Enable **Camera** and **Location (While Using App)** permissions.

---

### 4. Offline Telemetry Queue Not Syncing
- **Symptom**: Android HUD displays `OFFLINE QUEUED (N)` and backend shows no new events.
- **Solution**:
  - Verify mobile device is connected to the same Wi-Fi network as the backend server.
  - Verify the server IP address configured in `AppConfig.kt` matches the backend host IP (e.g. `http://192.168.1.100:5000/api`).

---

### 5. MongoDB Connection Timeout / Fallback Mode
- **Symptom**: Backend console shows `MongoDB Initial Connection Error: connect ECONNREFUSED`.
- **Solution**:
  - This is **normal in fallback dev mode**! DriveGuard AI automatically switches to dual-mode in-memory storage, allowing all REST endpoints, unit tests, and dashboard views to operate cleanly without requiring local MongoDB daemon setup.
