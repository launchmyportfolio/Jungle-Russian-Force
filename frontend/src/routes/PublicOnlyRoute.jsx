import React from 'react';
import { Navigate } from 'react-router-dom';
import Loader from '../components/ui/Loader.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const PublicOnlyRoute = ({ children }) => {
  const { loading, isAuthenticated, role } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <Loader text="Loading session..." />
      </div>
    );
  }

  if (isAuthenticated) {
    if (role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }

    return <Navigate to="/employee/dashboard" replace />;
  }

  return children;
};

export default PublicOnlyRoute;
