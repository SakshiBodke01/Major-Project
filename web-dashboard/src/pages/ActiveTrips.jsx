import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { tripService } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { EmptyState } from '../components/EmptyState';
import { ErrorMessage } from '../components/ErrorMessage';
import { logger } from '../utils/logger';

export const ActiveTrips = () => {
  const [trips, setTrips] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTrips = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await tripService.getTrips();
      if (res?.data) {
        setTrips(res.data);
      } else if (Array.isArray(res)) {
        setTrips(res);
      }
    } catch (err) {
      logger.error('Failed to fetch trips list', err);
      setError('Unable to load trip records from backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  const filteredTrips = trips.filter((t) => {
    if (filterStatus === 'ACTIVE') return t.status === 'ACTIVE' || t.status === 'MONITORING';
    if (filterStatus === 'COMPLETED') return t.status === 'COMPLETED';
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
      case 'MONITORING':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'PAUSED':
      case 'NETWORK_DEGRADED':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'COMPLETED':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fleet Trips</h1>
          <p className="text-slate-500 text-sm">Active vehicle monitoring sessions and completed trip archives</p>
        </div>

        {/* Filter controls */}
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm self-start sm:self-auto">
          {['ALL', 'ACTIVE', 'COMPLETED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                filterStatus === status
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Fetching fleet trip logs..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchTrips} />
      ) : filteredTrips.length === 0 ? (
        <EmptyState
          title="No Trips Found"
          message={
            filterStatus === 'ACTIVE'
              ? 'No drivers are currently conducting active monitored trips.'
              : 'No trip telemetry sessions have been recorded yet.'
          }
          icon="🚗"
        />
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-4">Trip ID</th>
                <th className="p-4">Driver</th>
                <th className="p-4">Status</th>
                <th className="p-4">Started At</th>
                <th className="p-4">Current Score</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTrips.map((trip) => (
                <tr key={trip.tripId || trip._id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-mono text-xs font-semibold text-slate-900">
                    {trip.tripId}
                  </td>
                  <td className="p-4 font-medium text-slate-800">
                    {trip.driverId || 'Unknown Driver'}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusBadge(trip.status)}`}>
                      {trip.status}
                    </span>
                  </td>
                  <td className="p-4 text-xs text-slate-500">
                    {trip.startTime ? new Date(trip.startTime).toLocaleString() : 'N/A'}
                  </td>
                  <td className="p-4">
                    <span className={`font-bold text-sm ${
                      (trip.currentScore ?? trip.finalScore ?? 100) >= 80
                        ? 'text-emerald-600'
                        : (trip.currentScore ?? trip.finalScore ?? 100) >= 60
                        ? 'text-amber-600'
                        : 'text-red-600'
                    }`}>
                      {trip.currentScore ?? trip.finalScore ?? 100} / 100
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      to={`/trips/${trip.tripId}`}
                      className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      View Telemetry →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
