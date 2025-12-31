import { createContext, useContext, useState, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

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

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

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
        setUser(null);
      }
    }
    setLoading(false);
  };

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    setUser(response.user);
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
      setUser(response.user);
      return response;
    } catch (error) {
      console.error('AuthContext: googleLogin error', error);
      throw error; // Re-throw to let component handle it
    }
  };

  const register = async (userData) => {
    const response = await authService.register(userData);
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    setUser(response.user);
    return response;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('cart');
    setUser(null);
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

  const value = {
    user,
    loading,
    login,
    googleLogin,
    register,
    logout,
    updateUser,
    refreshUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isGoogleUser: user?.authProvider === 'google',
    isEmailVerified: user?.emailVerified || user?.authProvider === 'google',
    isPhoneVerified: user?.phoneVerified
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
