import React from 'react';
import { Link } from 'react-router-dom';

export const RiskEventCard = ({ event }) => {
  const getSeverityBadge = (severity) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
      case 'HIGH':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'MEDIUM':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'LOW':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getEventTitle = (type) => {
    switch (type) {
      case 'DROWSINESS':
      case 'DROWSINESS_ALERT':
        return 'Drowsiness Alert';
      case 'PHONE':
      case 'PHONE_USAGE':
      case 'PHONE_USE':
        return 'Phone Distraction';
      case 'YAWNING':
      case 'YAWNING_SPIKE':
        return 'Fatigue Yawning Spike';
      case 'DISTRACTION':
      case 'DISTRACTION_ALERT':
      default:
        return 'General Distraction';
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        <div className="flex justify-between items-start mb-2">
          <span className="font-bold text-slate-900 text-sm">{getEventTitle(event.eventType || event.type)}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${getSeverityBadge(event.severity)}`}>
            {event.severity || 'MEDIUM'}
          </span>
        </div>

        <div className="text-xs text-slate-500 mb-2 space-x-1">
          <span>Driver:</span>
          <span className="font-semibold text-slate-700">{event.driverId}</span>
          <span>•</span>
          <span>Trip:</span>
          <Link to={`/trips/${event.tripId}`} className="font-semibold text-blue-600 hover:underline">
            {event.tripId}
          </Link>
        </div>

        <div className="text-xs space-y-1 text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-100">
          {event.pointsDeducted !== undefined && (
            <div>Penalty: <span className="font-bold text-red-600">-{event.pointsDeducted} pts</span></div>
          )}
          {event.location && (
            <div>
              GPS: <span className="font-mono text-[11px] font-semibold">{event.location.latitude?.toFixed(4)}, {event.location.longitude?.toFixed(4)}</span>
              {event.location.speedKmh !== undefined && (
                <span className="ml-2 font-semibold">({event.location.speedKmh} km/h)</span>
              )}
            </div>
          )}
          {event.confidence && (
            <div>Confidence: <span className="font-semibold">{(event.confidence * 100).toFixed(0)}%</span></div>
          )}
        </div>
      </div>

      <div className="text-[10px] text-slate-400 mt-3 text-right font-medium">
        {new Date(event.timestamp || event.createdAt).toLocaleString()}
      </div>
    </div>
  );
};
