import React from 'react';
import { format } from 'date-fns';
import Button from './ui/Button.jsx';
import Table from './ui/Table.jsx';
import EmptyState from './ui/EmptyState.jsx';

const statuses = ['Present', 'Absent', 'Leave', 'Holiday'];

const AttendanceTable = ({
  weekDays = [],
  attendanceByDate = {},
  onChange,
  readOnly = false,
  getDayState,
}) => {
  if (!weekDays.length) {
    return <EmptyState title="No records found" description="No days available in selected week." />;
  }

  return (
    <Table>
      <thead className="bg-slate-50">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Day</th>
          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Status</th>
          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Remarks</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 bg-white">
        {weekDays.map((day) => {
          const entry = attendanceByDate?.[day.dateKey] || { status: '', remarks: '' };
          const dayState = getDayState?.(day) || {};
          const isHardLocked = Boolean(dayState?.locked);
          const controlsDisabled = Boolean(readOnly || isHardLocked);
          const lockLabel = dayState?.label || 'Locked';
          const lockedCellClass = isHardLocked ? 'bg-slate-50 text-slate-500' : '';

          return (
            <tr key={day.dateKey}>
              <td className="px-4 py-3 text-sm font-medium text-slate-800">
                <div>{format(day.date, 'EEE')}</div>
                <div className="text-xs text-slate-500">{format(day.date, 'dd MMM')}</div>
              </td>
              <td className={`px-4 py-3 ${lockedCellClass}`}>
                {isHardLocked ? (
                  <span className="inline-flex rounded-md border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {lockLabel}
                  </span>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {statuses.map((status) => (
                      <Button
                        key={status}
                        variant={entry.status === status ? 'primary' : 'secondary'}
                        className="!px-3 !py-1.5 !text-xs"
                        disabled={controlsDisabled}
                        onClick={() => onChange?.(day.dateKey, { ...entry, status })}
                      >
                        {status}
                      </Button>
                    ))}
                  </div>
                )}
              </td>
              <td className={`px-4 py-3 ${lockedCellClass}`}>
                {isHardLocked ? (
                  <span className="text-xs text-slate-500">--</span>
                ) : (
                  <input
                    type="text"
                    disabled={controlsDisabled}
                    className="w-full rounded-md border border-slate-300 px-2.5 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-50"
                    placeholder="Optional remarks"
                    value={entry.remarks || ''}
                    onChange={(event) => onChange?.(day.dateKey, { ...entry, remarks: event.target.value })}
                  />
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
};

export const buildWeekDays = (weekStart) => {
  return [0, 1, 2, 3, 4].map((offset) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + offset);

    return {
      date,
      dateKey: format(date, 'yyyy-MM-dd'),
    };
  });
};

export default AttendanceTable;
