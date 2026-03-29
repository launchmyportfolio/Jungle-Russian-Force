import Employee from '../models/Employee.js';
import { hashPassword } from '../services/authService.js';
import { ApiError } from '../utils/apiError.js';
import { sendSuccess } from '../utils/apiResponse.js';

const employeeSelect = '-passwordHash';

export const createEmployee = async (req, res) => {
  const payload = req.body;
  const normalizedEmployeeId = payload.employeeId.toUpperCase();
  const normalizedEmail = payload.email.trim().toLowerCase();

  const exists = await Employee.findOne({ employeeId: normalizedEmployeeId });
  if (exists) throw new ApiError(409, 'Employee ID already exists');

  const emailExists = await Employee.findOne({ email: normalizedEmail });
  if (emailExists) throw new ApiError(409, 'Employee email already exists');

  const passwordHash = await hashPassword(normalizedEmployeeId);

  const employee = await Employee.create({
    ...payload,
    employeeId: normalizedEmployeeId,
    email: normalizedEmail,
    passwordHash,
    firstLoginCompleted: false,
  });

  const fresh = await Employee.findById(employee._id).select(employeeSelect).lean();
  return sendSuccess(res, { employee: fresh }, 'Employee created successfully', 201);
};

export const getEmployees = async (req, res) => {
  const {
    page = 1,
    limit = 10,
    search,
    department,
    designation,
    status,
  } = req.query;

  const query = {};

  if (search) {
    query.$or = [
      { employeeId: { $regex: search, $options: 'i' } },
      { fullName: { $regex: search, $options: 'i' } },
    ];
  }

  if (department) query.department = department;
  if (designation) query.designation = designation;
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    Employee.find(query)
      .select(employeeSelect)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Employee.countDocuments(query),
  ]);

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

export const updateEmployee = async (req, res) => {
  const updates = { ...req.body };
  if (updates.employeeId) {
    updates.employeeId = updates.employeeId.toUpperCase();
  }
  if (updates.email) {
    updates.email = updates.email.trim().toLowerCase();
  }

  if (updates.employeeId) {
    const duplicateId = await Employee.findOne({
      employeeId: updates.employeeId,
      _id: { $ne: req.params.id },
    });

    if (duplicateId) {
      throw new ApiError(409, 'Employee ID already exists');
    }
  }

  if (updates.email) {
    const duplicateEmail = await Employee.findOne({
      email: updates.email,
      _id: { $ne: req.params.id },
    });

    if (duplicateEmail) {
      throw new ApiError(409, 'Employee email already exists');
    }
  }

  const employee = await Employee.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true,
  })
    .select(employeeSelect)
    .lean();

  if (!employee) throw new ApiError(404, 'Employee not found');

  return sendSuccess(res, { employee }, 'Employee updated successfully');
};

export const deleteEmployee = async (req, res) => {
  const employee = await Employee.findByIdAndDelete(req.params.id).lean();
  if (!employee) throw new ApiError(404, 'Employee not found');

  return sendSuccess(res, {}, 'Employee deleted successfully');
};
