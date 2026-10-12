import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { riskEventService, tripService, driverService, webhookService } from '../services/api';
import { subscribeToLiveWebhook } from '../services/webhookStream';
import { RiskEventCard } from '../components/RiskEventCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { logger } from '../utils/logger';

export const Dashboard = () => {
  const [events, setEvents] = useState([]);
  const [activeTrips, setActiveTrips] = useState([]);
  const [allTrips, setAllTrips] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Live Webhook Stream State
  const [streamStatus, setStreamStatus] = useState('CONNECTING');
  const [liveBanner, setLiveBanner] = useState(null);
  const [triggeringTest, setTriggeringTest] = useState(false);

  const fetchOverviewData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [eventsRes, summaryRes, activeTripsRes, allTripsRes, driversRes] = await Promise.allSettled([
        riskEventService.getEvents({ limit: 6 }),
        riskEventService.getSummary(),
        tripService.getActiveTrips(),
        tripService.getTrips(),
        driverService.getDrivers(),
      ]);

      if (eventsRes.status === 'fulfilled' && eventsRes.value?.data) {
        setEvents(eventsRes.value.data);
      }
      if (summaryRes.status === 'fulfilled' && summaryRes.value?.data) {
        setSummary(summaryRes.value.data);
      }
      if (activeTripsRes.status === 'fulfilled' && activeTripsRes.value?.data) {
        setActiveTrips(activeTripsRes.value.data);
      }
      if (allTripsRes.status === 'fulfilled' && allTripsRes.value?.data) {
        setAllTrips(allTripsRes.value.data);
      }
      if (driversRes.status === 'fulfilled' && driversRes.value?.data) {
        setDrivers(driversRes.value.data);
      }
    } catch (err) {
      logger.error('Failed to load fleet overview telemetry', err);
      setError('Failed to fetch real-time overview metrics from edge backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleLiveEvent = useCallback((incoming) => {
    logger.info('Live event received on dashboard:', incoming);

    // Extract event details
    const eventData = incoming.event || incoming.data || incoming;
    const type = eventData.type || eventData.eventType || incoming.type || 'ALERT';
    const driverId = eventData.driverId || incoming.driverId || 'DRV-UNKNOWN';
    const severity = eventData.severity || incoming.severity || 'HIGH';

    // Set animated notification banner
    setLiveBanner({
      type,
      driverId,
      severity,
      timestamp: new Date().toLocaleTimeString(),
      source: incoming.source || 'Android Edge Live Telemetry',
    });

    // Auto-dismiss banner after 6 seconds
    setTimeout(() => {
      setLiveBanner((curr) => (curr?.timestamp === new Date().toLocaleTimeString() ? null : curr));
    }, 6000);

    // Prepend to recent events list if it looks like a risk event
    const normalized = {
      _id: eventData.eventId || eventData._id || `evt-${Date.now()}`,
      eventId: eventData.eventId || `evt-${Date.now()}`,
      tripId: eventData.tripId || incoming.tripId || 'LIVE-TRIP',
      driverId: driverId,
      type: type,
      eventType: type,
      severity: severity,
      timestamp: eventData.timestamp || new Date().toISOString(),
      confidence: eventData.confidence || 0.95,
      details: eventData.details || `Real-time edge alert: ${type}`,
    };

    setEvents((prev) => [normalized, ...prev.slice(0, 5)]);

    // Trigger full overview refresh silently to update Active Trips and KPI cards
    setTimeout(() => {
      fetchOverviewData();
    }, 500);
  }, []);

  // Subscribe to live webhook stream
  useEffect(() => {
    fetchOverviewData();

    const unsubscribe = subscribeToLiveWebhook({
      onEvent: handleLiveEvent,
      onStatusChange: (status) => setStreamStatus(status),
    });

    return () => {
      unsubscribe();
    };
  }, [handleLiveEvent]);

  // Trigger test webhook
  const handleTriggerTest = async () => {
    setTriggeringTest(true);
    try {
      await webhookService.triggerTest({
        driverId: 'DRV-101',
        eventType: 'DROWSINESS',
        severity: 'HIGH',
        confidence: 0.94,
        source: 'Dashboard Quick Test',
      });
    } catch (err) {
      logger.error('Failed to trigger test webhook:', err);
    } finally {
      setTriggeringTest(false);
    }
  };

  if (loading) return <LoadingSpinner message="Aggregating edge fleet metrics..." />;
  if (error) return <ErrorMessage message={error} onRetry={fetchOverviewData} />;

  const avgSafetyScore = drivers.length > 0
    ? Math.round(drivers.reduce((acc, d) => acc + (d.safetyRating || 100), 0) / drivers.length)
    : 100;

  const highRiskDrivers = drivers.filter(d => (d.safetyRating || 100) < 70);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Fleet Overview & Safety Operations</h1>
          <p className="text-slate-500 text-sm">Real-time edge numerical telemetry, active trips, and driver safety indicators</p>
        </div>

        {/* Live Webhook Status & Test Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Live Stream Status Badge */}
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              streamStatus === 'CONNECTED'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : streamStatus === 'CONNECTING'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                streamStatus === 'CONNECTED'
                  ? 'bg-emerald-500 animate-pulse'
                  : streamStatus === 'CONNECTING'
                  ? 'bg-amber-500 animate-ping'
                  : 'bg-rose-500'
              }`}
            />
            <span>
              {streamStatus === 'CONNECTED'
                ? 'Live Webhook Stream: Active'
                : streamStatus === 'CONNECTING'
                ? 'Connecting Stream...'
                : 'Stream Offline'}
            </span>
          </div>

          {/* Quick Test Webhook Trigger Button */}
          <button
            onClick={handleTriggerTest}
            disabled={triggeringTest}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md shadow-sm transition-colors disabled:opacity-50"
            title="Dispatches a live simulated risk event through the backend webhook pipeline"
          >
            <span>{triggeringTest ? '⏳ Sending...' : '⚡ Trigger Webhook Test'}</span>
          </button>

          <div className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-md font-medium">
            Updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Live Webhook Event Banner Toast */}
      {liveBanner && (
        <div className="p-4 bg-gradient-to-r from-red-600 to-amber-600 text-white rounded-lg shadow-lg flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚨</span>
            <div>
              <div className="font-bold text-sm tracking-wide flex items-center gap-2">
                <span>LIVE WEBHOOK ALERT: {liveBanner.type}</span>
                <span className="px-1.5 py-0.5 text-[10px] bg-white/20 uppercase rounded font-mono">
                  {liveBanner.severity}
                </span>
              </div>
              <div className="text-xs text-white/90">
                Driver <strong className="font-mono">{liveBanner.driverId}</strong> flagged via{' '}
                <em>{liveBanner.source}</em> at {liveBanner.timestamp}. Dashboard updated in real-time.
              </div>
            </div>
          </div>
          <button
            onClick={() => setLiveBanner(null)}
            className="text-white/80 hover:text-white text-sm font-bold px-2 py-1 rounded hover:bg-white/10"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center">
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase">Active Monitored Trips</div>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">{activeTrips.length}</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">Live edge streaming</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg">
            📡
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center">
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase">Avg Fleet Safety Score</div>
            <div className="text-3xl font-extrabold text-blue-600 mt-1">{avgSafetyScore} / 100</div>
            <div className="text-[11px] text-slate-400 font-medium mt-1">Across {drivers.length} drivers</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
            🛡️
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center">
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase">Total Ingested Trips</div>
            <div className="text-3xl font-extrabold text-slate-900 mt-1">{allTrips.length}</div>
            <div className="text-[11px] text-slate-400 font-medium mt-1">Historical sessions</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-lg">
            🚘
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center">
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase">Logged Risk Incidents</div>
            <div className="text-3xl font-extrabold text-red-600 mt-1">{summary?.totalEvents ?? events.length}</div>
            <div className="text-[11px] text-red-600 font-medium mt-1">
              Drowsy: {summary?.breakdown?.drowsiness ?? 0} | Phone: {summary?.breakdown?.distraction ?? 0}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-bold text-lg">
            ⚠️
          </div>
        </div>
      </div>

      {/* Main Grid: Active Vehicles & Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Trips & High Risk Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Monitored Vehicles */}
          <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-800">Active Monitored Vehicles</h2>
              <Link to="/trips" className="text-xs font-semibold text-blue-600 hover:underline">
                View All Trips →
              </Link>
            </div>

            {activeTrips.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded text-center text-xs text-slate-500">
                No mobile edge nodes are currently conducting active trip sessions.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {activeTrips.map((trip) => (
                  <div key={trip.tripId} className="py-3 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-slate-900 font-mono">#{trip.tripId}</span>
                      <span className="ml-2 text-slate-500">Driver: <strong>{trip.driverId}</strong></span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-emerald-600">{trip.currentScore ?? 100} / 100</span>
                      <Link to={`/trips/${trip.tripId}`} className="px-2.5 py-1 bg-blue-50 text-blue-700 font-semibold rounded hover:bg-blue-100">
                        View Live
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* High Risk Drivers Attention Area */}
          {highRiskDrivers.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-5 space-y-3">
              <div className="flex items-center space-x-2 text-red-800 font-bold text-sm">
                <span>⚠️ High Risk Driver Attention Flagged</span>
              </div>
              <p className="text-xs text-red-700">
                The following drivers have fallen below the 70 safety score threshold due to repeated edge risk triggers:
              </p>
              <div className="space-y-2">
                {highRiskDrivers.map((d) => (
                  <div key={d.driverId} className="flex justify-between items-center bg-white p-2.5 rounded border border-red-200 text-xs">
                    <span className="font-semibold text-slate-800">{d.name} ({d.driverId})</span>
                    <span className="font-bold text-red-600">{d.safetyRating} / 100</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Live Recent Alerts Feed */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-slate-800">Recent Risk Stream</h2>
            <Link to="/alerts" className="text-xs font-semibold text-blue-600 hover:underline">
              Alert Log →
            </Link>
          </div>

          {events.length === 0 ? (
            <div className="bg-white p-6 rounded-lg border border-slate-200 text-center text-slate-500 text-xs">
              No recent risk events detected.
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((evt) => (
                <RiskEventCard key={evt.eventId || evt._id} event={evt} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
