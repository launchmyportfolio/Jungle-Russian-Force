import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Input from '../components/ui/Input.jsx';
import Loader from '../components/ui/Loader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import {
  employeeLogin,
  verifyEmployeeOtp,
  resendEmployeeOtp,
} from '../services/authService.js';

const formatCountdown = (seconds) => {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const remaining = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
};

const defaultForm = {
  employeeId: '',
  password: '',
};

const EmployeeLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [form, setForm] = useState(defaultForm);
  const [otp, setOtp] = useState('');
  const [otpMode, setOtpMode] = useState(false);
  const [pendingEmployeeId, setPendingEmployeeId] = useState('');
  const [expiresInSeconds, setExpiresInSeconds] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmitOtp = useMemo(() => /^\d{6}$/.test(otp.trim()), [otp]);

  useEffect(() => {
    if (!otpMode || resendCooldown <= 0) return undefined;

    const timer = window.setInterval(() => {
      setResendCooldown((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [otpMode, resendCooldown]);

  useEffect(() => {
    if (!otpMode || expiresInSeconds <= 0) return undefined;

    const timer = window.setInterval(() => {
      setExpiresInSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [otpMode, expiresInSeconds]);

  const resetOtpState = () => {
    setOtpMode(false);
    setOtp('');
    setPendingEmployeeId('');
    setExpiresInSeconds(0);
    setResendCooldown(0);
  };

  const onSubmitCredentials = async (event) => {
    event.preventDefault();
    setError('');

    const employeeId = form.employeeId.trim().toUpperCase();
    const password = form.password;

    if (!employeeId || !password) {
      const message = 'Employee ID and password are required.';
      setError(message);
      showToast(message, 'error');
      return;
    }

    setSubmitting(true);

    try {
      const payload = await employeeLogin({ employeeId, password });
      const responseData = payload?.data || {};

      if (!responseData.requiresOtp) {
        const message = payload?.message || 'OTP challenge was not created.';
        setError(message);
        showToast(message, 'error');
        return;
      }

      setPendingEmployeeId(responseData.employeeId || employeeId);
      setOtp('');
      setOtpMode(true);
      setExpiresInSeconds((Number(responseData.otpExpiryMinutes) || 5) * 60);
      setResendCooldown(Number(responseData.resendCooldownSeconds) || 30);
      showToast(responseData.message || 'OTP sent to your registered email.', 'success');
    } catch (apiError) {
      const message = apiError?.response?.data?.message || 'Unable to login. Please try again.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const onVerifyOtp = async (event) => {
    event.preventDefault();
    setError('');

    if (!pendingEmployeeId) {
      const message = 'Login session not found. Please login again.';
      setError(message);
      showToast(message, 'error');
      resetOtpState();
      return;
    }

    if (!canSubmitOtp) {
      const message = 'Please enter a valid 6-digit OTP.';
      setError(message);
      showToast(message, 'error');
      return;
    }

    setSubmitting(true);

    try {
      const payload = await verifyEmployeeOtp({
        employeeId: pendingEmployeeId,
        otp: otp.trim(),
      });

      login(payload);
      showToast('Employee login successful.', 'success');
      navigate('/employee/dashboard', { replace: true });
    } catch (apiError) {
      const message = apiError?.response?.data?.message || 'OTP verification failed.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const onResendOtp = async () => {
    setError('');

    if (!pendingEmployeeId) {
      const message = 'Login session not found. Please login again.';
      setError(message);
      showToast(message, 'error');
      resetOtpState();
      return;
    }

    setSubmitting(true);

    try {
      const payload = await resendEmployeeOtp({ employeeId: pendingEmployeeId });
      const responseData = payload?.data || {};
      setOtp('');
      setExpiresInSeconds((Number(responseData.otpExpiryMinutes) || 5) * 60);
      setResendCooldown(Number(responseData.resendCooldownSeconds) || 30);
      showToast('OTP resent to your registered email.', 'success');
    } catch (apiError) {
      const message = apiError?.response?.data?.message || 'Failed to resend OTP.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-app px-4 py-10">
      <div className="w-full max-w-md">
        <Card
          title="Employee Login"
          subtitle={otpMode
            ? 'Enter the OTP sent to your registered email'
            : 'Use your Employee ID and password to continue'}
        >
          {!otpMode ? (
            <form className="space-y-4" onSubmit={onSubmitCredentials}>
              <Input
                id="employee-id"
                label="Employee ID"
                value={form.employeeId}
                onChange={(event) => setForm((prev) => ({ ...prev, employeeId: event.target.value }))}
                placeholder="Enter employee ID"
                required
              />

              <Input
                id="employee-password"
                type="password"
                label="Password"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                placeholder="Enter password"
                required
              />

              {error ? <p className="text-sm text-rose-600">{error}</p> : null}

              <Button className="w-full" type="submit" disabled={submitting}>
                {submitting ? <Loader text="Sending OTP..." /> : 'Continue'}
              </Button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={onVerifyOtp}>
              <Input
                id="employee-login-otp"
                label="OTP"
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit OTP"
                required
                inputMode="numeric"
              />

              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <p>OTP expires in {formatCountdown(expiresInSeconds)}</p>
                <p>Resend available in {resendCooldown > 0 ? `${resendCooldown}s` : 'now'}</p>
              </div>

              {error ? <p className="text-sm text-rose-600">{error}</p> : null}

              <div className="flex items-center gap-2">
                <Button type="submit" disabled={submitting || !canSubmitOtp || expiresInSeconds <= 0}>
                  {submitting ? <Loader text="Verifying..." /> : 'Verify OTP'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onResendOtp}
                  disabled={submitting || resendCooldown > 0}
                >
                  Resend OTP
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={resetOtpState}
                  disabled={submitting}
                >
                  Start Over
                </Button>
              </div>

              {expiresInSeconds <= 0 ? (
                <p className="text-xs text-amber-700">OTP expired. Please resend OTP or start login again.</p>
              ) : null}
            </form>
          )}
        </Card>
      </div>
    </div>
  );
};

export default EmployeeLogin;
