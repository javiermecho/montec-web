import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

const STORAGE_KEYS = {
  AUTH_SESSION: 'montec_auth_session_v2'
};

// Comprobación de subdominio o modo taller
export function checkIsTallerSubdomain() {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname.toLowerCase();
  const search = window.location.search.toLowerCase();
  const hash = window.location.hash.toLowerCase();

  return (
    hostname.startsWith('taller.') ||
    hostname.includes('taller-montec') ||
    search.includes('taller=1') ||
    search.includes('mode=taller') ||
    hash === '#taller' ||
    hash === '#cockpit' ||
    hash === '#empleados'
  );
}

export function AuthProvider({ children }) {
  const [isTallerSubdomain, setIsTallerSubdomain] = useState(checkIsTallerSubdomain);

  useEffect(() => {
    const handleHashChange = () => {
      setIsTallerSubdomain(checkIsTallerSubdomain());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Sesión actual validada con token JWT del backend
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      // Limpiar claves inseguras heredadas si existieran en localStorage
      localStorage.removeItem('montec_admin_password_v1');
      localStorage.removeItem('montec_operator_pin_v1');

      const token = api.getAuthToken();
      if (!token) {
        localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
        localStorage.removeItem('montec_admin_auth');
        localStorage.removeItem('montec_employee_auth_v1');
        return null;
      }

      const saved = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const saveSession = useCallback((user) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(user));
      if (user.role === 'admin') {
        localStorage.setItem('montec_admin_auth', 'true');
        localStorage.setItem('montec_employee_auth_v1', 'true');
      } else {
        localStorage.removeItem('montec_admin_auth');
        localStorage.setItem('montec_employee_auth_v1', 'true');
      }
    } else {
      api.clearAuthToken();
      localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
      localStorage.removeItem('montec_admin_auth');
      localStorage.removeItem('montec_employee_auth_v1');
    }
  }, []);

  // Verificar token JWT al montar y cuando se limpia por 401
  useEffect(() => {
    let mounted = true;
    const validateCurrentSession = async () => {
      if (!api.getAuthToken()) return;
      const res = await api.verifySessionApi();
      if (!mounted) return;
      if (res.success && res.user) {
        saveSession({ ...res.user, loginAt: currentUser?.loginAt || new Date().toISOString() });
      } else if (!res.isOffline) {
        saveSession(null);
      }
    };
    validateCurrentSession();

    const handleAuthChanged = () => {
      if (!api.getAuthToken()) {
        setCurrentUser(null);
      }
    };
    window.addEventListener('montec-auth-changed', handleAuthChanged);
    return () => {
      mounted = false;
      window.removeEventListener('montec-auth-changed', handleAuthChanged);
    };
  }, []);

  /**
   * Inicia sesión autenticando contra el backend (/api/auth/login).
   */
  const login = async (credential, preferredRole = 'auto') => {
    const clean = (credential || '').trim();
    if (!clean) return { success: false, error: 'Ingresa tu PIN o clave de acceso' };

    const res = await api.loginApi(clean, preferredRole || 'auto');
    if (res.success && res.user) {
      saveSession(res.user);
      return { success: true, user: res.user };
    }
    return { success: false, error: res.error || 'PIN o contraseña incorrecta' };
  };

  const logout = () => {
    saveSession(null);
  };

  /**
   * Eleva la sesión actual a Administrador validando la clave en el backend.
   */
  const elevateToAdmin = async (adminCred) => {
    const clean = (adminCred || '').trim();
    if (!clean) return { success: false, error: 'Ingresa la clave de Administrador' };

    const res = await api.loginApi(clean, 'admin');
    if (res.success && res.user?.role === 'admin') {
      saveSession(res.user);
      return { success: true, user: res.user };
    }
    return { success: false, error: res.error || 'Clave de Administrador inválida' };
  };

  const switchRole = (newRole) => {
    if (currentUser?.role === 'admin' && (newRole === 'operador' || newRole === 'admin')) {
      setCurrentUser(prev => ({ ...prev, activeRoleView: newRole }));
    }
  };

  const updateCredentials = async ({ newAdminPassword, newOperatorPin }) => {
    return api.changeCredentialsApi({ newAdminPassword, newOperatorPin });
  };

  const isAuthenticated = Boolean(currentUser && api.getAuthToken());
  const role = currentUser?.role || null;
  const isOperator = isAuthenticated && (role === 'operador' || role === 'admin');
  const isAdmin = isAuthenticated && role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        isAuthenticated,
        isOperator,
        isAdmin,
        isTallerSubdomain,
        login,
        logout,
        elevateToAdmin,
        switchRole,
        updateCredentials
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
}
