import React, { useEffect, useState } from 'react';
import { analyticsService, driverService, tripService } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { EmptyState } from '../components/EmptyState';
import { logger } from '../utils/logger';

export const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [tripsWithGps, setTripsWithGps] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [dateRange, setDateRange] = useState('ALL');
  const [selectedGpsTrip, setSelectedGpsTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Calculate Date Filters
  const getDateParams = () => {
    if (dateRange === 'ALL') return {};
    const end = new Date();
    const start = new Date();
    if (dateRange === 'TODAY') {
      start.setHours(0, 0, 0, 0);
    } else if (dateRange === '7D') {
      start.setDate(end.getDate() - 7);
    } else if (dateRange === '30D') {
      start.setDate(end.getDate() - 30);
    }
    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const dateParams = getDateParams();
      const params = { ...dateParams };
      if (selectedDriver) params.driverId = selectedDriver;

      const [res, driversRes, tripsRes] = await Promise.allSettled([
        analyticsService.getOverview(params),
        driverService.getDrivers(),
        tripService.getTrips(),
      ]);

      if (res.status === 'fulfilled' && res.value?.data) {
        setAnalyticsData(res.value.data);
      } else if (res.status === 'fulfilled' && res.value) {
        setAnalyticsData(res.value);
      } else {
        setError('Failed to aggregate telemetry metrics from backend.');
      }

      if (driversRes.status === 'fulfilled' && driversRes.value?.data) {
        setDrivers(driversRes.value.data);
      }

      if (tripsRes.status === 'fulfilled' && tripsRes.value?.data) {
        const rawTrips = Array.isArray(tripsRes.value.data) ? tripsRes.value.data : [];
        const filteredGps = rawTrips.filter(t => t.startingLocation || (t.gpsPoints && t.gpsPoints.length > 0));
        setTripsWithGps(filteredGps);
        if (filteredGps.length > 0 && !selectedGpsTrip) {
          setSelectedGpsTrip(filteredGps[0]);
        }
      }
    } catch (err) {
      logger.error('Failed to load analytics dashboard telemetry', err);
      setError('An error occurred while fetching server-side analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, selectedDriver]);

  if (loading) return <LoadingSpinner message="Calculating fleet safety analytics..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchAnalytics} />;

  const summary = analyticsData?.summary || {};
  const eventTypes = analyticsData?.eventTypeDistribution || { DROWSINESS: 0, PHONE: 0, DISTRACTION: 0, YAWNING: 0 };
  const severities = analyticsData?.severityDistribution || { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  const highRiskDrivers = analyticsData?.highRiskDrivers || [];
  const scoreTrends = analyticsData?.scoreTrends || [];

  const totalEvents = summary.totalRiskEvents || 0;

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">DriveGuard AI Analytics</h1>
          <p className="text-slate-500 text-sm">Longitudinal evaluation of driver risk indicators, safety scores, and fleet trends</p>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
          {/* Date Filter */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-md">
            {[
              { id: 'ALL', label: 'All Time' },
              { id: 'TODAY', label: 'Today' },
              { id: '7D', label: 'Last 7 Days' },
              { id: '30D', label: 'Last 30 Days' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setDateRange(btn.id)}
                className={`px-2.5 py-1 text-xs font-semibold rounded transition-colors ${
                  dateRange === btn.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Driver Selector Filter */}
          <select
            value={selectedDriver}
            onChange={(e) => setSelectedDriver(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-md p-1.5 focus:ring-blue-500 focus:border-blue-500 font-medium"
          >
            <option value="">All Drivers</option>
            {drivers.map((d) => (
              <option key={d.driverId} value={d.driverId}>
                {d.name} ({d.driverId})
              </option>
            ))}
          </select>

          <button
            onClick={fetchAnalytics}
            className="p-1.5 text-xs text-slate-500 hover:text-blue-600 font-semibold border-l border-slate-200 pl-2"
            title="Refresh Analytics Data"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Model Accuracy & Sample Size Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-lg text-xs space-y-1">
        <div className="font-bold flex items-center gap-1.5">
          <span>⚠️ Telemetry Scope & Validation Disclaimer</span>
        </div>
        <div className="text-amber-800 leading-relaxed">
          {summary.sampleSizeNote}
          <span className="ml-1">
            Metrics reflect edge telemetry ingested from active mobile devices. Accuracy metrics are not asserted without benchmark dataset validation.
          </span>
        </div>
      </div>

      {/* Primary Metric KPI Cards with explicit per-trip/per-driver/per-event scope labeling */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Avg Driver Rating</div>
          <div className="text-3xl font-extrabold text-blue-600">{summary.avgFleetScore ?? 100} / 100</div>
          <div className="text-[11px] text-slate-500 font-medium">Scope: <span className="font-bold text-slate-700">per-driver</span></div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Avg Final Trip Score</div>
          <div className="text-3xl font-extrabold text-emerald-600">{summary.avgTripScore ?? 100} / 100</div>
          <div className="text-[11px] text-slate-500 font-medium">Scope: <span className="font-bold text-slate-700">per-trip</span></div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Ingested Trips</div>
          <div className="text-3xl font-extrabold text-slate-900">{summary.totalTrips ?? 0}</div>
          <div className="text-[11px] text-slate-500 font-medium">Scope: <span className="font-bold text-slate-700">per-trip</span> ({summary.activeTrips ?? 0} active)</div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-1">
          <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Risk Incidents</div>
          <div className="text-3xl font-extrabold text-red-600">{summary.totalRiskEvents ?? 0}</div>
          <div className="text-[11px] text-slate-500 font-medium">Scope: <span className="font-bold text-slate-700">per-event</span></div>
        </div>
      </div>

      {/* High Risk Driver Identification View */}
      {highRiskDrivers.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-red-900 flex items-center gap-2">
              <span>🚨 High-Risk Driver Identification</span>
              <span className="text-xs font-normal text-red-700">({highRiskDrivers.length} Flagged)</span>
            </h2>
            <span className="text-[11px] bg-red-100 text-red-800 px-2 py-0.5 rounded font-semibold">
              Action Recommended
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {highRiskDrivers.map((d) => (
              <div key={d.driverId} className="bg-white p-3.5 rounded-md border border-red-200 flex justify-between items-center text-xs">
                <div>
                  <div className="font-bold text-slate-900">{d.name}</div>
                  <div className="text-slate-500 font-mono text-[11px]">ID: {d.driverId}</div>
                  <div className="text-slate-600 mt-1">Logged Events: <strong>{d.eventCount}</strong> | Trips: <strong>{d.tripCount}</strong></div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400 font-semibold">Safety Score</div>
                  <div className="text-xl font-extrabold text-red-600">{d.safetyRating} / 100</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid: Safety Score Trend Over Time & Risk Event Types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Safety Score Trend Line Chart Visualization */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-800">Driver Safety-Score Trend Over Time</h2>
            <span className="text-xs text-slate-400 font-medium">Daily Averages (per-trip)</span>
          </div>

          {scoreTrends.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs italic">
              No trendline data points recorded for selected date filter.
            </div>
          ) : (
            <div className="space-y-3">
              {scoreTrends.map((point) => (
                <div key={point.date} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700 font-mono">{point.date}</span>
                    <span className={`font-bold ${point.avgScore >= 80 ? 'text-emerald-600' : point.avgScore >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                      {point.avgScore} / 100 ({point.eventCount} events)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
                    <div
                      className={`h-full transition-all duration-500 ${
                        point.avgScore >= 80 ? 'bg-emerald-500' : point.avgScore >= 60 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${point.avgScore}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Risk Event Counts by Type & Severity Distribution */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-5">
          <h2 className="text-base font-bold text-slate-800">Risk Event Counts by Type & Severity</h2>

          {totalEvents === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs italic">
              Zero safety risk events recorded for selected filter criteria.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Event Type Bars */}
              <div className="space-y-2">
                {[
                  { key: 'DROWSINESS', label: 'Drowsiness (EAR Prolonged Closure)', count: eventTypes.DROWSINESS, color: 'bg-red-500' },
                  { key: 'PHONE', label: 'Phone Distraction (YOLO Edge)', count: eventTypes.PHONE, color: 'bg-amber-500' },
                  { key: 'DISTRACTION', label: 'General Distraction / Head Pose', count: eventTypes.DISTRACTION, color: 'bg-blue-500' },
                  { key: 'YAWNING', label: 'Fatigue Yawning Spike (MAR)', count: eventTypes.YAWNING, color: 'bg-indigo-500' },
                ].map((item) => {
                  const pct = totalEvents > 0 ? Math.round((item.count / totalEvents) * 100) : 0;
                  return (
                    <div key={item.key} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-slate-700">{item.label}</span>
                        <span className="font-bold text-slate-900">{item.count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div className={`h-full ${item.color}`} style={{ width: `${pct}%` }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Severity Breakdown Badges */}
              <div className="pt-3 border-t border-slate-100">
                <div className="text-xs font-semibold text-slate-500 mb-2">Severity Distribution (per-event)</div>
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 rounded bg-red-50 border border-red-200">
                    <div className="font-bold text-red-800">{severities.CRITICAL}</div>
                    <div className="text-[10px] text-red-600 uppercase font-semibold">Critical</div>
                  </div>
                  <div className="p-2 rounded bg-amber-50 border border-amber-200">
                    <div className="font-bold text-amber-800">{severities.HIGH}</div>
                    <div className="text-[10px] text-amber-600 uppercase font-semibold">High</div>
                  </div>
                  <div className="p-2 rounded bg-blue-50 border border-blue-200">
                    <div className="font-bold text-blue-800">{severities.MEDIUM}</div>
                    <div className="text-[10px] text-blue-600 uppercase font-semibold">Medium</div>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <div className="font-bold text-slate-700">{severities.LOW}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Low</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* GPS Trip Route Visualization Section */}
      <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-800">GPS Telemetry Trip Route Trail</h2>
            <p className="text-slate-500 text-xs">Location point mapping for trips with GPS fix coordinates</p>
          </div>

          {tripsWithGps.length > 0 && (
            <select
              value={selectedGpsTrip?.tripId || ''}
              onChange={(e) => {
                const found = tripsWithGps.find(t => t.tripId === e.target.value);
                if (found) setSelectedGpsTrip(found);
              }}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-md p-1.5 font-mono font-semibold"
            >
              {tripsWithGps.map(t => (
                <option key={t.tripId} value={t.tripId}>
                  Trip #{t.tripId} ({t.driverId})
                </option>
              ))}
            </select>
          )}
        </div>

        {tripsWithGps.length === 0 ? (
          <EmptyState
            title="No GPS Telemetry Points Recorded"
            message="Location coordinates will display here when edge devices log GPS fixes during trip sessions."
            icon="📍"
          />
        ) : selectedGpsTrip ? (
          <div className="bg-slate-900 text-white rounded-lg p-5 space-y-4 border border-slate-800">
            <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-3">
              <div>
                <span className="text-slate-400">Selected Route: </span>
                <span className="font-bold font-mono text-blue-400">{selectedGpsTrip.tripId}</span>
                <span className="ml-3 text-slate-400">Driver: <strong>{selectedGpsTrip.driverId}</strong></span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-900 text-emerald-300 font-bold uppercase text-[10px]">
                {selectedGpsTrip.status}
              </span>
            </div>

            {/* GPS Coordinates Route Map Viewer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-800 p-4 rounded-md border border-slate-700 space-y-2">
                <div className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
                  <span>🚀 Starting Location Fix</span>
                </div>
                {selectedGpsTrip.startingLocation ? (
                  <div className="space-y-1 font-mono text-slate-300">
                    <div>Lat: <strong>{selectedGpsTrip.startingLocation.latitude}</strong></div>
                    <div>Lng: <strong>{selectedGpsTrip.startingLocation.longitude}</strong></div>
                    {selectedGpsTrip.startingLocation.address && (
                      <div className="text-slate-400 font-sans text-[11px] mt-1">{selectedGpsTrip.startingLocation.address}</div>
                    )}
                  </div>
                ) : (
                  <div className="text-slate-500 italic">No start fix available</div>
                )}
              </div>

              <div className="bg-slate-800 p-4 rounded-md border border-slate-700 space-y-2">
                <div className="font-bold text-slate-200 text-sm flex items-center gap-1.5">
                  <span>🏁 Destination / Ending Fix</span>
                </div>
                {selectedGpsTrip.endingLocation ? (
                  <div className="space-y-1 font-mono text-slate-300">
                    <div>Lat: <strong>{selectedGpsTrip.endingLocation.latitude}</strong></div>
                    <div>Lng: <strong>{selectedGpsTrip.endingLocation.longitude}</strong></div>
                    {selectedGpsTrip.endingLocation.address && (
                      <div className="text-slate-400 font-sans text-[11px] mt-1">{selectedGpsTrip.endingLocation.address}</div>
                    )}
                  </div>
                ) : (
                  <div className="text-slate-500 italic">Trip in progress or ending fix pending</div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
