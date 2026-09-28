# DriveGuard AI - Backend REST API (Module 1 Foundation)

Production-style backend foundation for DriveGuard AI built with Node.js, Express.js, and MongoDB.

---

## Features (Module 1)
- **Express Architecture**: Clean separation of routes, controllers, services, middlewares, and database modules.
- **Database Lifecycle**: Connection management, ready-state reporting, and clean shutdown with Mongoose.
- **Middlewares**:
  - Request logging middleware capturing method, path, status, latency, and client IP.
  - Centralized error handling returning structured JSON envelopes (`{ success, message, errors, timestamp }`). Stack trace suppression in production.
  - Request validation strategy middleware (`validate.middleware.js`).
- **Health & Version Monitoring**:
  - `/api/health` & `/api/v1/health`: System uptime, RAM metrics, environment, and real-time MongoDB status.
  - `/api/version` & `/api/v1/version`: API version and environment information.
- **Graceful Shutdown**: Intercepts `SIGINT`, `SIGTERM`, `uncaughtException`, and `unhandledRejection`.

---

## Local Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm (v9 or higher)
- MongoDB instance running locally (`mongodb://localhost:27017`) or a remote MongoDB Atlas URI.

### Step 1: Environment Setup
Copy `.env.example` to create `.env`:
```bash
cp .env.example .env
```

Configure `.env` settings:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/driver_monitoring_db
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
LOG_LEVEL=info
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Start Server
- **Development Mode** (with hot reload):
  ```bash
  npm run dev
  ```
- **Production Mode**:
  ```bash
  npm start
  ```

---

## Core Foundation Endpoints

### 1. Health Check
- **GET** `/api/health` or `/api/v1/health`
- **Response**:
  ```json
  {
    "success": true,
    "message": "Server status: UP",
    "data": {
      "status": "UP",
      "timestamp": "2026-09-06T10:05:00.000Z",
      "environment": "development",
      "uptimeSec": 42,
      "memoryUsage": {
        "rssMb": 45,
        "heapTotalMb": 30,
        "heapUsedMb": 18
      },
      "database": {
        "status": "connected",
        "readyState": 1,
        "host": "localhost",
        "name": "driver_monitoring_db",
        "isConnected": true
      }
    },
    "timestamp": "2026-09-06T10:05:00.123Z"
  }
  ```

### 2. Version Information
- **GET** `/api/version` or `/api/v1/version`
- **Response**:
  ```json
  {
    "success": true,
    "message": "Application version info",
    "data": {
      "name": "dms-backend",
      "version": "1.0.0",
      "description": "REST API server for Edge-based Driver Monitoring System",
      "environment": "development",
      "apiVersion": "v1"
    },
    "timestamp": "2026-09-06T10:05:00.123Z"
  }
  ```
