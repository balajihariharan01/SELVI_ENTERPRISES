import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiMail, FiPhone, FiLock, FiEye, FiEyeOff, FiCheck, FiX, FiAlertCircle } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import Logo from '../components/common/Logo';
import toast from 'react-hot-toast';
import './Auth.css';

// Debounce hook for real-time validation
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  // Validation states
  const [validation, setValidation] = useState({
    name: { valid: null, message: '' },
    email: { valid: null, message: '', checking: false },
    phone: { valid: null, message: '', checking: false },
    password: { valid: null, message: '', strength: 0 },
    confirmPassword: { valid: null, message: '' }
  });

  const { register, googleLogin, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  // Debounced values for async validation
  const debouncedEmail = useDebounce(formData.email, 500);
  const debouncedPhone = useDebounce(formData.phone, 500);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      if (isAdmin) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [isAuthenticated, isAdmin, navigate]);

  // Real-time name validation
  useEffect(() => {
    if (formData.name) {
      if (formData.name.length < 3) {
        setValidation(v => ({ ...v, name: { valid: false, message: 'Name must be at least 3 characters' } }));
      } else {
        setValidation(v => ({ ...v, name: { valid: true, message: '' } }));
      }
    } else {
      setValidation(v => ({ ...v, name: { valid: null, message: '' } }));
    }
  }, [formData.name]);

  // Real-time email validation with availability check
  useEffect(() => {
    const checkEmail = async () => {
      if (!debouncedEmail) {
        setValidation(v => ({ ...v, email: { valid: null, message: '', checking: false } }));
        return;
      }
      
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(debouncedEmail)) {
        setValidation(v => ({ ...v, email: { valid: false, message: 'Please enter a valid email address', checking: false } }));
        return;
      }
      
      setValidation(v => ({ ...v, email: { ...v.email, checking: true } }));
      
      try {
        const result = await authService.checkEmail(debouncedEmail);
        setValidation(v => ({ 
          ...v, 
          email: { 
            valid: result.available, 
            message: result.available ? '' : 'Email already registered',
            checking: false 
          } 
        }));
      } catch (error) {
        setValidation(v => ({ ...v, email: { valid: null, message: '', checking: false } }));
      }
    };
    
    checkEmail();
  }, [debouncedEmail]);

  // Real-time phone validation with availability check
  useEffect(() => {
    const checkPhone = async () => {
      if (!debouncedPhone) {
        setValidation(v => ({ ...v, phone: { valid: null, message: '', checking: false } }));
        return;
      }
      
      if (!/^[0-9]{10}$/.test(debouncedPhone)) {
        setValidation(v => ({ ...v, phone: { valid: false, message: 'Please enter a valid 10-digit phone number', checking: false } }));
        return;
      }
      
      setValidation(v => ({ ...v, phone: { ...v.phone, checking: true } }));
      
      try {
        const result = await authService.checkPhone(debouncedPhone);
        setValidation(v => ({ 
          ...v, 
          phone: { 
            valid: result.available, 
            message: result.available ? '' : 'Phone number already exists',
            checking: false 
          } 
        }));
      } catch (error) {
        setValidation(v => ({ ...v, phone: { valid: null, message: '', checking: false } }));
      }
    };
    
    checkPhone();
  }, [debouncedPhone]);

  // Real-time password validation
  useEffect(() => {
    if (!formData.password) {
      setValidation(v => ({ ...v, password: { valid: null, message: '', strength: 0 } }));
      return;
    }
    
    let strength = 0;
    const checks = {
      length: formData.password.length >= 8,
      uppercase: /[A-Z]/.test(formData.password),
      number: /\d/.test(formData.password),
      special: /[!@#$%^&*]/.test(formData.password)
    };
    
    if (checks.length) strength++;
    if (checks.uppercase) strength++;
    if (checks.number) strength++;
    if (checks.special) strength++;
    
    const isValid = checks.length && checks.uppercase && checks.number;
    const messages = [];
    if (!checks.length) messages.push('8+ characters');
    if (!checks.uppercase) messages.push('1 uppercase');
    if (!checks.number) messages.push('1 number');
    
    setValidation(v => ({ 
      ...v, 
      password: { 
        valid: isValid, 
        message: isValid ? '' : `Required: ${messages.join(', ')}`,
        strength 
      } 
    }));
  }, [formData.password]);

  // Real-time confirm password validation
  useEffect(() => {
    if (!formData.confirmPassword) {
      setValidation(v => ({ ...v, confirmPassword: { valid: null, message: '' } }));
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setValidation(v => ({ ...v, confirmPassword: { valid: false, message: 'Passwords do not match' } }));
    } else {
      setValidation(v => ({ ...v, confirmPassword: { valid: true, message: '' } }));
    }
  }, [formData.password, formData.confirmPassword]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name.replace('register-', '')]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check all validations
    if (!validation.name.valid) {
      toast.error('Please enter a valid name (min 3 characters)');
      return;
    }
    if (!validation.email.valid) {
      toast.error(validation.email.message || 'Please enter a valid email');
      return;
    }
    if (!validation.phone.valid) {
      toast.error(validation.phone.message || 'Please enter a valid phone number');
      return;
    }
    if (!validation.password.valid) {
      toast.error('Password must be at least 8 characters with 1 uppercase and 1 number');
      return;
    }
    if (!validation.confirmPassword.valid) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      });
      toast.success('Registration successful! Please check your email to verify your account.');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth - Same handler as Login page
  const handleGoogleSuccess = async (credentialResponse) => {
    setGoogleLoading(true);
    try {
      console.log('Google credential received:', credentialResponse.credential ? 'Yes' : 'No');
      
      if (!credentialResponse.credential) {
        throw new Error('No credential received from Google');
      }
      
      const response = await googleLogin(credentialResponse.credential);
      console.log('Google signup response:', response);
      
      toast.success('Google sign-up successful!');
      
      // STRICT Role-based redirect
      if (response.user.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (error) {
      console.error('Google sign-up error:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || error.message || 'Google sign-up failed';
      toast.error(errorMessage);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = (error) => {
    console.error('Google OAuth error:', error);
    toast.error('Google sign-up failed. Please check your browser console for details.');
  };

  return (
    <div className="auth-page auth-register">
      <div className="auth-overlay"></div>
      <div className="auth-container">
        <div className="auth-header">
          <Link to="/" className="auth-logo">
            <Logo className="logo-img" />
            <span>Selvi Enterprise</span>
          </Link>
          <h1>Create Account</h1>
          <p>Register to start ordering construction materials</p>
        </div>

        {/* Google Sign Up Button */}
        <div className="google-auth-section">
          <div className={`google-btn-wrapper ${googleLoading ? 'loading' : ''}`}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap={false}
              theme="outline"
              size="large"
              width="100%"
              text="continue_with"
              shape="rectangular"
            />
          </div>
          {googleLoading && (
            <div className="google-loading">
              <span>Signing up with Google...</span>
            </div>
          )}
        </div>

        <div className="auth-divider">
          <span>or register with email</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" autoComplete="off">
          <div className={`form-group ${validation.name.valid === false ? 'has-error' : validation.name.valid === true ? 'has-success' : ''}`}>
            <label className="form-label">Full Name</label>
            <div className="input-icon">
              <FiUser />
              <input
                type="text"
                name="register-name"
                id="register-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your full name"
                className="form-input"
                required
                autoComplete="off"
                data-form-type="other"
              />
              {validation.name.valid === true && <FiCheck className="validation-icon success" />}
              {validation.name.valid === false && <FiX className="validation-icon error" />}
            </div>
            {validation.name.message && <span className="validation-message error">{validation.name.message}</span>}
          </div>

          <div className={`form-group ${validation.email.valid === false ? 'has-error' : validation.email.valid === true ? 'has-success' : ''}`}>
            <label className="form-label">Email Address</label>
            <div className="input-icon">
              <FiMail />
              <input
                type="email"
                name="register-email"
                id="register-email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter your email"
                className="form-input"
                required
                autoComplete="new-email"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                data-form-type="other"
              />
              {validation.email.checking && <span className="validation-spinner"></span>}
              {!validation.email.checking && validation.email.valid === true && <FiCheck className="validation-icon success" />}
              {!validation.email.checking && validation.email.valid === false && <FiX className="validation-icon error" />}
            </div>
            {validation.email.message && <span className="validation-message error">{validation.email.message}</span>}
          </div>

          <div className={`form-group ${validation.phone.valid === false ? 'has-error' : validation.phone.valid === true ? 'has-success' : ''}`}>
            <label className="form-label">Phone Number</label>
            <div className="input-icon">
              <FiPhone />
              <input
                type="tel"
                name="register-phone"
                id="register-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                placeholder="Enter 10-digit phone number"
                className="form-input"
                maxLength={10}
                pattern="[0-9]{10}"
                required
                autoComplete="off"
                data-form-type="other"
              />
              {validation.phone.checking && <span className="validation-spinner"></span>}
              {!validation.phone.checking && validation.phone.valid === true && <FiCheck className="validation-icon success" />}
              {!validation.phone.checking && validation.phone.valid === false && <FiX className="validation-icon error" />}
            </div>
            {validation.phone.message && <span className="validation-message error">{validation.phone.message}</span>}
          </div>

          <div className={`form-group ${validation.password.valid === false ? 'has-error' : validation.password.valid === true ? 'has-success' : ''}`}>
            <label className="form-label">Password</label>
            <div className="input-icon">
              <FiLock />
              <input
                type={showPassword ? 'text' : 'password'}
                name="register-password"
                id="register-password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Create a password"
                className="form-input"
                minLength={8}
                required
                autoComplete="new-password"
                data-form-type="other"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {formData.password && (
              <div className="password-strength">
                <div className="strength-bar">
                  <div className={`strength-fill strength-${validation.password.strength}`}></div>
                </div>
                <span className={`strength-text strength-${validation.password.strength}`}>
                  {validation.password.strength === 0 && 'Too weak'}
                  {validation.password.strength === 1 && 'Weak'}
                  {validation.password.strength === 2 && 'Fair'}
                  {validation.password.strength === 3 && 'Good'}
                  {validation.password.strength === 4 && 'Strong'}
                </span>
              </div>
            )}
            {validation.password.message && <span className="validation-message hint">{validation.password.message}</span>}
          </div>

          <div className={`form-group ${validation.confirmPassword.valid === false ? 'has-error' : validation.confirmPassword.valid === true ? 'has-success' : ''}`}>
            <label className="form-label">Confirm Password</label>
            <div className="input-icon">
              <FiLock />
              <input
                type={showPassword ? 'text' : 'password'}
                name="register-confirm-password"
                id="register-confirm-password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Confirm your password"
                className="form-input"
                minLength={8}
                required
                autoComplete="new-password"
                data-form-type="other"
              />
              {validation.confirmPassword.valid === true && <FiCheck className="validation-icon success" />}
              {validation.confirmPassword.valid === false && <FiX className="validation-icon error" />}
            </div>
            {validation.confirmPassword.message && <span className="validation-message error">{validation.confirmPassword.message}</span>}
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-lg auth-submit"
            disabled={loading || !validation.name.valid || !validation.email.valid || !validation.phone.valid || !validation.password.valid || !validation.confirmPassword.valid}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
