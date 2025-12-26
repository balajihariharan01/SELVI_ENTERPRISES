import { Link, useNavigate } from 'react-router-dom';
import { FiTruck, FiShield, FiClock, FiArrowRight, FiPhone, FiMail, FiMapPin } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { useState, useEffect } from 'react';
import productService from '../services/productService';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { BUSINESS_CONFIG, getWhatsAppGeneralLink } from '../config/businessConfig';
import './Home.css';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const response = await productService.getProducts({ inStock: 'true' });
      setFeaturedProducts(response.products.slice(0, 4));
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1>Quality Steel & Cement for Your Construction Needs</h1>
            <p>
              {BUSINESS_CONFIG.name} is your trusted partner for premium construction materials. 
              We provide the best brands at competitive prices with reliable delivery.
            </p>
            <div className="hero-buttons">
              <Link to="/products" className="btn btn-primary btn-lg">
                Browse Products
                <FiArrowRight />
              </Link>
              <Link to="/products?category=cement" className="btn btn-outline btn-lg">
                View Cement
              </Link>
            </div>
          </div>
          <div className="hero-image">
            <img 
              src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=400&fit=crop" 
              alt="Construction Materials"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <FiTruck />
              </div>
              <h3>Fast Delivery</h3>
              <p>Quick and reliable delivery to your construction site</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <FiShield />
              </div>
              <h3>Quality Assured</h3>
              <p>Only genuine products from trusted brands</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <FiClock />
              </div>
              <h3>24/7 Support</h3>
              <p>Always available to assist with your orders</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories">
        <div className="container">
          <div className="section-header">
            <h2>Our Products</h2>
            <p>Choose from our range of quality construction materials</p>
          </div>
          <div className="category-cards">
            <div 
              className="category-card cement"
              onClick={() => navigate('/products?category=cement')}
            >
              <div className="category-content">
                <h3>Cement</h3>
                <p>Premium cement from top brands like UltraTech, ACC, Ambuja</p>
                <span className="category-link">
                  Shop Now <FiArrowRight />
                </span>
              </div>
            </div>
            <div 
              className="category-card steel"
              onClick={() => navigate('/products?category=steel')}
            >
              <div className="category-content">
                <h3>Steel</h3>
                <p>High-quality TMT bars from TATA, JSW, SAIL and more</p>
                <span className="category-link">
                  Shop Now <FiArrowRight />
                </span>
              </div>
            </div>
          </div>
          {/* Others Category */}
          <div className="category-others">
            <div 
              className="category-item-large"
              onClick={() => navigate('/products?category=others')}
            >
              <span className="category-icon">📦</span>
              <div className="category-text">
                <span className="category-name">Other Materials</span>
                <span className="category-desc">Additional construction materials</span>
              </div>
              <FiArrowRight className="arrow-icon" />
            </div>
            <div 
              className="category-item-large view-all"
              onClick={() => navigate('/products')}
            >
              <span className="category-icon">🏗️</span>
              <div className="category-text">
                <span className="category-name">View All Products</span>
                <span className="category-desc">Browse our complete catalog</span>
              </div>
              <FiArrowRight className="arrow-icon" />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-products">
        <div className="container">
          <div className="section-header">
            <h2>Featured Products</h2>
            <Link to="/products" className="view-all">
              View All Products <FiArrowRight />
            </Link>
          </div>
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : (
            <div className="products-grid">
              {featuredProducts.map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section className="contact-section">
        <div className="container">
          <div className="section-header">
            <h2>Contact Us</h2>
            <p>Get in touch with us for bulk orders and inquiries</p>
          </div>
          <div className="contact-grid">
            {/* Phone Card */}
            <div className="contact-card">
              <div className="contact-icon">
                <FiPhone />
              </div>
              <div className="contact-info">
                <h3>Phone</h3>
                <div className="contact-details">
                  {BUSINESS_CONFIG.owners.map((owner, index) => (
                    <div key={index} className="owner-contact">
                      <span className="owner-name">{owner.name}</span>
                      <a href={`tel:${owner.phone?.replace(/\s/g, '')}`} className="phone-link">
                        {owner.phone}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* WhatsApp Card */}
            <div className="contact-card">
              <div className="contact-icon whatsapp">
                <FaWhatsapp />
              </div>
              <div className="contact-info">
                <h3>WhatsApp</h3>
                <p className="contact-desc">Quick inquiry via WhatsApp</p>
                <a 
                  href={getWhatsAppGeneralLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-whatsapp"
                >
                  <FaWhatsapp /> Chat Now
                </a>
              </div>
            </div>

            {/* Email Card */}
            <div className="contact-card">
              <div className="contact-icon email">
                <FiMail />
              </div>
              <div className="contact-info">
                <h3>Email</h3>
                <p className="contact-desc">Send us your inquiries</p>
                <a href={`mailto:${BUSINESS_CONFIG.contact.email}`} className="email-link">
                  {BUSINESS_CONFIG.contact.email}
                </a>
              </div>
            </div>

            {/* Location Card */}
            <div className="contact-card location-card">
              <div className="contact-icon location">
                <FiMapPin />
              </div>
              <div className="contact-info">
                <h3>Location</h3>
                <div className="address-text">
                  {BUSINESS_CONFIG.location.addressLines?.map((line, index) => (
                    <span key={index} className="address-line">{line}</span>
                  )) || <span>{BUSINESS_CONFIG.location.fullAddress}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Google Map Embed - Full Width Below Contact Cards */}
          
        </div>
      </section>

      {/* CTA Section - Only show if not logged in */}
      {!isAuthenticated && (
        <section className="cta">
          <div className="container">
            <div className="cta-content">
              <h2>Ready to Start Your Project?</h2>
              <p>Get the best prices on quality construction materials from {BUSINESS_CONFIG.name}</p>
              <Link to="/register" className="btn btn-primary btn-lg">
                Create Account
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
