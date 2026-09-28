# DriveGuard AI - UI Consistency & Error Handling Standards

DriveGuard AI enforces standardized design tokens, color semantics, and error handling across both the **Android Vehicle HUD** and **React Web Dashboard**.

---

## 🎨 Color Tokens & Semantic Meanings

| Design Role | Tailwind Class (Web) | Color Hex | Usage |
| :--- | :--- | :--- | :--- |
| **Primary Brand** | `bg-blue-600`, `text-blue-600` | `#2563EB` | Active buttons, primary score highlights, brand icons |
| **Header & Sidebar** | `bg-slate-900`, `bg-slate-800` | `#0F172A`, `#1E293B` | Top navbar, navigation drawer, map card headers |
| **Background Surface** | `bg-slate-100` | `#F1F5F9` | Main application background container |
| **Active / Normal State** | `bg-emerald-600`, `text-emerald-400` | `#059669` | Live edge node status, optimal safety scores ($\ge 80$) |
| **Warning / Caution** | `bg-amber-500`, `text-amber-400` | `#F59E0B` | Medium severity alerts, degraded network, scores ($60-79$) |
| **Critical Alert** | `bg-red-600`, `text-red-600` | `#DC2626` | Drowsiness alerts, phone usage warnings, scores ($< 60$) |

---

## 📱 Android HUD Design Standards

1. **High Contrast Display**: Large font sizes (`3xl` / `48sp`) for the Safety Score Card to ensure readability while mounted on a vehicle windshield/dashboard.
2. **Minimal Driver Interaction**: Single large toggle button (**Start Trip** / **Stop Trip**); alerts play audio chimes with automated clear timers so drivers never need to touch the phone while driving.
3. **Demo Mode Indicator**: Amber status banner `[DEMO MODE: REPLAY SIMULATION]` displayed persistently whenever demo mode is toggled.

---

## 🖥 Web Dashboard Design Standards

1. **Standardized States**:
   - **Loading State**: Uses `<LoadingSpinner message="..." />` component.
   - **Empty State**: Uses `<EmptyState title="..." message="..." icon="..." />` component.
   - **Error State**: Uses `<ErrorMessage message="..." onRetry={...} />` component.
2. **Explicit Metric Scoping**: Every analytics KPI card explicitly states whether the calculation scope is `per-driver`, `per-trip`, or `per-event`.
