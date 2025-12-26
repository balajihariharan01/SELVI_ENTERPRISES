import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

// Authorized admin email - must match backend
const AUTHORIZED_ADMIN_EMAIL = 'selvienterprises.ooty@gmail.com';

const AdminRoute = ({ children }) => {
  const { user, isAuthenticated, isAdmin, loading, logout } = useAuth();
  const location = useLocation();
  const [validating, setValidating] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Perform strict admin validation
    const validateAdminAccess = () => {
      if (loading) return;

      // Not authenticated - redirect to login
      if (!isAuthenticated || !user) {
        setIsAuthorized(false);
        setValidating(false);
        return;
      }

      // Check role
      if (user.role !== 'admin') {
        console.warn('Admin access denied: User role is not admin');
        toast.error('Access denied. Admin privileges required.');
        setIsAuthorized(false);
        setValidating(false);
        return;
      }

      // STRICT: Verify email matches authorized admin email
      if (user.email?.toLowerCase() !== AUTHORIZED_ADMIN_EMAIL.toLowerCase()) {
        console.warn(`Unauthorized admin access attempt by: ${user.email}`);
        toast.error('Unauthorized admin access. Your account is not authorized for admin access.');
        // Force logout for security
        logout();
        setIsAuthorized(false);
        setValidating(false);
        return;
      }

      // All checks passed
      setIsAuthorized(true);
      setValidating(false);
    };

    validateAdminAccess();
  }, [isAuthenticated, user, loading, isAdmin, logout]);

  // Show loading while checking auth
  if (loading || validating) {
    return (
      <div className="admin-loading">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Verifying admin access...</p>
        </div>
        <style>{`
          .admin-loading {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f8fafc;
          }
          .loading-container {
            text-align: center;
          }
          .loading-container p {
            margin-top: 1rem;
            color: #6b7280;
            font-size: 0.95rem;
          }
          .spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #e5e7eb;
            border-top-color: #3b82f6;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 0 auto;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Not authorized (role check failed or email doesn't match)
  if (!isAuthorized) {
    return (
      <div className="access-denied">
        <div className="access-denied-content">
          <div className="access-denied-icon">🚫</div>
          <h1>Access Denied</h1>
          <p>You do not have permission to access the admin area.</p>
          <p className="sub-text">If you believe this is an error, please contact the administrator.</p>
          <a href="/" className="btn-home">Return to Home</a>
        </div>
        <style>{`
          .access-denied {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
            padding: 2rem;
          }
          .access-denied-content {
            text-align: center;
            background: white;
            padding: 3rem;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
            max-width: 450px;
          }
          .access-denied-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
          }
          .access-denied-content h1 {
            font-size: 1.75rem;
            color: #991b1b;
            margin-bottom: 0.75rem;
          }
          .access-denied-content p {
            color: #6b7280;
            margin-bottom: 0.5rem;
          }
          .sub-text {
            font-size: 0.85rem;
            color: #9ca3af;
            margin-bottom: 1.5rem !important;
          }
          .btn-home {
            display: inline-block;
            padding: 0.75rem 2rem;
            background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            transition: all 0.2s ease;
          }
          .btn-home:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
          }
        `}</style>
      </div>
    );
  }

  return children;
};

export default AdminRoute;
