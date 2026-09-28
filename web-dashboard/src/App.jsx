import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { ActiveTrips } from './pages/ActiveTrips';
import { TripDetail } from './pages/TripDetail';
import { Drivers } from './pages/Drivers';
import { Alerts } from './pages/Alerts';
import { Analytics } from './pages/Analytics';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-slate-100 font-sans text-slate-800 antialiased">
        <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
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
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
}
