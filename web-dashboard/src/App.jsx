import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { ActiveTrips } from './pages/ActiveTrips';
import { TripDetail } from './pages/TripDetail';
import { Drivers } from './pages/Drivers';
import { Alerts } from './pages/Alerts';
import { Analytics } from './pages/Analytics';
import { Login } from './pages/Login';

function ProtectedLayout({ user, onLogout, sidebarOpen, setSidebarOpen }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 font-sans text-slate-800 antialiased">
      <Navbar
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        user={user}
        onLogout={onLogout}
      />
      <div className="flex flex-1 relative">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/trips" element={<ActiveTrips />} />
            <Route path="/trips/:id" element={<TripDetail />} />
            <Route path="/drivers" element={<Drivers />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('driveguard_user') || sessionStorage.getItem('driveguard_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const handleLogout = () => {
    localStorage.removeItem('driveguard_token');
    localStorage.removeItem('driveguard_user');
    sessionStorage.removeItem('driveguard_token');
    sessionStorage.removeItem('driveguard_user');
    setUser(null);
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/" replace />
            ) : (
              <Login onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />
            )
          }
        />
        <Route
          path="/*"
          element={
            <ProtectedLayout
              user={user}
              onLogout={handleLogout}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
            />
          }
        />
      </Routes>
    </Router>
  );
}
