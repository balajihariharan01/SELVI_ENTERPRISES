import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

// Session timeout duration: 1 hour in milliseconds
const SESSION_TIMEOUT = 60 * 60 * 1000; // 1 hour

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Logout function (defined early for use in other functions)
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('cart');
    localStorage.removeItem('loginTime');
    setUser(null);
    setSessionExpired(false);
  }, []);

  // Check if session has expired
  const isSessionExpired = useCallback(() => {
    const loginTime = localStorage.getItem('loginTime');
    if (!loginTime) return true;

    const elapsed = Date.now() - parseInt(loginTime, 10);
    return elapsed >= SESSION_TIMEOUT;
  }, []);

  // Handle session expiration
  const handleSessionExpiry = useCallback(() => {
    setSessionExpired(true);
    logout();
  }, [logout]);

  // Reset session timer (call on user activity)
  const resetSessionTimer = useCallback(() => {
    if (user) {
      localStorage.setItem('loginTime', Date.now().toString());
    }
  }, [user]);

  useEffect(() => {
    checkAuth();
  }, []);

  // Session timeout checker
  useEffect(() => {
    if (!user) return;

    // Check session expiry every minute
    const intervalId = setInterval(() => {
      if (isSessionExpired()) {
        handleSessionExpiry();
      }
    }, 60 * 1000); // Check every minute

    // Also check on visibility change (when user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isSessionExpired()) {
        handleSessionExpiry();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, isSessionExpired, handleSessionExpiry]);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const loginTime = localStorage.getItem('loginTime');

    // Check if session has expired
    if (loginTime && isSessionExpired()) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('loginTime');
      setSessionExpired(true);
      setLoading(false);
      return;
    }

    if (token && storedUser) {
      try {
        // Verify token is still valid
        const response = await authService.getMe();
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
      } catch (error) {
        // Token invalid, clear storage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('loginTime');
        setUser(null);
      }
    }
    setLoading(false);
  };

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    localStorage.setItem('loginTime', Date.now().toString()); // Store login time
    setUser(response.user);
    setSessionExpired(false);
    return response;
  };

  const googleLogin = async (credential) => {
    console.log('AuthContext: Calling googleLogin with credential');
    try {
      const response = await authService.googleLogin(credential);
      console.log('AuthContext: googleLogin response received', response);

      if (!response.token || !response.user) {
        throw new Error('Invalid response from server');
      }

      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('loginTime', Date.now().toString()); // Store login time
      setUser(response.user);
      setSessionExpired(false);
      return response;
    } catch (error) {
      console.error('AuthContext: googleLogin error', error);
      throw error;
    }
  };

  const register = async (userData) => {
    const response = await authService.register(userData);
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    localStorage.setItem('loginTime', Date.now().toString()); // Store login time
    setUser(response.user);
    setSessionExpired(false);
    return response;
  };

  const updateUser = (updatedUser) => {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const refreshUser = async () => {
    try {
      const response = await authService.getMe();
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));
      return response.user;
    } catch (error) {
      console.error('Failed to refresh user:', error);
      throw error;
    }
  };

  // Get remaining session time in minutes
  const getSessionTimeRemaining = useCallback(() => {
    const loginTime = localStorage.getItem('loginTime');
    if (!loginTime) return 0;

    const elapsed = Date.now() - parseInt(loginTime, 10);
    const remaining = SESSION_TIMEOUT - elapsed;
    return Math.max(0, Math.floor(remaining / 60000)); // Return minutes
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    login,
    googleLogin,
    register,
    logout,
    updateUser,
    refreshUser,
    resetSessionTimer,
    getSessionTimeRemaining,
    sessionExpired,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isGoogleUser: user?.authProvider === 'google',
    isEmailVerified: user?.emailVerified || user?.authProvider === 'google',
    isPhoneVerified: user?.phoneVerified
  }), [
    user,
    loading,
    logout,
    resetSessionTimer,
    getSessionTimeRemaining,
    sessionExpired
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;