import React from 'react';
import { LogOut, Shield, User } from 'lucide-react';

export const Navbar = ({ onToggleSidebar, user, onLogout }) => {
  return (
    <header className="bg-slate-900 text-white shadow-md px-4 md:px-6 py-3.5 flex justify-between items-center sticky top-0 z-30 border-b border-slate-800">
      <div className="flex items-center space-x-3">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden p-2 rounded-md hover:bg-slate-800 text-slate-300 focus:outline-none"
            aria-label="Toggle navigation drawer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-lg text-white shadow-md shadow-blue-500/20">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight block leading-none">DriveGuard AI</span>
          <span className="text-[10px] text-slate-400 font-medium">Edge Fleet Telemetry Portal</span>
        </div>
      </div>

      <div className="flex items-center space-x-3 md:space-x-4">
        <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>
          Edge Network Active
        </span>

        {/* User Info & Logout Button */}
        <div className="flex items-center space-x-3 border-l border-slate-800 pl-3 md:pl-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden sm:block text-xs text-left">
              <span className="font-semibold block text-white leading-tight">
                {user?.name || user?.username || 'Fleet Manager'}
              </span>
              <span className="text-[10px] text-blue-400 uppercase tracking-wider font-mono">
                {user?.role || 'MANAGER'} {user?.managerId ? `• ${user.managerId}` : ''}
              </span>
            </div>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800 border border-transparent hover:border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
