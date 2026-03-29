import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addDays,
  addWeeks,
  endOfWeek,
  format,
  startOfWeek,
} from 'date-fns';
import TopBar from '../components/layout/TopBar.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Input from '../components/ui/Input.jsx';
import Loader from '../components/ui/Loader.jsx';
import Table from '../components/ui/Table.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import WeekHeader from '../components/WeekHeader.jsx';
import { useToast } from '../context/ToastContext.jsx';
import {
  createEmployee,
  editEmployee,
  employeeQueryKeys,
  fetchEmployees,
  removeEmployee,
} from '../services/employeeService.js';
import {
  attendanceQueryKeys,
  fetchAdminWeekAttendance,
  fetchMonthlyReport,
} from '../services/attendanceService.js';

const AUTO_REFRESH_INTERVAL_MS = 10_000;

const defaultEmployeeForm = {
  employeeId: '',
  fullName: '',
  email: '',
  joinDate: '',
  department: '',
  designation: '',
  status: 'Active',
  employmentType: 'Full-time',
};

const buildWeekDates = (weekStartDate) => {
  return [0, 1, 2, 3, 4].map((offset) => {
    const date = addDays(weekStartDate, offset);
    return {
      date,
      key: format(date, 'yyyy-MM-dd'),
      label: format(date, 'EEE dd'),
    };
  });
};

const getLastUpdatedLabel = (timestamp) => {
  if (!timestamp) {
    return 'Last updated --';
  }
  return `Last updated ${format(new Date(timestamp), 'hh:mm:ss a')}`;
};

const AdminDashboard = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [employeeFilters, setEmployeeFilters] = useState({
    search: '',
    department: '',
    designation: '',
    status: '',
    page: 1,
    limit: 8,
  });
  const [attendanceFilters, setAttendanceFilters] = useState({
    search: '',
    department: '',
    designation: '',
    status: '',
    page: 1,
    limit: 8,
  });

  const [employeeForm, setEmployeeForm] = useState(defaultEmployeeForm);
  const [editingEmployeeId, setEditingEmployeeId] = useState('');

  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());

  const weekDates = useMemo(() => buildWeekDates(weekStart), [weekStart]);

  const attendanceParams = useMemo(
    () => ({
      ...attendanceFilters,
      startDate: format(weekStart, 'yyyy-MM-dd'),
      endDate: format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    }),
    [attendanceFilters, weekStart]
  );

  const reportParams = useMemo(
    () => ({
      month: reportMonth,
      year: reportYear,
    }),
    [reportMonth, reportYear]
  );

  const employeesQuery = useQuery({
    queryKey: employeeQueryKeys.list(employeeFilters),
    queryFn: () => fetchEmployees(employeeFilters),
    refetchInterval: AUTO_REFRESH_INTERVAL_MS,
    staleTime: 5_000,
  });

  const attendanceQuery = useQuery({
    queryKey: attendanceQueryKeys.adminWeek(attendanceParams),
    queryFn: () => fetchAdminWeekAttendance(attendanceParams),
    refetchInterval: AUTO_REFRESH_INTERVAL_MS,
    staleTime: 5_000,
  });

  const reportQuery = useQuery({
    queryKey: attendanceQueryKeys.monthlyReport(reportParams),
    queryFn: () => fetchMonthlyReport(reportParams),
    staleTime: 10_000,
  });

  const employees = employeesQuery.data?.data?.items || [];
  const employeePagination = employeesQuery.data?.data?.pagination || { page: 1, totalPages: 1 };
  const employeesError = employeesQuery.error?.response?.data?.message || '';

  const attendanceRows = attendanceQuery.data?.data?.items || [];
  const attendancePagination = attendanceQuery.data?.data?.pagination || { page: 1, totalPages: 1 };
  const attendanceError = attendanceQuery.error?.response?.data?.message || '';

  const reportItems = reportQuery.data?.data?.items || [];
  const reportError = reportQuery.error?.response?.data?.message || '';

  const resetForm = () => {
    setEditingEmployeeId('');
    setEmployeeForm(defaultEmployeeForm);
  };

  const saveEmployeeMutation = useMutation({
    mutationFn: ({ id, payload }) => {
      if (id) {
        return editEmployee(id, payload);
      }
      return createEmployee(payload);
    },
    onSuccess: (_data, variables) => {
      showToast(variables.id ? 'Employee updated successfully.' : 'Employee created successfully.', 'success');
      resetForm();
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: attendanceQueryKeys.adminWeekAll });
      queryClient.invalidateQueries({ queryKey: attendanceQueryKeys.monthlyReportAll });
    },
    onError: (apiError) => {
      const message = apiError?.response?.data?.message || 'Failed to save employee.';
      showToast(message, 'error');
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: (id) => removeEmployee(id),
    onSuccess: () => {
      showToast('Employee deleted successfully.', 'success');
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: attendanceQueryKeys.adminWeekAll });
      queryClient.invalidateQueries({ queryKey: attendanceQueryKeys.monthlyReportAll });
    },
    onError: (apiError) => {
      const message = apiError?.response?.data?.message || 'Failed to delete employee.';
      showToast(message, 'error');
    },
  });

  const onSubmitEmployee = async (event) => {
    event.preventDefault();

    const payload = {
      ...employeeForm,
      employeeId: employeeForm.employeeId.trim(),
      fullName: employeeForm.fullName.trim(),
      email: employeeForm.email.trim().toLowerCase(),
      joinDate: employeeForm.joinDate,
      department: employeeForm.department.trim(),
      designation: employeeForm.designation.trim(),
    };

    if (!payload.employeeId || !payload.fullName || !payload.email || !payload.joinDate) {
      showToast('Employee ID, Full Name, Email, and Join Date are required.', 'error');
      return;
    }

    await saveEmployeeMutation.mutateAsync({
      id: editingEmployeeId,
      payload,
    });
  };

  const onEditEmployee = (employee) => {
    setEditingEmployeeId(employee?._id || '');
    setEmployeeForm({
      employeeId: employee?.employeeId || '',
      fullName: employee?.fullName || '',
      email: employee?.email || '',
      joinDate: employee?.joinDate ? String(employee.joinDate).slice(0, 10) : '',
      department: employee?.department || '',
      designation: employee?.designation || '',
      status: employee?.status || 'Active',
      employmentType: employee?.employmentType || 'Full-time',
    });
  };

  const onDeleteEmployee = async (id) => {
    if (!id) return;

    const confirmed = window.confirm('Delete this employee?');
    if (!confirmed) return;

    await deleteEmployeeMutation.mutateAsync(id);
  };

  return (
    <div className="min-h-screen bg-app pb-8">
      <TopBar title="Admin Dashboard" subtitle="Manage employees and attendance insights" />

      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 md:px-6">
        <Card
          title={editingEmployeeId ? 'Edit Employee' : 'Add Employee'}
          subtitle="Create employee records and update profile details"
          actions={
            editingEmployeeId ? (
              <Button variant="secondary" onClick={resetForm}>Cancel Edit</Button>
            ) : null
          }
        >
          <form className="grid gap-3 md:grid-cols-3" onSubmit={onSubmitEmployee}>
            <Input
              label="Employee ID"
              value={employeeForm.employeeId}
              onChange={(event) => setEmployeeForm((prev) => ({ ...prev, employeeId: event.target.value }))}
              placeholder="EMP001"
            />
            <Input
              label="Full Name"
              value={employeeForm.fullName}
              onChange={(event) => setEmployeeForm((prev) => ({ ...prev, fullName: event.target.value }))}
              placeholder="Employee name"
            />
            <Input
              type="email"
              label="Email"
              value={employeeForm.email}
              onChange={(event) => setEmployeeForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="employee@company.com"
            />
            <Input
              type="date"
              label="Join Date"
              value={employeeForm.joinDate}
              onChange={(event) => setEmployeeForm((prev) => ({ ...prev, joinDate: event.target.value }))}
            />
            <Input
              label="Department"
              value={employeeForm.department}
              onChange={(event) => setEmployeeForm((prev) => ({ ...prev, department: event.target.value }))}
              placeholder="Department"
            />
            <Input
              label="Designation"
              value={employeeForm.designation}
              onChange={(event) => setEmployeeForm((prev) => ({ ...prev, designation: event.target.value }))}
              placeholder="Designation"
            />

            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
              <span>Status</span>
              <select
                className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                value={employeeForm.status}
                onChange={(event) => setEmployeeForm((prev) => ({ ...prev, status: event.target.value }))}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
              <span>Employment Type</span>
              <select
                className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                value={employeeForm.employmentType}
                onChange={(event) => setEmployeeForm((prev) => ({ ...prev, employmentType: event.target.value }))}
              >
                <option value="Full-time">Full-time</option>
                <option value="Contract">Contract</option>
              </select>
            </label>

            <div className="flex items-end">
              <Button type="submit" disabled={saveEmployeeMutation.isPending}>
                {saveEmployeeMutation.isPending
                  ? <Loader text="Saving..." />
                  : editingEmployeeId
                    ? 'Update Employee'
                    : 'Add Employee'}
              </Button>
            </div>
          </form>
        </Card>

        <Card title="Employee Management" subtitle="Search, filter, and paginate employee records">
          <div className="mb-4 grid gap-3 md:grid-cols-4">
            <Input
              label="Search"
              value={employeeFilters.search}
              onChange={(event) => setEmployeeFilters((prev) => ({ ...prev, search: event.target.value, page: 1 }))}
              placeholder="Name or employee ID"
            />
            <Input
              label="Department"
              value={employeeFilters.department}
              onChange={(event) => setEmployeeFilters((prev) => ({ ...prev, department: event.target.value, page: 1 }))}
              placeholder="Filter by department"
            />
            <Input
              label="Designation"
              value={employeeFilters.designation}
              onChange={(event) => setEmployeeFilters((prev) => ({ ...prev, designation: event.target.value, page: 1 }))}
              placeholder="Filter by designation"
            />
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
              <span>Status</span>
              <select
                className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                value={employeeFilters.status}
                onChange={(event) => setEmployeeFilters((prev) => ({ ...prev, status: event.target.value, page: 1 }))}
              >
                <option value="">All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </label>
          </div>

          <p className="mb-3 text-xs text-slate-500">
            {employeesQuery.isFetching && !employeesQuery.isLoading ? 'Refreshing... | ' : ''}
            {getLastUpdatedLabel(employeesQuery.dataUpdatedAt)}
          </p>

          {employeesQuery.isLoading ? <Loader text="Loading employees..." /> : null}
          {employeesError ? <p className="text-sm text-rose-600">{employeesError}</p> : null}

          {!employeesQuery.isLoading && !employees.length ? (
            <EmptyState title="No employees found" description="Try changing filters or add a new employee." />
          ) : null}

          {!employeesQuery.isLoading && employees.length ? (
            <>
              <Table>
                <thead className="bg-slate-50">
                  <tr>
                    {['Employee ID', 'Name', 'Department', 'Designation', 'Status', 'Actions'].map((label) => (
                      <th key={label} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {employees.map((employee) => (
                    <tr key={employee?._id || employee?.employeeId}>
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">{employee?.employeeId || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{employee?.fullName || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{employee?.department || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{employee?.designation || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{employee?.status || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button variant="secondary" className="!px-3 !py-1.5 !text-xs" onClick={() => onEditEmployee(employee)}>
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            className="!px-3 !py-1.5 !text-xs"
                            onClick={() => onDeleteEmployee(employee?._id)}
                            disabled={deleteEmployeeMutation.isPending}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <div className="mt-4 flex items-center justify-end gap-2">
                <Button
                  variant="secondary"
                  disabled={(employeePagination.page || 1) <= 1}
                  onClick={() => setEmployeeFilters((prev) => ({ ...prev, page: Math.max(1, (prev.page || 1) - 1) }))}
                >
                  Previous
                </Button>
                <span className="text-sm text-slate-600">
                  Page {employeePagination.page || 1} of {employeePagination.totalPages || 1}
                </span>
                <Button
                  variant="secondary"
                  disabled={(employeePagination.page || 1) >= (employeePagination.totalPages || 1)}
                  onClick={() => setEmployeeFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))}
                >
                  Next
                </Button>
              </div>
            </>
          ) : null}
        </Card>

        <Card title="Weekly Attendance Monitoring" subtitle="View attendance by week with department and role filters">
          <WeekHeader
            weekStart={weekStart}
            onPrevious={() => setWeekStart((date) => addWeeks(date, -1))}
            onNext={() => setWeekStart((date) => addWeeks(date, 1))}
          />

          <div className="mb-4 grid gap-3 md:grid-cols-4">
            <Input
              label="Search"
              value={attendanceFilters.search}
              onChange={(event) => setAttendanceFilters((prev) => ({ ...prev, search: event.target.value, page: 1 }))}
              placeholder="Name or employee ID"
            />
            <Input
              label="Department"
              value={attendanceFilters.department}
              onChange={(event) => setAttendanceFilters((prev) => ({ ...prev, department: event.target.value, page: 1 }))}
              placeholder="Department"
            />
            <Input
              label="Designation"
              value={attendanceFilters.designation}
              onChange={(event) => setAttendanceFilters((prev) => ({ ...prev, designation: event.target.value, page: 1 }))}
              placeholder="Designation"
            />
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
              <span>Status</span>
              <select
                className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                value={attendanceFilters.status}
                onChange={(event) => setAttendanceFilters((prev) => ({ ...prev, status: event.target.value, page: 1 }))}
              >
                <option value="">All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </label>
          </div>

          <p className="mb-3 text-xs text-slate-500">
            {attendanceQuery.isFetching && !attendanceQuery.isLoading ? 'Refreshing... | ' : ''}
            {getLastUpdatedLabel(attendanceQuery.dataUpdatedAt)}
          </p>

          {attendanceQuery.isLoading ? <Loader text="Loading attendance data..." /> : null}
          {attendanceError ? <p className="text-sm text-rose-600">{attendanceError}</p> : null}

          {!attendanceQuery.isLoading && !attendanceRows.length ? (
            <EmptyState title="No attendance records found" description="Try another week or change filters." />
          ) : null}

          {!attendanceQuery.isLoading && attendanceRows.length ? (
            <>
              <Table>
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Employee</th>
                    {weekDates.map((day) => (
                      <th key={day.key} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                        {day.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {attendanceRows.map((row) => {
                    const records = row?.records || [];
                    const recordByDate = {};

                    records.forEach((record) => {
                      const key = String(record?.date || '').slice(0, 10);
                      if (key) recordByDate[key] = record?.status || '-';
                    });

                    return (
                      <tr key={row?.employee?._id || row?.employee?.employeeId}>
                        <td className="px-4 py-3 text-sm text-slate-800">
                          <div className="font-medium">{row?.employee?.fullName || '-'}</div>
                          <div className="text-xs text-slate-500">{row?.employee?.employeeId || '-'}</div>
                        </td>
                        {weekDates.map((day) => (
                          <td key={day.key} className="px-4 py-3 text-sm text-slate-700">
                            {recordByDate[day.key] || '-'}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </Table>

              <div className="mt-4 flex items-center justify-end gap-2">
                <Button
                  variant="secondary"
                  disabled={(attendancePagination.page || 1) <= 1}
                  onClick={() => setAttendanceFilters((prev) => ({ ...prev, page: Math.max(1, (prev.page || 1) - 1) }))}
                >
                  Previous
                </Button>
                <span className="text-sm text-slate-600">
                  Page {attendancePagination.page || 1} of {attendancePagination.totalPages || 1}
                </span>
                <Button
                  variant="secondary"
                  disabled={(attendancePagination.page || 1) >= (attendancePagination.totalPages || 1)}
                  onClick={() => setAttendanceFilters((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))}
                >
                  Next
                </Button>
              </div>
            </>
          ) : null}
        </Card>

        <Card title="Monthly Summary Report" subtitle="Present, absent, leave, and holiday totals">
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
              <span>Month</span>
              <input
                type="number"
                min="1"
                max="12"
                className="w-28 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                value={reportMonth}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  if (Number.isNaN(value)) {
                    setReportMonth(1);
                    return;
                  }
                  setReportMonth(Math.min(12, Math.max(1, value)));
                }}
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
              <span>Year</span>
              <input
                type="number"
                min="2000"
                max="9999"
                className="w-32 rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                value={reportYear}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  if (Number.isNaN(value)) {
                    setReportYear(new Date().getFullYear());
                    return;
                  }
                  setReportYear(Math.min(9999, Math.max(2000, value)));
                }}
              />
            </label>

            <Button onClick={() => reportQuery.refetch()} disabled={reportQuery.isFetching}>
              {reportQuery.isFetching ? <Loader text="Refreshing..." /> : 'Refresh Report'}
            </Button>
          </div>

          {reportQuery.isLoading ? <Loader text="Loading report..." /> : null}
          {reportError ? <p className="text-sm text-rose-600">{reportError}</p> : null}

          {!reportQuery.isLoading && !reportItems.length ? (
            <EmptyState title="No monthly data found" description="Try another month or year." />
          ) : null}

          {!reportQuery.isLoading && reportItems.length ? (
            <Table>
              <thead className="bg-slate-50">
                <tr>
                  {['Employee', 'Department', 'Designation', 'Present', 'Absent', 'Leave', 'Holiday'].map((label) => (
                    <th key={label} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {reportItems.map((item) => (
                  <tr key={`${item?.employeeId}-${item?.fullName}`}>
                    <td className="px-4 py-3 text-sm text-slate-800">{item?.fullName || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{item?.department || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{item?.designation || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{item?.Present ?? 0}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{item?.Absent ?? 0}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{item?.Leave ?? 0}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{item?.Holiday ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : null}
        </Card>
      </main>
    </div>
  );
};

export default AdminDashboard;
