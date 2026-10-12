# DriveGuard AI - UI Consistency & Design Standards

DriveGuard AI enforces standardized design tokens, color semantics, and UX conventions across both the **Android Vehicle HUD** and the **React Fleet Management Dashboard**.

---

## 🎨 Color Tokens & Semantic Meanings

| Design Role | Tailwind Token (Web) | Android Color Token | Hex Code | Visual Meaning |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Brand** | `bg-blue-600` | `@color/primary_blue` | `#2563EB` | Active buttons, primary score highlights, brand icons |
| **Header & Sidebar** | `bg-slate-900` | `@color/hud_surface_dark` | `#0F172A` | Top navbar, navigation drawer, HUD background |
| **Card Surface** | `bg-slate-800` | `@color/card_surface` | `#1E293B` | Telemetry containers, map card headers |
| **Canvas Background** | `bg-slate-100` | `@color/canvas_light` | `#F1F5F9` | Main application background container (Web) |
| **Optimal Safety** | `bg-emerald-600` | `@color/score_optimal` | `#059669` | Live edge node status, optimal safety scores ($\ge 80$) |
| **Moderate Warning** | `bg-amber-500` | `@color/score_warning` | `#F59E0B` | Medium severity alerts, degraded network, scores ($60-79$) |
| **Critical Hazard** | `bg-red-600` | `@color/score_danger` | `#DC2626` | Drowsiness alerts, phone usage warnings, scores ($< 60$) |

---

## 📱 Android Vehicle HUD Design Standards

1. **High-Contrast Glancability**: Large typography (`48sp` / `text-5xl`) for the primary safety score meter so drivers can assess status at a glance without distraction.
2. **Zero In-Drive Touch Required**: Single primary action button (**Start Trip** / **Stop Trip**). Alerts trigger audio chimes and automated self-dismissing visual HUD banners without requiring driver interaction.
3. **Academic Demo Mode Transparency**: When Demo Mode is active, a persistent high-contrast amber banner `[DEMO MODE: REPLAY SIMULATION]` is pinned to the top of the HUD to prevent any ambiguity with real live inference.
4. **Resilient Network Indicators**: Displays `OFFLINE QUEUED (N)` or `NETWORK DEGRADED` when connectivity drops, assuring the driver that local scoring and audio chimes remain active.

---

## 🖥 Web Dashboard Design Standards

1. **Defensive UI States**:
   - **Loading State**: Uses `<LoadingSpinner message="..." />` component with descriptive loading messages.
   - **Empty State**: Uses `<EmptyState title="..." message="..." icon="..." />` with actionable guidance when filters return no records.
   - **Error State**: Uses `<ErrorMessage message="..." onRetry={...} />` with an immediate retry button.
2. **Explicit Metric Scoping**: Every analytics KPI card explicitly labels calculation granularity:
   - `[Per-Driver Scope]`: e.g. Driver Safety Rating
   - `[Per-Trip Scope]`: e.g. Average Trip Duration, Trip Score
   - `[Per-Event Scope]`: e.g. Drowsiness Incidents, Deductions
3. **Responsive Grid Layout**: Adaptive CSS grid layout collapsing from 4 columns on desktop ($> 1280\text{px}$) to single column on mobile devices ($< 640\text{px}$).
