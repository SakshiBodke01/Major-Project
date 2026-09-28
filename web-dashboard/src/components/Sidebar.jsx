import React from 'react';
import { NavLink } from 'react-router-dom';

export const Sidebar = ({ isOpen, onClose }) => {
  const navItems = [
    { label: 'Overview', path: '/' },
    { label: 'Active Trips', path: '/trips' },
    { label: 'Drivers', path: '/drivers' },
    { label: 'Alerts Log', path: '/alerts' },
  ];

  const sidebarContent = (
    <aside className="w-64 bg-slate-800 text-slate-200 min-h-screen p-4 flex flex-col justify-between">
      <div>
        <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Navigation
        </div>
        <nav className="space-y-1 mt-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `block px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 text-xs text-slate-400 space-y-1">
        <div className="font-semibold text-slate-300">Privacy Standard</div>
        <div>Zero video egress. Driver frames analyzed in local mobile RAM.</div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block">{sidebarContent}</div>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 md:hidden flex">
          <div className="fixed inset-0 bg-slate-950/70" onClick={onClose}></div>
          <div className="relative z-50">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
