import {
  addDays,
  endOfWeek,
  format,
  isValid,
  parseISO,
  startOfWeek,
} from 'date-fns';

export const toDateOrNull = (value) => {
  if (!value) return null;
  const parsed = typeof value === 'string' ? parseISO(value) : new Date(value);
  return isValid(parsed) ? parsed : null;
};

export const toUtcDateOnly = (value) => {
  const date = typeof value === 'string' ? parseISO(value) : new Date(value);
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
};

export const getWeekRange = (date = new Date()) => {
  const startLocal = startOfWeek(date, { weekStartsOn: 1 });
  const endLocal = endOfWeek(date, { weekStartsOn: 1 });

  const start = toUtcDateOnly(startLocal);
  const end = toUtcDateOnly(endLocal);
  end.setUTCHours(23, 59, 59, 999);

  return { start, end };
};

export const getWorkWeekDays = (weekStartDate) => {
  const start = toUtcDateOnly(weekStartDate);
  return [0, 1, 2, 3, 4].map((offset) => toUtcDateOnly(addDays(start, offset)));
};

export const toDateKey = (value) => {
  const date = typeof value === 'string' ? parseISO(value) : value;
  return format(date, 'yyyy-MM-dd');
};
