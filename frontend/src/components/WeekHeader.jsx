import React from 'react';
import { endOfWeek, format } from 'date-fns';
import Button from './ui/Button.jsx';

const WeekHeader = ({ weekStart, onPrevious, onNext, disableNext = false }) => {
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current Range</p>
        <h3 className="text-lg font-semibold text-slate-900">
          {format(weekStart, 'dd MMM yyyy')} - {format(weekEnd, 'dd MMM yyyy')}
        </h3>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary" onClick={onPrevious}>Previous Week</Button>
        <Button variant="secondary" onClick={onNext} disabled={disableNext}>Next Week</Button>
      </div>
    </div>
  );
};

export default WeekHeader;
