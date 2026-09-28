import React from 'react';

export const Navbar = ({ onToggleSidebar }) => {
  return (
    <header className="bg-slate-900 text-white shadow-md px-4 md:px-6 py-3.5 flex justify-between items-center sticky top-0 z-30">
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
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-lg text-white">
          D
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight block leading-none">DriveGuard AI</span>
          <span className="text-[10px] text-slate-400 font-medium">Edge Fleet Telemetry Portal</span>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>
          Edge Network Active
        </span>
        <div className="hidden sm:block text-xs text-slate-300 border-l border-slate-700 pl-3">
          <span className="font-semibold block text-white">Fleet Manager</span>
          <span className="text-[10px] text-slate-400">HQ Operator</span>
        </div>
      </div>
    </header>
  );
};
