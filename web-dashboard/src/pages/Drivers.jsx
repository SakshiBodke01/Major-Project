import React, { useEffect, useState } from 'react';
import { driverService } from '../services/api';
import { UserPlus, Shield, Key, Phone, FileText, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';

export const Drivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showPasswords, setShowPasswords] = useState({});

  // Current logged in manager
  const userStr = localStorage.getItem('driveguard_user') || sessionStorage.getItem('driveguard_user');
  const currentManager = userStr ? JSON.parse(userStr) : { managerId: 'MGR-001', name: 'Manager' };

  // New Driver Form State
  const [formData, setFormData] = useState({
    driverId: '',
    name: '',
    password: 'driver123',
    phone: '',
    licenseNumber: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState(null);
  const [formError, setFormError] = useState(null);

  const fetchDrivers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await driverService.getDrivers();
      if (res?.data) {
        setDrivers(res.data);
      } else if (Array.isArray(res)) {
        setDrivers(res);
      }
    } catch (err) {
      setError(err.message || 'Failed to load drivers for this manager account.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleCreateDriver = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.driverId.trim() || !formData.name.trim() || !formData.password.trim()) {
      setFormError('Driver ID, Full Name, and Password are required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        driverId: formData.driverId.trim().toUpperCase(),
        name: formData.name.trim(),
        password: formData.password.trim(),
        phone: formData.phone.trim() || null,
        licenseNumber: formData.licenseNumber.trim() || null,
      };

      const res = await driverService.createDriver(payload);
      const createdDriver = res.data || payload;

      setSuccessToast(`Driver '${createdDriver.driverId}' successfully registered! Password: ${createdDriver.password}`);
      setShowModal(false);
      setFormData({
        driverId: '',
        name: '',
        password: 'driver123',
        phone: '',
        licenseNumber: '',
      });

      // Refresh list
      fetchDrivers();

      setTimeout(() => {
        setSuccessToast(null);
      }, 7000);
    } catch (err) {
      setFormError(err.message || 'Failed to register driver ID. Please check if ID already exists.');
    } finally {
      setSubmitting(false);
    }
  };

  const togglePasswordVisibility = (id) => {
    setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {/* Header with Manager Context and Create Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Supervised Drivers</h1>
          <p className="text-slate-500 text-sm">
            Drivers created and monitored by Manager:{' '}
            <strong className="text-slate-700">{currentManager.name || currentManager.username}</strong>{' '}
            <span className="font-mono text-xs bg-slate-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold">
              ({currentManager.managerId || 'MGR-001'})
            </span>
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg shadow transition-colors self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Driver ID</span>
        </button>
      </div>

      {/* Success Notification Toast */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-600 hover:text-emerald-800 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Drivers Roster Table */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Querying drivers registered to Manager {currentManager.managerId}...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-sm text-red-600">{error}</div>
        ) : drivers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Shield className="w-12 h-12 text-slate-300 mx-auto" />
            <div className="text-base font-semibold text-slate-800">No Drivers Created Yet</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven't created any driver accounts yet. Click "Register New Driver ID" above to add drivers for your fleet.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 font-semibold text-xs rounded-md hover:bg-blue-100"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create First Driver</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 text-xs uppercase tracking-wider">
                <tr>
                  <th className="p-4">Driver ID</th>
                  <th className="p-4">Full Name</th>
                  <th className="p-4">Mobile App Password</th>
                  <th className="p-4">License / Phone</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Safety Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {drivers.map((driver) => (
                  <tr key={driver.driverId} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4 font-mono text-xs font-bold text-slate-900">
                      {driver.driverId}
                    </td>
                    <td className="p-4 font-semibold text-slate-800">
                      {driver.name}
                    </td>
                    <td className="p-4">
                      <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded text-xs font-mono text-slate-700">
                        <Key className="w-3 h-3 text-slate-400" />
                        <span>
                          {showPasswords[driver.driverId]
                            ? driver.password || 'driver123'
                            : '••••••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(driver.driverId)}
                          className="ml-1 text-slate-400 hover:text-slate-600"
                          title="Show/Hide Password"
                        >
                          {showPasswords[driver.driverId] ? (
                            <EyeOff className="w-3 h-3" />
                          ) : (
                            <Eye className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-slate-500 space-y-0.5">
                      <div>{driver.licenseNumber || '—'}</div>
                      <div className="text-[11px] text-slate-400">{driver.phone || 'No phone recorded'}</div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          driver.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : driver.status === 'ON_TRIP'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {driver.status}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-blue-600">
                      {driver.safetyRating ?? 100} / 100
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create Driver ID */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-scaleIn">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Register New Driver</h3>
                  <p className="text-[11px] text-slate-400">Assigned under Manager: {currentManager.managerId}</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDriver} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Driver ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Driver ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.driverId}
                  onChange={(e) => setFormData({ ...formData, driverId: e.target.value.toUpperCase() })}
                  placeholder="e.g. DRV_104"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400">Driver uses this exact ID to log into the Android app.</span>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Driver Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Michael Scott"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* App Password */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Driver Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="e.g. driver123"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <span className="text-[10px] text-slate-400">Password for mobile app authentication.</span>
              </div>

              {/* Commercial License */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Commercial Driver's License (Optional)
                </label>
                <input
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  placeholder="e.g. DL-88912-CA"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. +1 555-0199"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Registering...' : 'Save & Assign Driver'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
