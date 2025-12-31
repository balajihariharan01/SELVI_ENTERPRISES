import api from './api';

export const authService = {
  // Register new user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Google OAuth login
  googleLogin: async (credential) => {
    const response = await api.post('/auth/google', { credential });
    return response.data;
  },

  // Get current user
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Update profile
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await api.put('/auth/password', passwordData);
    return response.data;
  },

  // Forgot password - request reset email
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Verify reset token
  verifyResetToken: async (token) => {
    const response = await api.get(`/auth/verify-reset-token/${token}`);
    return response.data;
  },

  // Reset password with token
  resetPassword: async (token, password, confirmPassword) => {
    const response = await api.post(`/auth/reset-password/${token}`, {
      password,
      confirmPassword
    });
    return response.data;
  },

  // Check email availability
  checkEmail: async (email) => {
    const response = await api.post('/auth/check-email', { email });
    return response.data;
  },

  // Check phone availability
  checkPhone: async (phone, excludeUserId = null) => {
    const response = await api.post('/auth/check-phone', { phone, excludeUserId });
    return response.data;
  },

  // Send email verification
  sendVerificationEmail: async () => {
    const response = await api.post('/auth/send-verification-email');
    return response.data;
  },

  // Verify email with token
  verifyEmail: async (token) => {
    const response = await api.get(`/auth/verify-email/${token}`);
    return response.data;
  },

  // Send phone OTP
  sendPhoneOTP: async () => {
    const response = await api.post('/auth/send-phone-otp');
    return response.data;
  },

  // Verify phone OTP
  verifyPhoneOTP: async (otp) => {
    const response = await api.post('/auth/verify-phone-otp', { otp });
    return response.data;
  },

  // Get verification status
  getVerificationStatus: async () => {
    const response = await api.get('/auth/verification-status');
    return response.data;
  }
};

export default authService;
