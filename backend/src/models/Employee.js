import mongoose from 'mongoose';
import { EMPLOYEE_STATUSES, EMPLOYMENT_TYPES } from '../utils/constants.js';

const employeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true, trim: true, uppercase: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, required: [true, 'Email is required'], unique: true, trim: true, lowercase: true },
    address: { type: String, trim: true },
    gender: { type: String, trim: true },
    dateOfBirth: { type: Date },
    joinDate: { type: Date, required: [true, 'Join date is required'] },
    department: { type: String, trim: true },
    designation: { type: String, trim: true },
    reportingManager: { type: String, trim: true },
    workLocation: { type: String, trim: true },
    employmentType: { type: String, enum: EMPLOYMENT_TYPES, default: 'Full-time' },
    status: { type: String, enum: EMPLOYEE_STATUSES, default: 'Active' },
    passwordHash: { type: String, required: true },
    isEmailVerified: { type: Boolean, default: false },
    otpHash: { type: String, default: '' },
    otpExpiresAt: { type: Date, default: null },
    otpAttempts: { type: Number, default: 0 },
    otpLastSentAt: { type: Date, default: null },
    otpBlockedUntil: { type: Date, default: null },
    firstLoginCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

employeeSchema.set('toJSON', {
  transform: (_, ret) => {
    delete ret.passwordHash;
    delete ret.otpHash;
    delete ret.otpExpiresAt;
    delete ret.otpAttempts;
    delete ret.otpLastSentAt;
    delete ret.otpBlockedUntil;
    return ret;
  },
});

const Employee = mongoose.models.Employee || mongoose.model('Employee', employeeSchema);
export default Employee;
