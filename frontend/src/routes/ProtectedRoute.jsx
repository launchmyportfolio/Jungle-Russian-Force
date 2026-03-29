import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import Loader from '../components/ui/Loader.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const getLoginPath = (allowedRoles) => {
  if (allowedRoles.includes('admin') && !allowedRoles.includes('employee')) {
    return '/admin/login';
  }
  return '/employee/login';
};

const getDefaultDashboard = (role) => {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'employee') return '/employee/dashboard';
  return '/employee/login';
};

const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const location = useLocation();
  const {
    loading,
    isAuthenticated,
    role,
  } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <Loader text="Checking session..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={getLoginPath(allowedRoles)} replace state={{ from: location }} />;
  }

  if (allowedRoles.length && !allowedRoles.includes(role)) {
    return <Navigate to={getDefaultDashboard(role)} replace />;
  }

  return children;
};

export default ProtectedRoute;
