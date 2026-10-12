# DriveGuard AI - Web Fleet Management Dashboard

Responsive, real-time fleet safety management and telemetry analytics dashboard built with **React 18**, **Vite 5**, and **Tailwind CSS 3**.

---

## 💻 Subsystem Overview

The Web Dashboard serves fleet managers and safety supervisors by providing real-time visibility into driver vigilance, trip telemetry, risk events, and fleet-wide safety performance trends without ever exposing sensitive driver camera imagery.

- **Location**: `web-dashboard/src`
- **Tech Stack**: React 18, Vite 5, Tailwind CSS 3, Axios, Lucide React, React Router 6
- **API Base URL**: `http://localhost:5000/api` (Configurable via `VITE_API_BASE_URL`)

---

## 🧭 Pages & Views

| Page | File | Description |
| :--- | :--- | :--- |
| **Fleet Overview** | `pages/Dashboard.jsx` | High-level fleet KPIs (Total trips, active drivers, average fleet score, critical alerts) and live risk event ticker. |
| **Active Trips** | `pages/ActiveTrips.jsx` | Real-time list of currently active vehicle trips with live score meters, status badges, and direct links to trip telemetry. |
| **Trip Detail** | `pages/TripDetail.jsx` | Deep-dive trip analysis displaying chronological score deduction history, risk event timeline, and GPS waypoint breadcrumbs. |
| **Driver Roster** | `pages/Drivers.jsx` | Directory of registered drivers, current duty statuses (`ACTIVE`, `ON_TRIP`, `INACTIVE`), and overall safety ratings. |
| **Alert Feed** | `pages/Alerts.jsx` | Filterable log of all risk events by severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) and event type (`DROWSINESS`, `PHONE_USE`, `DISTRACTION`, `YAWNING`). |
| **Fleet Analytics** | `pages/Analytics.jsx` | Longitudinal trend charts, event distribution breakdowns, high-risk driver flags, and historical performance aggregations. |

---

## 🧩 UI Component Architecture

```text
web-dashboard/src/
├── components/
│   ├── layout/
│   │   ├── Navbar.jsx                 # Top header with status indicators & quick actions
│   │   └── Sidebar.jsx                # Collapsible navigation drawer
│   ├── common/
│   │   ├── LoadingSpinner.jsx         # Accessible animated loading spinner with custom label
│   │   ├── EmptyState.jsx             # Informative placeholder for empty query results
│   │   ├── ErrorMessage.jsx           # Error alert box with action retry button
│   │   └── MetricCard.jsx             # KPI stat card with delta indicators
│   ├── alerts/
│   │   ├── AlertBanner.jsx            # Dynamic severity badge and alert card
│   │   └── AlertFilterBar.jsx         # Severity and event-type filter controls
│   └── map/
│       └── GpsRouteMap.jsx            # Interactive GPS route coordinate viewer
├── services/
│   └── api.js                         # Axios client with interceptors & centralized endpoints
├── utils/
│   ├── formatters.js                  # Date, duration, and coordinate formatting utilities
│   └── scoreColors.js                 # Unified color mapping (Emerald / Amber / Red)
├── App.jsx                            # Router configuration & root layout wrapper
└── main.jsx                           # React DOM mount point
```

---

## 🚀 Setup & Build Instructions

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)

### 1. Install Dependencies
```bash
cd web-dashboard
npm install
```

### 2. Configure Environment (Optional)
Create a `.env` file in `web-dashboard/`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3. Run Development Server
```bash
npm run dev
```
- Local URL: `http://localhost:5173`

### 4. Build Production Bundle
```bash
npm run build
```
- Output Directory: `dist/`
- Build Size: ~260 kB JS / ~22 kB CSS (gzipped: ~80 kB)

### 5. Preview Production Build
```bash
npm run preview
```

---

## 🎨 UI Design System & Semantic Color Tokens

| Semantic Role | Tailwind Token | Hex Code | Visual Meaning |
| :--- | :--- | :--- | :--- |
| **Brand Primary** | `blue-600` | `#2563EB` | Active buttons, primary accents, links |
| **Surface Dark** | `slate-900` | `#0F172A` | Sidebar, main navigation headers |
| **Surface Light** | `slate-100` | `#F1F5F9` | Content canvas background |
| **Optimal Safety** | `emerald-500` / `emerald-600` | `#10B981` | Safety scores $\ge 80$, active online status |
| **Moderate Warning** | `amber-500` | `#F59E0B` | Safety scores $60 - 79$, medium severity alerts |
| **Critical Hazard** | `red-600` | `#DC2626` | Safety scores $< 60$, drowsiness, phone use |
