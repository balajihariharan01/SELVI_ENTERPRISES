import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiCheckCircle, FiXCircle, FiLoader, FiMail, FiArrowLeft } from 'react-icons/fi';
import authService from '../services/authService';
import toast from 'react-hot-toast';
import './Auth.css';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link');
        return;
      }

      try {
        const response = await authService.verifyEmail(token);
        setStatus('success');
        setMessage(response.message || 'Email verified successfully!');
        toast.success('Email verified successfully!');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Email verification failed');
        toast.error(error.response?.data?.message || 'Email verification failed');
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="auth-page">
      <div className="auth-container" style={{ textAlign: 'center' }}>
        {status === 'verifying' && (
          <>
            <div className="verification-icon loading">
              <FiLoader className="spin" />
            </div>
            <h1 style={{ marginBottom: '0.5rem' }}>Verifying Email</h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              Please wait while we verify your email address...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="verification-icon success">
              <FiCheckCircle />
            </div>
            <h1 style={{ marginBottom: '0.5rem', color: '#22c55e' }}>Email Verified!</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              {message}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Redirecting to login page in 3 seconds...
            </p>
            <Link to="/login" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Go to Login
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="verification-icon error">
              <FiXCircle />
            </div>
            <h1 style={{ marginBottom: '0.5rem', color: '#ef4444' }}>Verification Failed</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              {message}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link to="/login" className="btn btn-primary">
                <FiMail /> Login & Resend Verification
              </Link>
              <Link to="/" className="back-link" style={{ justifyContent: 'center' }}>
                <FiArrowLeft /> Back to Home
              </Link>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .verification-icon {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          font-size: 3rem;
        }
        
        .verification-icon.loading {
          background: linear-gradient(135deg, var(--primary-50), var(--primary-100));
          color: var(--primary);
        }
        
        .verification-icon.success {
          background: linear-gradient(135deg, #dcfce7, #bbf7d0);
          color: #22c55e;
        }
        
        .verification-icon.error {
          background: linear-gradient(135deg, #fef2f2, #fecaca);
          color: #ef4444;
        }
        
        .verification-icon .spin {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default VerifyEmail;
