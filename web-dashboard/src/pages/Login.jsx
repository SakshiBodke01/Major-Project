import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight, Activity, Briefcase } from 'lucide-react';
import { authService } from '../services/api';

export const Login = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('manager');
  const [password, setPassword] = useState('@manager123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Please enter both Manager username and password.');
      return;
    }

    setIsLoading(true);

    try {
      // Attempt Manager login with explicit role: 'MANAGER'
      const response = await authService.login({ username, password, role: 'MANAGER' });
      
      const token = response.data?.token || 'mock_mgr_jwt_' + Date.now();
      const user = response.data?.user || {
        username,
        managerId: username === 'admin' ? 'MGR-ADMIN' : 'MGR-001',
        role: 'MANAGER',
        name: username === 'admin' ? 'Central Fleet Admin' : 'Fleet Operations Manager',
      };

      if (user.role !== 'MANAGER') {
        setErrorMessage('Access denied. This web portal is restricted to Managers only.');
        setIsLoading(false);
        return;
      }

      if (rememberMe) {
        localStorage.setItem('driveguard_token', token);
        localStorage.setItem('driveguard_user', JSON.stringify(user));
      } else {
        sessionStorage.setItem('driveguard_token', token);
        sessionStorage.setItem('driveguard_user', JSON.stringify(user));
      }

      setSuccessMessage('Manager authenticated! Redirecting to fleet portal...');
      if (onLoginSuccess) onLoginSuccess(user);

      setTimeout(() => {
        navigate(from, { replace: true });
      }, 700);
    } catch (err) {
      if (
        (username === 'manager' && password === '@manager123') ||
        (username === 'admin' && password === '@admin123')
      ) {
        const mockManager = {
          username,
          managerId: username === 'admin' ? 'MGR-ADMIN' : 'MGR-001',
          name: username === 'admin' ? 'Central Fleet Admin' : 'Fleet Operations Manager',
          role: 'MANAGER',
        };
        const mockToken = 'mock_mgr_token_' + Date.now();
        localStorage.setItem('driveguard_token', mockToken);
        localStorage.setItem('driveguard_user', JSON.stringify(mockManager));

        setSuccessMessage('Logged in as Manager (Offline Session). Redirecting...');
        if (onLoginSuccess) onLoginSuccess(mockManager);

        setTimeout(() => {
          navigate(from, { replace: true });
        }, 700);
      } else {
        setErrorMessage(
          err.message || 'Invalid Manager credentials. Drivers must use the Android app.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (u, p) => {
    setUsername(u);
    setPassword(p);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md z-10 space-y-8">
        {/* Header / Brand Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-xl shadow-blue-500/25 ring-4 ring-blue-500/10 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">DriveGuard Manager Portal</h1>
          <p className="mt-1.5 text-xs text-slate-400">
            Fleet Supervisor & Safety Operations Console
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-950 border border-blue-800 text-[11px] text-blue-300 font-medium">
            <Briefcase className="w-3 h-3 text-blue-400" />
            <span>Role: <strong>MANAGER ONLY</strong></span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">Drivers use Android App</span>
          </div>
        </div>

        {/* Card Container */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6">
          {/* Error Feedback */}
          {errorMessage && (
            <div className="p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 text-xs text-red-300 animate-shake">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{errorMessage}</div>
            </div>
          )}

          {/* Success Feedback */}
          {successMessage && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-3 text-xs text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{successMessage}</div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Username / Manager ID */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Manager Username / ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. manager1 or admin"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter manager password"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-300 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 hover:text-slate-300">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                />
                <span>Remember session</span>
              </label>
              <span className="text-xs text-slate-500">Manager Authorization</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-60 text-white font-semibold rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating Manager...</span>
                </>
              ) : (
                <>
                  <span>Sign In as Manager</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick-Fill Manager Accounts */}
          <div className="pt-4 border-t border-slate-800">
            <span className="block text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
              One-Click Demo Manager Logins
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('manager', '@manager123')}
                className="p-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-lg text-left transition-colors"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400">
                  <Briefcase className="w-3.5 h-3.5" /> Fleet Manager
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">manager / @manager123</div>
                <div className="text-[9px] text-slate-500 font-mono">ID: MGR-001</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('admin', '@admin123')}
                className="p-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-lg text-left transition-colors"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <Activity className="w-3.5 h-3.5" /> Central Admin
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">admin / @admin123</div>
                <div className="text-[9px] text-slate-500 font-mono">ID: MGR-ADMIN</div>
              </button>
            </div>
          </div>
        </div>

        {/* Informative Footer */}
        <div className="text-center text-xs text-slate-500 space-y-1">
          <p className="flex items-center justify-center gap-1.5 text-slate-400">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Driver accounts log into the Android Cockpit application.</span>
          </p>
          <p className="text-[11px] text-slate-600">DriveGuard AI v1.0.0 • Role Separated Architecture</p>
        </div>
      </div>
    </div>
  );
};
