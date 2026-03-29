import { toUtcDateOnly, getWeekRange, toDateKey, getWorkWeekDays } from '../utils/dateUtils.js';
import { ApiError } from '../utils/apiError.js';

export const validateCurrentWeekEntries = (entries) => {
  const today = new Date();
  const currentWeek = getWeekRange(today);

  const normalized = entries.map((entry) => ({
    date: toUtcDateOnly(entry.date),
    status: entry.status,
    remarks: entry.remarks || '',
  }));

  normalized.forEach((entry) => {
    if (entry.date < currentWeek.start || entry.date > currentWeek.end) {
      throw new ApiError(400, 'Attendance can only be updated for the current week');
    }
  });

  return normalized;
};

export const buildWeekKeys = (weekStartDate) => {
  return getWorkWeekDays(weekStartDate).map((date) => toDateKey(date));
};
