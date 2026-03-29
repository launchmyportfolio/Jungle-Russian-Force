import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopBar from '../components/layout/TopBar.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import Input from '../components/ui/Input.jsx';
import Loader from '../components/ui/Loader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { changeEmployeePassword } from '../services/authService.js';

const ChangePassword = () => {
  const navigate = useNavigate();
  const { user, refreshSession } = useAuth();
  const { showToast } = useToast();
  const isFirstLogin = user?.firstLoginCompleted === false;

  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const title = useMemo(() => {
    if (isFirstLogin) {
      return 'Set New Password';
    }
    return 'Change Password';
  }, [isFirstLogin]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    const normalizedNewPassword = form.newPassword.trim();
    const normalizedConfirmPassword = form.confirmPassword.trim();

    if (normalizedNewPassword.length < 6) {
      const message = 'New password must be at least 6 characters.';
      setError(message);
      showToast(message, 'error');
      return;
    }

    if (normalizedNewPassword !== normalizedConfirmPassword) {
      const message = 'New password and confirm password do not match.';
      setError(message);
      showToast(message, 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        newPassword: normalizedNewPassword,
      };

      if (!isFirstLogin) {
        payload.currentPassword = form.currentPassword.trim();
      } else if (user?.employeeId) {
        // Backward-compatible fallback if backend still expects current password on first login.
        payload.currentPassword = user.employeeId;
      }

      await changeEmployeePassword(payload);

      await refreshSession();
      showToast('Password updated successfully.', 'success');
      navigate('/employee/dashboard', { replace: true });
    } catch (apiError) {
      const message = apiError?.response?.data?.data?.[0]?.msg
        || apiError?.response?.data?.message
        || 'Failed to update password.';
      setError(message);
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-app">
      <TopBar title={title} subtitle="Secure your account with a strong password" />

      <main className="mx-auto w-full max-w-2xl px-4 py-8 md:px-6">
        <Card title={title} subtitle="Use a password you have not used before">
          <form className="space-y-4" onSubmit={onSubmit}>
            {!isFirstLogin ? (
              <Input
                id="current-password"
                type="password"
                label="Current Password"
                value={form.currentPassword}
                onChange={(event) => setForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
                required
              />
            ) : null}

            <Input
              id="new-password"
              type="password"
              label="New Password"
              value={form.newPassword}
              onChange={(event) => setForm((prev) => ({ ...prev, newPassword: event.target.value }))}
              required
            />

            <Input
              id="confirm-password"
              type="password"
              label="Confirm Password"
              value={form.confirmPassword}
              onChange={(event) => setForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
              required
            />

            {error ? <p className="text-sm text-rose-600">{error}</p> : null}

            <div className="flex items-center gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader text="Saving..." /> : 'Save Password'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/employee/dashboard')}
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default ChangePassword;
