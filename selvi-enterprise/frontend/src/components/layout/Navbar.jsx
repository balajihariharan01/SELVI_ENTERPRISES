import { Link, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiUser, FiMenu, FiX } from 'react-icons/fi';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import './Navbar.css';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const { getCartCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const cartCount = getCartCount();

  return (
    <header className="navbar">
      <div className="container">
        <div className="navbar-content">
          {/* Logo */}
          <Link to="/" className="navbar-logo">
            <img src="/logo.png" alt="Selvi Enterprise" className="logo-img" />
            <span className="logo-text">Selvi Enterprise</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="navbar-nav">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/products" className="nav-link">Products</Link>
            {isAuthenticated && !isAdmin && (
              <Link to="/my-orders" className="nav-link">My Orders</Link>
            )}
          </nav>

          {/* Right Actions */}
          <div className="navbar-actions">
            {isAuthenticated ? (
              <>
                {!isAdmin && (
                  <Link to="/cart" className="cart-btn">
                    <FiShoppingCart size={22} />
                    {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
                  </Link>
                )}
                
                <div className="user-dropdown">
                  <button className="user-btn">
                    <FiUser size={20} />
                    <span>{user?.name?.split(' ')[0]}</span>
                  </button>
                  <div className="dropdown-menu">
                    {isAdmin ? (
                      <Link to="/admin" className="dropdown-item">Dashboard</Link>
                    ) : (
                      <>
                        <Link to="/profile" className="dropdown-item">Profile</Link>
                        <Link to="/my-orders" className="dropdown-item">My Orders</Link>
                      </>
                    )}
                    <button onClick={handleLogout} className="dropdown-item logout">
                      Logout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button 
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="mobile-menu">
            <Link to="/" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              Home
            </Link>
            <Link to="/products" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              Products
            </Link>
            {isAuthenticated ? (
              <>
                {!isAdmin && (
                  <>
                    <Link to="/cart" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                      Cart ({cartCount})
                    </Link>
                    <Link to="/my-orders" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                      My Orders
                    </Link>
                    <Link to="/profile" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                      Profile
                    </Link>
                  </>
                )}
                {isAdmin && (
                  <Link to="/admin" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                    Dashboard
                  </Link>
                )}
                <button onClick={handleLogout} className="mobile-nav-link logout">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                  Login
                </Link>
                <Link to="/register" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                  Register
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
