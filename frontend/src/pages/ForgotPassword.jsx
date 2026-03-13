import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiArrowLeft, FiCheck, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import authService from '../services/authService';
import Logo from '../components/common/Logo';
import toast from 'react-hot-toast';
import './Auth.css';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Verify Email, 2: Reset Password
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Step 1: Verify Email
  const handleVerifyEmail = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      await authService.verifyEmailForReset(email);
      setStep(2);
      toast.success('Email verified successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Email verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await authService.directResetPassword(email, password);
      toast.success('Password updated successfully');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-overlay"></div>
      <div className="auth-container">
        <div className="auth-header">
          <Link to="/" className="auth-logo">
            <Logo className="logo-img" />
            <span>Selvi Enterprise</span>
          </Link>
          <h1>{step === 1 ? 'Forgot Password?' : 'Reset Password'}</h1>
          <p>
            {step === 1
              ? "Verify your account to create a new password."
              : "Identity confirmed. Please choose a strong new password."}
          </p>
        </div>

        {step === 1 ? (
          /* Step 1: Email Verification Form */
          <form onSubmit={handleVerifyEmail} className="auth-form">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-icon">
                <FiMail />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your registered email"
                  className="form-input"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="auth-note">
              <p>
                <strong>Note:</strong> We will verify your account existence before allowing a direct password reset.
              </p>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg auth-submit"
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>
        ) : (
          /* Step 2: Password Reset Form */
          <form onSubmit={handleResetPassword} className="auth-form">
            <div className="form-group">
              <label className="form-label">New Password</label>
              <div className="input-icon">
                <FiLock />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="form-input"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <div className="input-icon">
                <FiLock />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your new password"
                  className="form-input"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg auth-submit"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Reset Password'}
            </button>

            <button
              type="button"
              className="link-button"
              style={{ alignSelf: 'center', marginTop: '0.5rem', fontSize: '0.85rem' }}
              onClick={() => setStep(1)}
            >
              Wait, wrong email? Go back.
            </button>
          </form>
        )}

        <div className="auth-footer">
          <p>
            <Link to="/login" className="back-link">
              <FiArrowLeft /> Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

