import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, default: 'admin' },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: () => (process.env.ADMIN_EMAIL || 'launchmyportfolio@gmail.com').toLowerCase(),
    },
    otpHash: { type: String, default: '' },
    otpExpiresAt: { type: Date, default: null },
    otpAttempts: { type: Number, default: 0 },
    otpResendCount: { type: Number, default: 0 },
    otpLastSentAt: { type: Date, default: null },
    otpBlockedUntil: { type: Date, default: null },
  },
  { timestamps: true }
);

adminSchema.set('toJSON', {
  transform: (_, ret) => {
    delete ret.passwordHash;
    delete ret.otpHash;
    delete ret.otpExpiresAt;
    delete ret.otpAttempts;
    delete ret.otpResendCount;
    delete ret.otpLastSentAt;
    delete ret.otpBlockedUntil;
    return ret;
  },
});

const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);
export default Admin;
