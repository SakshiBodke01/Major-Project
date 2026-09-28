# DriveGuard AI - Web Fleet Dashboard

React + Vite + Tailwind CSS fleet management & telemetry analytics web application.

---

## 💻 Subsystem Overview

- **Location**: `web-dashboard/src`
- **Tech Stack**: React 18, Vite 5, Tailwind CSS 3, Axios, Lucide React
- **Pages**:
  - `Dashboard.jsx`: Overview page with fleet KPIs, active vehicles, and live risk feeds
  - `Analytics.jsx`: Driver safety-score trends over time, risk event distributions, high-risk driver flags, sample-size disclaimers, and GPS route visualization
  - `ActiveTrips.jsx`: Filtered list of active and completed driver trips
  - `TripDetail.jsx`: Chronological risk timeline, GPS route waypoints, and score snapshots
  - `Drivers.jsx`: Driver roster and safety ratings
  - `Alerts.jsx`: Filterable alert feeds by severity and event type

---

## 🚀 Setup & Build Instructions

```bash
cd web-dashboard
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Build production bundle
npm run build
```
- Development URL: `http://localhost:5173`
