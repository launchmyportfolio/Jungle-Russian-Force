import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  addWeeks,
  endOfWeek,
  format,
  isSameWeek,
  startOfWeek,
} from 'date-fns';
import TopBar from '../components/layout/TopBar.jsx';
import Card from '../components/ui/Card.jsx';
import Loader from '../components/ui/Loader.jsx';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ProfileCard from '../components/ProfileCard.jsx';
import WeekHeader from '../components/WeekHeader.jsx';
import AttendanceTable, { buildWeekDays } from '../components/AttendanceTable.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import {
  fetchEmployeeWeekAttendance,
  markWeekAttendance,
} from '../services/attendanceService.js';

const toDateKey = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return '';
  return format(date, 'yyyy-MM-dd');
};

const EmployeeDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [attendanceByDate, setAttendanceByDate] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const weekDays = useMemo(() => buildWeekDays(weekStart), [weekStart]);
  const isCurrentWeek = useMemo(
    () => isSameWeek(weekStart, new Date(), { weekStartsOn: 1 }),
    [weekStart]
  );
  const todayDateKey = useMemo(() => toDateKey(new Date()), []);
  const joinDateKey = useMemo(() => toDateKey(user?.joinDate), [user?.joinDate]);
  const disableNext = useMemo(() => {
    const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    return weekStart >= thisWeekStart;
  }, [weekStart]);
  const getDayState = useCallback((day) => {
    if (!day?.dateKey) {
      return { locked: true, label: 'Locked', editable: false };
    }

    if (joinDateKey && day.dateKey < joinDateKey) {
      return { locked: true, label: 'Not Joined Yet', editable: false, reason: 'before_join' };
    }

    if (!isCurrentWeek) {
      return { locked: true, label: 'Read Only', editable: false, reason: 'past_week' };
    }

    if (day.dateKey > todayDateKey) {
      return { locked: true, label: 'Future Date', editable: false, reason: 'future' };
    }

    return { locked: false, label: '', editable: true, reason: '' };
  }, [isCurrentWeek, joinDateKey, todayDateKey]);

  const loadAttendance = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetchEmployeeWeekAttendance(user.id, {
        startDate: format(weekStart, 'yyyy-MM-dd'),
        endDate: format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
      });

      const items = response?.data?.items || [];
      const mapped = {};

      items.forEach((entry) => {
        const key = String(entry?.date || '').slice(0, 10);
        if (key) {
          mapped[key] = {
            status: entry?.status || '',
            remarks: entry?.remarks || '',
          };
        }
      });

      setAttendanceByDate(mapped);
    } catch (apiError) {
      const message = apiError?.response?.data?.message || 'Failed to load attendance.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast, user?.id, weekStart]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const onChangeAttendance = (dateKey, value) => {
    setAttendanceByDate((prev) => ({
      ...prev,
      [dateKey]: value,
    }));
  };

  const onSave = async () => {
    if (!isCurrentWeek) return;

    setSaving(true);
    setError('');

    try {
      const entries = weekDays
        .map((day) => ({ day, state: getDayState(day) }))
        .filter(({ state }) => state.editable)
        .map(({ day }) => ({
          date: day.dateKey,
          status: attendanceByDate?.[day.dateKey]?.status || 'Absent',
          remarks: attendanceByDate?.[day.dateKey]?.remarks || '',
        }));

      if (!entries.length) {
        showToast('No editable attendance days available for this week.', 'info');
        return;
      }

      await markWeekAttendance(entries);
      showToast('Attendance saved successfully.', 'success');
      await loadAttendance();
    } catch (apiError) {
      const message = apiError?.response?.data?.message || 'Failed to save attendance.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-app">
        <Loader text="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app pb-8">
      <TopBar title="Employee Dashboard" />

      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-6">
        <ProfileCard
          profile={user}
          onChangePassword={() => navigate('/employee/change-password')}
        />

        <Card title="Weekly Timesheet" subtitle="Mark attendance for Monday to Friday">
          <WeekHeader
            weekStart={weekStart}
            onPrevious={() => setWeekStart((date) => addWeeks(date, -1))}
            onNext={() => setWeekStart((date) => addWeeks(date, 1))}
            disableNext={disableNext}
          />

          {!isCurrentWeek ? (
            <p className="mb-3 text-sm font-medium text-amber-700">
              Past week selected. Records are read-only.
            </p>
          ) : null}

          {error ? (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {loading ? (
            <Loader text="Loading attendance..." />
          ) : (
            <>
              {Object.keys(attendanceByDate || {}).length === 0 ? (
                <div className="mb-4">
                  <EmptyState
                    title="No records found"
                    description="No attendance has been marked for this week yet."
                  />
                </div>
              ) : null}

              <AttendanceTable
                weekDays={weekDays}
                attendanceByDate={attendanceByDate}
                onChange={onChangeAttendance}
                readOnly={saving}
                getDayState={getDayState}
              />

              <div className="mt-4 flex items-center gap-2">
                <Button onClick={onSave} disabled={!isCurrentWeek || saving}>
                  {saving ? <Loader text="Saving..." /> : 'Save Attendance'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={loadAttendance}
                  disabled={loading || saving}
                >
                  Reset Changes
                </Button>
              </div>
            </>
          )}
        </Card>
      </main>
    </div>
  );
};

export default EmployeeDashboard;
