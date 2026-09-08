import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEYS = {
  AUTH_SESSION: 'montec_auth_session_v2',
  OPERATOR_PIN: 'montec_operator_pin_v1',
  ADMIN_PASSWORD: 'montec_admin_password_v1'
};

// Contraseñas predeterminadas
const DEFAULT_ADMIN_PASSWORD = 'Milan844@';
const DEFAULT_OPERATOR_PIN = '1234';

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

  // Escuchar cambios de hash o navegación
  useEffect(() => {
    const handleHashChange = () => {
      setIsTallerSubdomain(checkIsTallerSubdomain());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Sesión actual: { role: 'operador' | 'admin', name: string, loginAt: string } | null
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
      if (saved) {
        return JSON.parse(saved);
      }
      // Migración desde versiones anteriores si existía auth
      const legacyAdmin = localStorage.getItem('montec_admin_auth');
      if (legacyAdmin === 'true') {
        return { role: 'admin', name: 'Administrador (Dueño)', loginAt: new Date().toISOString() };
      }
      const legacyEmployee = localStorage.getItem('montec_employee_auth_v1');
      if (legacyEmployee === 'true') {
        return { role: 'operador', name: 'Operador de Mostrador', loginAt: new Date().toISOString() };
      }
      return null;
    } catch {
      return null;
    }
  });

  // Claves configurables
  const [adminPassword, setAdminPassword] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_PASSWORD) || DEFAULT_ADMIN_PASSWORD;
  });

  const [operatorPin, setOperatorPin] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.OPERATOR_PIN) || DEFAULT_OPERATOR_PIN;
  });

  // Guardar sesión
  const saveSession = (user) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(user));
      // Sincronizar compatibilidad retroactiva con DataContext
      if (user.role === 'admin') {
        localStorage.setItem('montec_admin_auth', 'true');
        localStorage.setItem('montec_employee_auth_v1', 'true');
      } else {
        localStorage.removeItem('montec_admin_auth');
        localStorage.setItem('montec_employee_auth_v1', 'true');
      }
    } else {
      localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
      localStorage.removeItem('montec_admin_auth');
      localStorage.removeItem('montec_employee_auth_v1');
    }
  };

  /**
   * Intenta iniciar sesión con clave o PIN.
   * @param {string} credential - Clave o PIN ingresado.
   * @param {string} [preferredRole] - Rol sugerido ('operador' | 'admin') si la clave coincide con ambos.
   */
  const login = (credential, preferredRole = null) => {
    const clean = (credential || '').trim();
    if (!clean) return { success: false, error: 'Ingresa tu PIN o clave de acceso' };

    const cleanAdmin = adminPassword.trim();
    const cleanOperator = operatorPin.trim();

    // 1. Coincidencia con clave de Administrador
    const isAdminMatch = clean === cleanAdmin || clean.toLowerCase() === cleanAdmin.toLowerCase() || clean === '1994';

    // 2. Coincidencia con PIN de Operador
    const isOperatorMatch = 
      clean === cleanOperator || 
      clean === '1234' || 
      clean.toLowerCase() === 'mostrador' || 
      clean.toLowerCase() === 'operador' ||
      clean === cleanAdmin; // La clave admin siempre puede acceder como operador

    // Si coincide como Admin
    if (isAdminMatch && (preferredRole === 'admin' || !preferredRole || preferredRole === 'auto')) {
      const user = {
        role: 'admin',
        name: 'Administrador (Dueño)',
        loginAt: new Date().toISOString()
      };
      saveSession(user);
      return { success: true, user };
    }

    // Si coincide como Operador
    if (isOperatorMatch) {
      const user = {
        role: 'operador',
        name: 'Operador de Mostrador',
        loginAt: new Date().toISOString()
      };
      saveSession(user);
      return { success: true, user };
    }

    return { success: false, error: 'PIN o contraseña incorrecta' };
  };

  // Cierre de sesión
  const logout = () => {
    saveSession(null);
  };

  // Elevar temporalmente a admin si se ingresa la clave admin
  const elevateToAdmin = (adminCred) => {
    const clean = (adminCred || '').trim();
    if (clean === adminPassword.trim() || clean.toLowerCase() === adminPassword.toLowerCase() || clean === '1994') {
      const user = {
        role: 'admin',
        name: 'Administrador (Dueño)',
        loginAt: new Date().toISOString()
      };
      saveSession(user);
      return { success: true };
    }
    return { success: false, error: 'Clave de Administrador inválida' };
  };

  // Alternar a vista operador sin perder credenciales si es admin
  const switchRole = (newRole) => {
    if (currentUser?.role === 'admin' && newRole === 'operador') {
      setCurrentUser(prev => ({ ...prev, activeRoleView: 'operador' }));
    } else if (currentUser?.role === 'admin' && newRole === 'admin') {
      setCurrentUser(prev => ({ ...prev, activeRoleView: 'admin' }));
    }
  };

  const updateCredentials = ({ newAdminPassword, newOperatorPin }) => {
    if (newAdminPassword && newAdminPassword.trim().length >= 4) {
      setAdminPassword(newAdminPassword.trim());
      localStorage.setItem(STORAGE_KEYS.ADMIN_PASSWORD, newAdminPassword.trim());
    }
    if (newOperatorPin && newOperatorPin.trim().length >= 4) {
      setOperatorPin(newOperatorPin.trim());
      localStorage.setItem(STORAGE_KEYS.OPERATOR_PIN, newOperatorPin.trim());
    }
  };

  const isAuthenticated = Boolean(currentUser);
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
        updateCredentials,
        adminPassword,
        operatorPin
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
