import React, { useEffect, useState } from 'react';
import { driverService } from '../services/api';

export const Drivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    driverService
      .getDrivers()
      .then((res) => {
        if (res?.data) setDrivers(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Driver Roster & Safety Scores</h1>
        <p className="text-slate-500 text-sm">Monitored fleet drivers and safety evaluation history</p>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-slate-500">Loading driver roster...</div>
        ) : drivers.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-sm">No drivers registered in backend.</div>
        ) : (
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-4">Driver ID</th>
                <th className="p-4">Name</th>
                <th className="p-4">License</th>
                <th className="p-4">Status</th>
                <th className="p-4">Safety Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {drivers.map((driver) => (
                <tr key={driver.driverId}>
                  <td className="p-4 font-mono text-xs">{driver.driverId}</td>
                  <td className="p-4 font-medium text-slate-900">{driver.name}</td>
                  <td className="p-4">{driver.licenseNumber}</td>
                  <td className="p-4">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
                      {driver.status}
                    </span>
                  </td>
                  <td className="p-4 font-bold text-blue-600">{driver.safetyRating} / 100</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
