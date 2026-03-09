import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiShoppingCart, FiUser, FiMenu, FiX, FiHome, FiPackage, FiClipboard, FiGrid, FiLogOut, FiInfo, FiPhone, FiChevronDown } from 'react-icons/fi';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { BUSINESS_CONFIG } from '../../config/businessConfig';
import Logo from '../common/Logo';
import './Navbar.css';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const { getCartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Refs for click-outside detection
  const dropdownRef = useRef(null);
  const dropdownBtnRef = useRef(null);

  // Close dropdown when route changes (after navigation completes)
  useEffect(() => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Don't close if clicking inside dropdown or on the toggle button
      if (
        dropdownRef.current?.contains(event.target) ||
        dropdownBtnRef.current?.contains(event.target)
      ) {
        return;
      }
      setDropdownOpen(false);
    };

    // Use mousedown instead of click to catch the event earlier
    // but only close on the next tick to allow click events to complete
    const handleMouseDown = (event) => {
      // Check if click is outside dropdown area
      if (
        !dropdownRef.current?.contains(event.target) &&
        !dropdownBtnRef.current?.contains(event.target)
      ) {
        // Use requestAnimationFrame to delay closing until after click completes
        requestAnimationFrame(() => {
          setDropdownOpen(false);
        });
      }
    };

    if (dropdownOpen) {
      // Add listener with a small delay to prevent immediate closing
      const timeoutId = setTimeout(() => {
        document.addEventListener('mousedown', handleMouseDown);
      }, 0);
      
      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('mousedown', handleMouseDown);
      };
    }
  }, [dropdownOpen]);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [dropdownOpen]);

  // Toggle dropdown
  const toggleDropdown = useCallback((e) => {
    e.stopPropagation();
    setDropdownOpen(prev => !prev);
  }, []);

  // Handle dropdown item click - navigate then close
  const handleDropdownItemClick = useCallback((path) => {
    // Navigate first
    navigate(path);
    // Dropdown will close via the location.pathname useEffect
  }, [navigate]);

  const handleLogout = useCallback(() => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    logout();
    navigate('/');
  }, [logout, navigate]);

  const cartCount = getCartCount();

  return (
    <header className="navbar">
      <div className="container">
        <div className="navbar-content">
          {/* Logo */}
          <Link to="/" className="navbar-logo">
            <Logo className="logo-img" />
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
            <Link to="/about" className="nav-link">
              <FiInfo className="nav-icon" />
              <span>About</span>
            </Link>
            <Link to="/contact" className="nav-link">
              <FiPhone className="nav-icon" />
              <span>Contact</span>
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
                
                <div className={`user-dropdown ${dropdownOpen ? 'is-open' : ''}`} ref={dropdownRef}>
                  <button 
                    className="user-btn" 
                    onClick={toggleDropdown}
                    ref={dropdownBtnRef}
                    aria-expanded={dropdownOpen}
                    aria-haspopup="true"
                  >
                    <FiUser size={20} />
                    <span>{user?.name?.split(' ')[0]}</span>
                    <FiChevronDown 
                      size={16} 
                      className={`dropdown-chevron ${dropdownOpen ? 'rotated' : ''}`}
                    />
                  </button>
                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div 
                        className="dropdown-menu"
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                      >
                        {isAdmin ? (
                          <button 
                            onClick={() => handleDropdownItemClick('/admin')} 
                            className="dropdown-item"
                          >
                            <FiGrid className="dropdown-icon" />
                            <span>Dashboard</span>
                          </button>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleDropdownItemClick('/profile')} 
                              className="dropdown-item"
                            >
                              <FiUser className="dropdown-icon" />
                              <span>Profile</span>
                            </button>
                            <button 
                              onClick={() => handleDropdownItemClick('/my-orders')} 
                              className="dropdown-item"
                            >
                              <FiClipboard className="dropdown-icon" />
                              <span>My Orders</span>
                            </button>
                          </>
                        )}
                        <button onClick={handleLogout} className="dropdown-item logout">
                          <FiLogOut className="dropdown-icon" />
                          <span>Logout</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <motion.button 
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              whileTap={{ scale: 0.9 }}
            >
              <AnimatePresence mode="wait">
                {mobileMenuOpen ? (
                  <motion.span
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <FiX size={24} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    <FiMenu size={24} />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              className="mobile-menu"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            >
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Link to="/" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                  <FiHome className="mobile-icon" />
                  <span>Home</span>
                </Link>
                <Link to="/products" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                  <FiPackage className="mobile-icon" />
                  <span>Products</span>
                </Link>
                <Link to="/about" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                  <FiInfo className="mobile-icon" />
                  <span>About Us</span>
                </Link>
                <Link to="/contact" className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                  <FiPhone className="mobile-icon" />
                  <span>Contact Us</span>
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
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};

export default Navbar;
