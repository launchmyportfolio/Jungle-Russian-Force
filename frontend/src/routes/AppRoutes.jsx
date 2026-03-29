import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLogin from '../pages/AdminLogin.jsx';
import EmployeeLogin from '../pages/EmployeeLogin.jsx';
import AdminDashboard from '../pages/AdminDashboard.jsx';
import AdminSettings from '../pages/AdminSettings.jsx';
import EmployeeDashboard from '../pages/EmployeeDashboard.jsx';
import ChangePassword from '../pages/ChangePassword.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';
import PublicOnlyRoute from './PublicOnlyRoute.jsx';

const AppRoutes = () => {
  return (
    <Routes>
      <Route
        path="/admin/login"
        element={(
          <PublicOnlyRoute>
            <AdminLogin />
          </PublicOnlyRoute>
        )}
      />

      <Route
        path="/employee/login"
        element={(
          <PublicOnlyRoute>
            <EmployeeLogin />
          </PublicOnlyRoute>
        )}
      />

      <Route
        path="/admin/dashboard"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        )}
      />

      <Route
        path="/admin/settings"
        element={(
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminSettings />
          </ProtectedRoute>
        )}
      />

      <Route
        path="/employee/dashboard"
        element={(
          <ProtectedRoute allowedRoles={['employee']}>
            <EmployeeDashboard />
          </ProtectedRoute>
        )}
      />

      <Route
        path="/employee/change-password"
        element={(
          <ProtectedRoute allowedRoles={['employee']}>
            <ChangePassword />
          </ProtectedRoute>
        )}
      />

      <Route path="/" element={<Navigate to="/employee/login" replace />} />
      <Route path="*" element={<Navigate to="/employee/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
