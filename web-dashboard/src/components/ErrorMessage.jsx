import React from 'react';

export const ErrorMessage = ({ message = 'Failed to load data from backend server.', onRetry }) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center text-red-800 shadow-sm">
      <div className="font-semibold text-base mb-1">API Communication Error</div>
      <div className="text-xs text-red-600 mb-4">{message}</div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 text-white rounded-md text-xs font-semibold hover:bg-red-700 transition-colors"
        >
          Retry Connection
        </button>
      )}
    </div>
  );
};
