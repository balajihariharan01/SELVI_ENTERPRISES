import { Link, useNavigate } from 'react-router-dom';
import { FiTruck, FiShield, FiClock, FiArrowRight, FiSearch, FiShoppingCart, FiPhone, FiMail, FiMapPin } from 'react-icons/fi';
import { useState, useEffect, useRef } from 'react';
import productService from '../services/productService';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './MobileHome.css';

const MobileHome = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { getCartCount } = useCart();

  // Section refs for smooth scrolling
  const homeRef = useRef(null);
  const productsRef = useRef(null);
  const contactRef = useRef(null);

  useEffect(() => {
    fetchAllProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [activeCategory, searchQuery, products]);

  const fetchAllProducts = async () => {
    try {
      const response = await productService.getProducts({ inStock: 'true' });
      setProducts(response.products);
      setFilteredProducts(response.products);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProducts = () => {
    let filtered = [...products];
    
    if (activeCategory !== 'all') {
      filtered = filtered.filter(p => p.category === activeCategory);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.productName.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query)
      );
    }
    
    setFilteredProducts(filtered);
  };

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const cartCount = getCartCount();

  return (
    <div className="mobile-spa">
      {/* Mobile Fixed Header */}
      <header className="mobile-header">
        <div className="mobile-header-content">
          <Link to="/" className="mobile-logo">
            <img src="/logo.png" alt="Selvi Enterprise" className="logo-img" />
            <span>Selvi Enterprise</span>
          </Link>
          <div className="mobile-header-actions">
            {isAuthenticated && (
              <Link to="/cart" className="mobile-cart-btn">
                <FiShoppingCart size={22} />
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </Link>
            )}
          </div>
        </div>
        
        {/* Mobile Navigation Tabs */}
        <nav className="mobile-nav-tabs">
          <button 
            className="nav-tab active"
            onClick={() => scrollToSection(homeRef)}
          >
            Home
          </button>
          <button 
            className="nav-tab"
            onClick={() => scrollToSection(productsRef)}
          >
            Products
          </button>
          <button 
            className="nav-tab"
            onClick={() => scrollToSection(contactRef)}
          >
            Contact
          </button>
          {isAuthenticated && (
            <Link to="/my-orders" className="nav-tab">Orders</Link>
          )}
        </nav>
      </header>

      {/* Main Content - Single Scrollable Page */}
      <main className="mobile-main">
        
        {/* Hero Section */}
        <section ref={homeRef} className="mobile-hero">
          <div className="hero-bg-pattern"></div>
          <div className="mobile-hero-content">
            <h1>Quality Steel & Cement</h1>
            <p>Your trusted partner for premium construction materials at best prices</p>
            <button 
              className="btn btn-primary btn-lg"
              onClick={() => scrollToSection(productsRef)}
            >
              Shop Now <FiArrowRight />
            </button>
          </div>
        </section>

        {/* Features Strip */}
        <section className="mobile-features">
          <div className="feature-strip">
            <div className="feature-item">
              <FiTruck className="feature-icon" />
              <span>Fast Delivery</span>
            </div>
            <div className="feature-item">
              <FiShield className="feature-icon" />
              <span>Quality Assured</span>
            </div>
            <div className="feature-item">
              <FiClock className="feature-icon" />
              <span>24/7 Support</span>
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section ref={productsRef} className="mobile-products-section">
          <div className="section-header">
            <h2>Our Products</h2>
            <p>Browse our collection of quality materials</p>
          </div>

          {/* Search Bar */}
          <div className="mobile-search">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Pills */}
          <div className="category-pills">
            <button 
              className={`pill ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              All
            </button>
            <button 
              className={`pill ${activeCategory === 'cement' ? 'active' : ''}`}
              onClick={() => setActiveCategory('cement')}
            >
              🧱 Cement
            </button>
            <button 
              className={`pill ${activeCategory === 'steel' ? 'active' : ''}`}
              onClick={() => setActiveCategory('steel')}
            >
              🔩 Steel
            </button>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <p>No products found</p>
            </div>
          ) : (
            <div className="mobile-products-grid">
              {filteredProducts.map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </section>

        {/* Contact Section */}
        <section ref={contactRef} className="mobile-contact-section">
          <div className="section-header">
            <h2>Contact Us</h2>
            <p>Get in touch for bulk orders & queries</p>
          </div>

          <div className="contact-cards">
            <a href="tel:+919876543210" className="contact-card">
              <FiPhone className="contact-icon" />
              <div className="contact-info">
                <span className="contact-label">Call Us</span>
                <span className="contact-value">+91 98765 43210</span>
              </div>
            </a>

            <a href="mailto:info@selvi.com" className="contact-card">
              <FiMail className="contact-icon" />
              <div className="contact-info">
                <span className="contact-label">Email</span>
                <span className="contact-value">info@selvi.com</span>
              </div>
            </a>

            <div className="contact-card">
              <FiMapPin className="contact-icon" />
              <div className="contact-info">
                <span className="contact-label">Address</span>
                <span className="contact-value">123 Main Street, Chennai</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions">
            <a href="https://wa.me/919876543210" className="whatsapp-btn">
              📱 WhatsApp Order
            </a>
          </div>
        </section>

        {/* CTA for Non-logged in users */}
        {!isAuthenticated && (
          <section className="mobile-cta">
            <h3>Ready to Order?</h3>
            <p>Create an account to start shopping</p>
            <div className="cta-buttons">
              <Link to="/register" className="btn btn-primary">Sign Up</Link>
              <Link to="/login" className="btn btn-outline">Login</Link>
            </div>
          </section>
        )}

        {/* User Quick Menu */}
        {isAuthenticated && (
          <section className="mobile-user-menu">
            <h3>Quick Access</h3>
            <div className="user-menu-grid">
              <Link to="/cart" className="menu-item">
                <FiShoppingCart />
                <span>Cart</span>
              </Link>
              <Link to="/my-orders" className="menu-item">
                <span>📦</span>
                <span>Orders</span>
              </Link>
              <Link to="/profile" className="menu-item">
                <span>👤</span>
                <span>Profile</span>
              </Link>
            </div>
          </section>
        )}

      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        <button onClick={() => scrollToSection(homeRef)} className="bottom-nav-item active">
          <span className="nav-icon">🏠</span>
          <span>Home</span>
        </button>
        <button onClick={() => scrollToSection(productsRef)} className="bottom-nav-item">
          <span className="nav-icon">📦</span>
          <span>Products</span>
        </button>
        {isAuthenticated ? (
          <>
            <Link to="/cart" className="bottom-nav-item">
              <span className="nav-icon">🛒</span>
              <span>Cart</span>
              {cartCount > 0 && <span className="nav-badge">{cartCount}</span>}
            </Link>
            <Link to="/profile" className="bottom-nav-item">
              <span className="nav-icon">👤</span>
              <span>Account</span>
            </Link>
          </>
        ) : (
          <>
            <Link to="/login" className="bottom-nav-item">
              <span className="nav-icon">🔑</span>
              <span>Login</span>
            </Link>
            <button onClick={() => scrollToSection(contactRef)} className="bottom-nav-item">
              <span className="nav-icon">📞</span>
              <span>Contact</span>
            </button>
          </>
        )}
      </nav>
    </div>
  );
};

export default MobileHome;
