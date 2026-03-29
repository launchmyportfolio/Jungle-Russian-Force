import React, { useEffect, useMemo, useState } from 'react';
import TopBar from '../components/layout/TopBar.jsx';
import Card from '../components/ui/Card.jsx';
import Input from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import Loader from '../components/ui/Loader.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { changePassword, changeUsername, sendOtp } from '../services/adminSettingsService.js';

const defaultUsernameForm = {
  currentPassword: '',
  otp: '',
  newUsername: '',
};

const defaultPasswordForm = {
  currentPassword: '',
  otp: '',
  newPassword: '',
  confirmNewPassword: '',
};

const AdminSettings = () => {
  const { showToast } = useToast();
  const { refreshSession } = useAuth();

  const [otpSent, setOtpSent] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpStatusMessage, setOtpStatusMessage] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);

  const [usernameForm, setUsernameForm] = useState(defaultUsernameForm);
  const [usernameSubmitting, setUsernameSubmitting] = useState(false);
  const [usernameError, setUsernameError] = useState('');

  const [passwordForm, setPasswordForm] = useState(defaultPasswordForm);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const canSubmitUsername = useMemo(
    () => otpSent && /^\d{6}$/.test(usernameForm.otp.trim()),
    [otpSent, usernameForm.otp]
  );

  const canSubmitPassword = useMemo(
    () => otpSent && /^\d{6}$/.test(passwordForm.otp.trim()),
    [otpSent, passwordForm.otp]
  );

  useEffect(() => {
    if (otpCooldown <= 0) return undefined;

    const timer = window.setInterval(() => {
      setOtpCooldown((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return value - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [otpCooldown]);

  const onSendOtp = async () => {
    setSendingOtp(true);
    setOtpStatusMessage('');

    try {
      await sendOtp();
      setOtpSent(true);
      setOtpCooldown(30);
      setOtpStatusMessage('OTP sent to admin email. It expires in 5 minutes.');
      showToast('OTP sent to admin email.', 'success');
    } catch (apiError) {
      const message = apiError?.response?.data?.message || 'Failed to send OTP.';
      setOtpStatusMessage(message);
      showToast(message, 'error');
    } finally {
      setSendingOtp(false);
    }
  };

  const onSubmitUsername = async (event) => {
    event.preventDefault();
    setUsernameError('');

    if (!canSubmitUsername) {
      const message = 'Send OTP and enter a valid 6-digit OTP first.';
      setUsernameError(message);
      showToast(message, 'error');
      return;
    }

    if (!usernameForm.currentPassword || !usernameForm.newUsername.trim()) {
      const message = 'Current password and new username are required.';
      setUsernameError(message);
      showToast(message, 'error');
      return;
    }

    setUsernameSubmitting(true);

    try {
      await changeUsername({
        currentPassword: usernameForm.currentPassword,
        otp: usernameForm.otp.trim(),
        newUsername: usernameForm.newUsername.trim(),
      });

      await refreshSession();
      setUsernameForm(defaultUsernameForm);
      setOtpSent(false);
      setOtpStatusMessage('');
      showToast('Admin username updated successfully.', 'success');
    } catch (apiError) {
      const message = apiError?.response?.data?.message || 'Failed to update username.';
      setUsernameError(message);
      showToast(message, 'error');
    } finally {
      setUsernameSubmitting(false);
    }
  };

  const onSubmitPassword = async (event) => {
    event.preventDefault();
    setPasswordError('');

    if (!canSubmitPassword) {
      const message = 'Send OTP and enter a valid 6-digit OTP first.';
      setPasswordError(message);
      showToast(message, 'error');
      return;
    }

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      const message = 'Current password and new password are required.';
      setPasswordError(message);
      showToast(message, 'error');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      const message = 'New password and confirm password do not match.';
      setPasswordError(message);
      showToast(message, 'error');
      return;
    }

    setPasswordSubmitting(true);

    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        otp: passwordForm.otp.trim(),
        newPassword: passwordForm.newPassword,
      });

      setPasswordForm(defaultPasswordForm);
      setOtpSent(false);
      setOtpStatusMessage('');
      showToast('Admin password updated successfully.', 'success');
    } catch (apiError) {
      const message = apiError?.response?.data?.message || 'Failed to update password.';
      setPasswordError(message);
      showToast(message, 'error');
    } finally {
      setPasswordSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-app pb-8">
      <TopBar title="Admin Settings" subtitle="Secure username and password updates via Email OTP" />

      <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 md:px-6">
        <Card title="OTP Verification" subtitle="Step 1: send OTP to admin email">
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={onSendOtp} disabled={sendingOtp || otpCooldown > 0}>
              {sendingOtp
                ? <Loader text="Sending OTP..." />
                : otpCooldown > 0
                  ? `Resend in ${otpCooldown}s`
                  : 'Send OTP to Email'}
            </Button>
            <span className="text-sm text-slate-600">
              {otpSent ? 'OTP sent' : 'OTP not sent yet'}
            </span>
          </div>
          {otpStatusMessage ? (
            <p className="mt-3 text-sm text-slate-600">{otpStatusMessage}</p>
          ) : null}
        </Card>

        <Card title="Change Username" subtitle="Step 2: submit OTP + current password to update username">
          <form className="space-y-4" onSubmit={onSubmitUsername}>
            <div className="grid gap-3 md:grid-cols-3">
              <Input
                type="password"
                label="Current Password"
                value={usernameForm.currentPassword}
                onChange={(event) => setUsernameForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                required
              />
              <Input
                label="OTP"
                value={usernameForm.otp}
                onChange={(event) => setUsernameForm((prev) => ({ ...prev, otp: event.target.value }))}
                placeholder="6-digit OTP"
                required
              />
              <Input
                label="New Username"
                value={usernameForm.newUsername}
                onChange={(event) => setUsernameForm((prev) => ({ ...prev, newUsername: event.target.value }))}
                required
              />
            </div>

            {usernameError ? <p className="text-sm text-rose-600">{usernameError}</p> : null}

            <Button type="submit" disabled={!canSubmitUsername || usernameSubmitting}>
              {usernameSubmitting ? <Loader text="Updating..." /> : 'Change Username'}
            </Button>
          </form>
        </Card>

        <Card title="Change Password" subtitle="Step 3: submit OTP + current password to update password">
          <form className="space-y-4" onSubmit={onSubmitPassword}>
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                type="password"
                label="Current Password"
                value={passwordForm.currentPassword}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                required
              />
              <Input
                label="OTP"
                value={passwordForm.otp}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, otp: event.target.value }))}
                placeholder="6-digit OTP"
                required
              />
              <Input
                type="password"
                label="New Password"
                value={passwordForm.newPassword}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
                required
              />
              <Input
                type="password"
                label="Confirm New Password"
                value={passwordForm.confirmNewPassword}
                onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmNewPassword: event.target.value }))}
                required
              />
            </div>

            {passwordError ? <p className="text-sm text-rose-600">{passwordError}</p> : null}

            <Button type="submit" disabled={!canSubmitPassword || passwordSubmitting}>
              {passwordSubmitting ? <Loader text="Updating..." /> : 'Change Password'}
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default AdminSettings;
