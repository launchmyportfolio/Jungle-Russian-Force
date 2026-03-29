import React from 'react';

const EmptyState = ({ title = 'No data available', description = 'Try adjusting your filters.' }) => {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
      <p className="text-sm font-semibold text-slate-700">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
};

export default EmptyState;
