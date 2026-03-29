import Attendance from '../models/Attendance.js';
import Employee from '../models/Employee.js';
import { validateCurrentWeekEntries } from '../services/attendanceService.js';
import { ApiError } from '../utils/apiError.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { getWeekRange, toDateOrNull, toUtcDateOnly } from '../utils/dateUtils.js';

const isWeekDay = (date) => {
  const day = date.getUTCDay();
  return day >= 1 && day <= 5;
};

const buildDateRange = (startDateRaw, endDateRaw) => {
  const startDate = toDateOrNull(startDateRaw);
  const endDate = toDateOrNull(endDateRaw);

  if (!startDate && !endDate) {
    return getWeekRange(new Date());
  }

  if (!startDate || !endDate) {
    throw new ApiError(400, 'startDate and endDate are both required when filtering by range');
  }

  const start = toUtcDateOnly(startDate);
  const end = toUtcDateOnly(endDate);
  end.setUTCHours(23, 59, 59, 999);

  if (start > end) {
    throw new ApiError(400, 'startDate must be before endDate');
  }

  return { start, end };
};

export const markWeekAttendance = async (req, res) => {
  const { entries } = req.body;
  const normalized = validateCurrentWeekEntries(entries || []);
  if (!req.currentUser?.joinDate) {
    throw new ApiError(400, 'Employee joining date is missing');
  }

  const joinDate = toUtcDateOnly(req.currentUser.joinDate);
  const today = toUtcDateOnly(new Date());

  normalized.forEach((entry) => {
    if (!isWeekDay(entry.date)) {
      throw new ApiError(400, 'Attendance can only be marked for Monday to Friday');
    }

    if (entry.date < joinDate) {
      throw new ApiError(400, 'Cannot mark attendance before joining date');
    }

    if (entry.date > today) {
      throw new ApiError(400, 'Cannot mark attendance for future dates');
    }
  });

  const employeeObjectId = req.auth.userId;

  const operations = normalized.map((entry) => ({
    updateOne: {
      filter: {
        employeeId: employeeObjectId,
        date: entry.date,
      },
      update: {
        $set: {
          status: entry.status,
          remarks: entry.remarks,
          updatedAt: new Date(),
        },
      },
      upsert: true,
    },
  }));

  await Attendance.bulkWrite(operations);

  return sendSuccess(res, {}, 'Attendance updated successfully');
};

export const getEmployeeWeekAttendance = async (req, res) => {
  const range = buildDateRange(req.query.startDate, req.query.endDate);

  const records = await Attendance.find({
    employeeId: req.auth.userId,
    date: { $gte: range.start, $lte: range.end },
  })
    .sort({ date: 1 })
    .lean();

  return sendSuccess(res, { items: records });
};

export const getAdminWeekAttendance = async (req, res) => {
  const range = buildDateRange(req.query.startDate, req.query.endDate);

  const {
    page = 1,
    limit = 20,
    search,
    department,
    designation,
    status,
  } = req.query;

  const employeeQuery = {};

  if (search) {
    employeeQuery.$or = [
      { employeeId: { $regex: search, $options: 'i' } },
      { fullName: { $regex: search, $options: 'i' } },
    ];
  }

  if (department) employeeQuery.department = department;
  if (designation) employeeQuery.designation = designation;
  if (status) employeeQuery.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [employees, total] = await Promise.all([
    Employee.find(employeeQuery)
      .select('-passwordHash')
      .sort({ fullName: 1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Employee.countDocuments(employeeQuery),
  ]);

  const employeeIds = employees.map((employee) => employee._id);

  const records = await Attendance.find({
    employeeId: { $in: employeeIds },
    date: { $gte: range.start, $lte: range.end },
  })
    .sort({ date: 1 })
    .lean();

  const grouped = new Map();
  records.forEach((record) => {
    const employeeId = record.employeeId.toString();
    if (!grouped.has(employeeId)) grouped.set(employeeId, []);
    grouped.get(employeeId).push(record);
  });

  const items = employees.map((employee) => ({
    employee,
    records: grouped.get(employee._id.toString()) || [],
  }));

  return sendSuccess(res, {
    items,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
};

export const getMonthlyReport = async (req, res) => {
  const month = Number(req.query.month);
  const year = Number(req.query.year);

  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  const aggregated = await Attendance.aggregate([
    {
      $match: {
        date: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: {
          employeeId: '$employeeId',
          status: '$status',
        },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.employeeId',
        counts: {
          $push: {
            status: '$_id.status',
            count: '$count',
          },
        },
      },
    },
    {
      $lookup: {
        from: 'employees',
        localField: '_id',
        foreignField: '_id',
        as: 'employee',
      },
    },
    { $unwind: '$employee' },
  ]);

  const items = aggregated.map((row) => {
    const summary = {
      Present: 0,
      Absent: 0,
      Leave: 0,
      Holiday: 0,
    };

    row.counts.forEach((item) => {
      summary[item.status] = item.count;
    });

    return {
      employeeId: row.employee.employeeId,
      fullName: row.employee.fullName,
      department: row.employee.department,
      designation: row.employee.designation,
      ...summary,
    };
  });

  return sendSuccess(res, { items, month, year }, 'Monthly report generated');
};
