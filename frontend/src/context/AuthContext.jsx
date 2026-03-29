import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getCurrentSession,
  logoutSession,
} from '../services/authService.js';
import { setUnauthorizedHandler } from '../services/api.js';

const AuthContext = createContext(null);

const normalizeUser = (user) => {
  if (!user) return null;

  return {
    ...user,
    fullName: user.fullName || user.name || '',
    name: user.name || user.fullName || '',
    role: user.role || null,
  };
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const sessionReqIdRef = useRef(0);

  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('jrf_token') || '');
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback((redirectToLogin = true, targetRole = 'employee') => {
    setUser(null);
    setToken('');
    localStorage.removeItem('jrf_token');

    if (redirectToLogin) {
      const loginPath = targetRole === 'admin' ? '/admin/login' : '/employee/login';
      navigate(loginPath, { replace: true });
    }
  }, [navigate]);

  const syncSession = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    const reqId = sessionReqIdRef.current + 1;
    sessionReqIdRef.current = reqId;
    setLoading(true);

    try {
      const response = await getCurrentSession();

      if (sessionReqIdRef.current !== reqId) {
        return;
      }

      const sessionUser = normalizeUser(response?.data?.user);

      if (!sessionUser) {
        clearSession(false);
      } else {
        setUser(sessionUser);
      }
    } catch (_error) {
      if (sessionReqIdRef.current === reqId) {
        clearSession(false);
      }
    } finally {
      if (sessionReqIdRef.current === reqId) {
        setLoading(false);
      }
    }
  }, [clearSession, token]);

  useEffect(() => {
    setUnauthorizedHandler(() => clearSession(false));
  }, [clearSession]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('jrf_token', token);
      syncSession();
    } else {
      localStorage.removeItem('jrf_token');
      setLoading(false);
    }
  }, [token, syncSession]);

  const login = useCallback((payload) => {
    const tokenValue = payload?.data?.token || payload?.token || '';
    const sessionUser = normalizeUser(payload?.data?.user || payload?.user);

    if (!tokenValue || !sessionUser) {
      setUser(null);
      setToken('');
      localStorage.removeItem('jrf_token');
      return false;
    }

    localStorage.setItem('jrf_token', tokenValue);
    setToken(tokenValue);
    setUser(sessionUser);
    return true;
  }, []);

  const logout = useCallback(async () => {
    const currentRole = user?.role || 'employee';

    try {
      await logoutSession();
    } catch (_error) {
      // no-op: session can already be invalid
    }

    clearSession(true, currentRole);
  }, [clearSession, user?.role]);

  const value = useMemo(() => {
    const role = user?.role || null;
    const isAuthenticated = Boolean(user);

    return {
      user,
      token,
      loading,
      isAuthenticated,
      role,
      login,
      logout,
      refreshSession: syncSession,
    };
  }, [user, token, loading, login, logout, syncSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
