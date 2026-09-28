import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { tripService, riskEventService, scoreSnapshotService } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { RiskEventCard } from '../components/RiskEventCard';
import { logger } from '../utils/logger';

export const TripDetail = () => {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [events, setEvents] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTripDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const [tripRes, eventsRes, snapshotRes] = await Promise.allSettled([
        tripService.getTripById(id),
        riskEventService.getEventsByTrip(id),
        scoreSnapshotService.getScoreHistoryByTrip(id),
      ]);

      if (tripRes.status === 'fulfilled' && tripRes.value?.data) {
        setTrip(tripRes.value.data);
      } else if (tripRes.status === 'fulfilled' && tripRes.value) {
        setTrip(tripRes.value);
      } else {
        setError('Trip not found or backend service unavailable.');
      }

      if (eventsRes.status === 'fulfilled' && eventsRes.value?.data) {
        setEvents(eventsRes.value.data);
      } else if (eventsRes.status === 'fulfilled' && Array.isArray(eventsRes.value)) {
        setEvents(eventsRes.value);
      }

      if (snapshotRes.status === 'fulfilled' && snapshotRes.value?.data) {
        setSnapshots(snapshotRes.value.data);
      } else if (snapshotRes.status === 'fulfilled' && Array.isArray(snapshotRes.value)) {
        setSnapshots(snapshotRes.value);
      }
    } catch (err) {
      logger.error(`Failed to load trip details for tripId: ${id}`, err);
      setError('An error occurred while fetching trip telemetry details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripDetails();
  }, [id]);

  if (loading) return <LoadingSpinner message={`Loading telemetry for Trip #${id}...`} />;
  if (error || !trip) return <ErrorMessage message={error || 'Trip record not found.'} onRetry={fetchTripDetails} />;

  // Calculate duration
  const start = trip.startTime ? new Date(trip.startTime) : null;
  const end = trip.endTime ? new Date(trip.endTime) : new Date();
  const durationMinutes = start ? Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60))) : 'N/A';

  const gpsWaypoints = trip.gpsPoints || (events.map(e => e.location).filter(Boolean)) || [];

  return (
    <div className="space-y-6">
      {/* Header & Navigation */}
      <div className="flex items-center space-x-3">
        <Link to="/trips" className="text-slate-500 hover:text-slate-800 text-sm font-semibold">
          ← Back to Trips
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-800 font-bold font-mono text-sm">Trip #{trip.tripId}</span>
      </div>

      {/* Main KPI Card Header */}
      <div className="bg-slate-900 text-white rounded-lg p-6 shadow-md border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-xl font-bold font-mono">{trip.tripId}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
              trip.status === 'COMPLETED' ? 'bg-slate-700 text-slate-200' : 'bg-emerald-600 text-white animate-pulse'
            }`}>
              {trip.status}
            </span>
          </div>
          <div className="text-xs text-slate-400 space-x-4 flex flex-wrap">
            <span>Driver ID: <strong className="text-slate-200">{trip.driverId}</strong></span>
            <span>Vehicle: <strong className="text-slate-200">{trip.vehicleId || 'DEV-EDGE-01'}</strong></span>
            <span>Duration: <strong className="text-slate-200">{durationMinutes} min</strong></span>
          </div>
        </div>

        <div className="bg-slate-800 px-6 py-4 rounded-lg border border-slate-700 text-center min-w-[160px]">
          <div className="text-xs text-slate-400 font-medium uppercase">Safety Score</div>
          <div className={`text-3xl font-extrabold mt-1 ${
            (trip.finalScore ?? trip.currentScore ?? 100) >= 80 ? 'text-emerald-400' :
            (trip.finalScore ?? trip.currentScore ?? 100) >= 60 ? 'text-amber-400' : 'text-red-400'
          }`}>
            {trip.finalScore ?? trip.currentScore ?? 100} / 100
          </div>
        </div>
      </div>

      {/* Privacy Notice Banner */}
      <div className="bg-blue-50 border border-blue-200 text-blue-900 px-4 py-3 rounded-lg text-xs flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-blue-700">🔒 Privacy Shield Engaged:</span>
          <span>Zero camera images or video buffers are stored or transmitted. Visual analysis was computed strictly on mobile edge hardware.</span>
        </div>
      </div>

      {/* Grid Section: Telemetry Event Timeline & GPS Route */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Events Timeline */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center justify-between">
            <span>Risk Event Timeline</span>
            <span className="text-xs font-normal text-slate-500">{events.length} Incident(s) Logged</span>
          </h2>

          {events.length === 0 ? (
            <div className="bg-white p-8 rounded-lg border border-slate-200 text-center text-slate-500 text-sm shadow-sm">
              ✨ Excellent driving! Zero safety risk events detected during this trip session.
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((evt) => (
                <RiskEventCard key={evt.eventId || evt._id} event={evt} />
              ))}
            </div>
          )}
        </div>

        {/* GPS Fixes & Telemetry Summary */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-800">GPS Telemetry Trail</h2>

          <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-3">
            <div className="text-xs text-slate-500 font-medium">Logged Fix Points ({gpsWaypoints.length})</div>
            {gpsWaypoints.length === 0 ? (
              <div className="text-xs text-slate-400 italic">No GPS coordinates recorded for this trip.</div>
            ) : (
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 text-xs font-mono">
                {gpsWaypoints.map((pt, idx) => (
                  <div key={idx} className="py-2 flex justify-between items-center text-slate-700">
                    <div>
                      <div className="font-semibold text-slate-800">Fix #{idx + 1}</div>
                      <div className="text-[11px] text-slate-500">{pt.latitude?.toFixed(5)}, {pt.longitude?.toFixed(5)}</div>
                    </div>
                    {pt.speedKmh !== undefined && (
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600 font-sans text-[10px] font-bold">
                        {pt.speedKmh} km/h
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Score Snapshot Trend */}
          {snapshots.length > 0 && (
            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm space-y-2">
              <div className="text-xs text-slate-500 font-medium">Score Deduction History</div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {snapshots.map((snap, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs p-1.5 bg-slate-50 rounded">
                    <span className="text-slate-600">{snap.triggerReason || snap.eventType || 'Event'}</span>
                    <span className="font-bold text-red-600">-{snap.deduction} pts → {snap.scoreAfter}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
