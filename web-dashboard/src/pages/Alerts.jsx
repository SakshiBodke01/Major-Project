import React, { useEffect, useState } from 'react';
import { riskEventService } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { EmptyState } from '../components/EmptyState';
import { RiskEventCard } from '../components/RiskEventCard';
import { logger } from '../utils/logger';

export const Alerts = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSeverity, setSelectedSeverity] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');

  const fetchAlerts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await riskEventService.getEvents({ limit: 50 });
      if (res?.data) {
        setEvents(res.data);
      } else if (Array.isArray(res)) {
        setEvents(res);
      }
    } catch (err) {
      logger.error('Failed to fetch risk alert log', err);
      setError('Unable to load alert logs from telemetry backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const filteredEvents = events.filter((evt) => {
    const typeMatch =
      selectedType === 'ALL' ||
      (evt.eventType || evt.type)?.toUpperCase() === selectedType.toUpperCase();
    const severityMatch =
      selectedSeverity === 'ALL' ||
      evt.severity?.toUpperCase() === selectedSeverity.toUpperCase();
    return typeMatch && severityMatch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Fleet Risk Alerts</h1>
        <p className="text-slate-500 text-sm">Historical feed of edge-detected safety events (Drowsiness, Distraction, Yawning)</p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Severity</label>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Event Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Types</option>
              <option value="DROWSINESS">Drowsiness</option>
              <option value="PHONE">Phone Distraction</option>
              <option value="DISTRACTION">General Distraction</option>
              <option value="YAWNING">Yawning Spike</option>
            </select>
          </div>
        </div>

        <button
          onClick={fetchAlerts}
          className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          🔄 Refresh Feed
        </button>
      </div>

      {/* Alert Feed Grid */}
      {loading ? (
        <LoadingSpinner message="Querying telemetry alert log..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={fetchAlerts} />
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          title="No Alerts Match Filter"
          message="No telemetry risk events match the selected severity and event type criteria."
          icon="🔔"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEvents.map((evt) => (
            <RiskEventCard key={evt.eventId || evt._id} event={evt} />
          ))}
        </div>
      )}
    </div>
  );
};
