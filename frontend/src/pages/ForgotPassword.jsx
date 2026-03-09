import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiArrowLeft, FiCheck } from 'react-icons/fi';
import authService from '../services/authService';
import Logo from '../components/common/Logo';
import toast from 'react-hot-toast';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      await authService.forgotPassword(email);
      setSubmitted(true);
      toast.success('Password reset instructions sent to your email');
    } catch (error) {
      // Handle Google user error specifically
      if (error.response?.data?.message?.includes('Google login')) {
        toast.error(error.response.data.message);
      } else {
        // Generic success message to prevent email enumeration
        setSubmitted(true);
        toast.success('If an account exists, reset instructions have been sent');
      }
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-header">
            <div className="success-icon">
              <FiCheck size={40} />
            </div>
            <h1>Check Your Email</h1>
            <p>
              We've sent password reset instructions to <strong>{email}</strong>
            </p>
          </div>

          <div className="auth-info-box">
            <h4>What's next?</h4>
            <ul>
              <li>Check your email inbox (and spam folder)</li>
              <li>Click the reset link in the email</li>
              <li>The link expires in 15 minutes</li>
              <li>Create a new secure password</li>
            </ul>
          </div>

          <div className="auth-footer">
            <p>
              Didn't receive the email?{' '}
              <button 
                onClick={() => setSubmitted(false)} 
                className="link-button"
              >
                Try again
              </button>
            </p>
            <p style={{ marginTop: '1rem' }}>
              <Link to="/login" className="back-link">
                <FiArrowLeft /> Back to Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <Link to="/" className="auth-logo">
            <Logo className="logo-img" />
            <span>Selvi Enterprise</span>
          </Link>
          <h1>Forgot Password?</h1>
          <p>No worries! Enter your email and we'll send you reset instructions.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
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
              <strong>Note:</strong> If you signed up using Google, please use the 
              "Continue with Google" option on the login page instead.
            </p>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary btn-lg auth-submit"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

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
