import React from 'react';

export const EmptyState = ({ title = 'No Data Found', message = 'No records match your request.', icon = 'i' }) => {
  return (
    <div className="bg-white p-8 rounded-lg border border-slate-200 text-center shadow-sm">
      <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-lg">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto">{message}</p>
    </div>
  );
};
