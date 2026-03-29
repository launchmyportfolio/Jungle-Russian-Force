import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Button from '../ui/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const TopBar = ({ title, subtitle = 'JRF Digital Timesheet System' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';
  const onSettingsPage = location.pathname === '/admin/settings';

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          <p className="text-xs text-slate-400">{subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin ? (
            <Button
              variant="secondary"
              className="!px-3 !py-2 text-xs"
              onClick={() => navigate(onSettingsPage ? '/admin/dashboard' : '/admin/settings')}
            >
              {onSettingsPage ? 'Dashboard' : 'Settings'}
            </Button>
          ) : null}
          <span className="hidden text-sm text-slate-300 sm:block">
            {user?.fullName || user?.username || 'User'}
          </span>
          <Button variant="secondary" className="!px-3 !py-2 text-xs" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
