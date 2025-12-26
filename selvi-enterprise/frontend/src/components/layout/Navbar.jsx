import { Link, useNavigate } from 'react-router-dom';
import { FiShoppingCart, FiUser, FiMenu, FiX, FiHome, FiPackage, FiClipboard, FiGrid, FiLogOut } from 'react-icons/fi';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { BUSINESS_CONFIG } from '../../config/businessConfig';
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
            <img src="/logo.png" alt={BUSINESS_CONFIG.name} className="logo-img" />
            <span className="logo-text">{BUSINESS_CONFIG.name}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="navbar-nav">
            <Link to="/" className="nav-link">
              <FiHome className="nav-icon" />
              <span>Home</span>
            </Link>
            <Link to="/products" className="nav-link">
              <FiPackage className="nav-icon" />
              <span>Products</span>
            </Link>
            {isAuthenticated && !isAdmin && (
              <Link to="/my-orders" className="nav-link">
                <FiClipboard className="nav-icon" />
                <span>My Orders</span>
              </Link>
            )}
          </nav>

          {/* Right Actions */}
          <div className="navbar-actions">
            {isAuthenticated ? (
              <>
                {!isAdmin && (
                  <Link to="/cart" className="cart-btn" title="Shopping Cart">
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
                      <Link to="/admin" className="dropdown-item">
                        <FiGrid className="dropdown-icon" />
                        <span>Dashboard</span>
                      </Link>
                    ) : (
                      <>
                        <Link to="/profile" className="dropdown-item">
                          <FiUser className="dropdown-icon" />
                          <span>Profile</span>
                        </Link>
                        <Link to="/my-orders" className="dropdown-item">
                          <FiClipboard className="dropdown-icon" />
                          <span>My Orders</span>
                        </Link>
                      </>
                    )}
                    <button onClick={handleLogout} className="dropdown-item logout">
                      <FiLogOut className="dropdown-icon" />
                      <span>Logout</span>
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
              <FiHome className="mobile-icon" />
              <span>Home</span>
            </Link>
            <Link to="/products" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              <FiPackage className="mobile-icon" />
              <span>Products</span>
            </Link>
            {isAuthenticated ? (
              <>
                {!isAdmin && (
                  <>
                    <Link to="/cart" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                      <FiShoppingCart className="mobile-icon" />
                      <span>Cart ({cartCount})</span>
                    </Link>
                    <Link to="/my-orders" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                      <FiClipboard className="mobile-icon" />
                      <span>My Orders</span>
                    </Link>
                    <Link to="/profile" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                      <FiUser className="mobile-icon" />
                      <span>Profile</span>
                    </Link>
                  </>
                )}
                {isAdmin && (
                  <Link to="/admin" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                    <FiGrid className="mobile-icon" />
                    <span>Dashboard</span>
                  </Link>
                )}
                <button onClick={handleLogout} className="mobile-nav-link logout">
                  <FiLogOut className="mobile-icon" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                  <FiUser className="mobile-icon" />
                  <span>Login</span>
                </Link>
                <Link to="/register" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                  <FiUser className="mobile-icon" />
                  <span>Register</span>
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
