import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiTruck, FiShield, FiClock, FiArrowRight, FiPhone, FiMail, FiMapPin } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { useState, useEffect, useCallback } from 'react';
import productService from '../services/productService';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { BUSINESS_CONFIG, getWhatsAppGeneralLink } from '../config/businessConfig';
import { PageTransition } from '../components/animations';
import './Home.css';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const fetchFeaturedProducts = useCallback(async () => {
    try {
      const response = await productService.getProducts({ inStock: 'true' });
      setFeaturedProducts(response.products.slice(0, 4));
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeaturedProducts();
  }, [fetchFeaturedProducts]);

  return (
    <PageTransition className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <motion.div
            className="hero-content"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          >
            <h1>Quality Steel & Cement for Your Construction Needs</h1>
            <p>
              {BUSINESS_CONFIG.name} is your trusted partner for premium construction materials.
              We provide the best brands at competitive prices with reliable delivery.
            </p>
            <div className="hero-buttons">
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Link to="/products" className="btn btn-primary btn-lg">
                  Browse Products
                  <FiArrowRight />
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Link to="/products?category=cement" className="btn btn-outline btn-lg">
                  View Cement
                </Link>
              </motion.div>
            </div>
          </motion.div>
          <motion.div
            className="hero-image"
            initial={{ opacity: 0, x: 30, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            <img
              src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=400&fit=crop"
              alt="Construction Materials"
            />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <div className="features-grid">
            {[
              { icon: <FiTruck />, title: 'Fast Delivery', desc: 'Quick and reliable delivery to your construction site' },
              { icon: <FiShield />, title: 'Quality Assured', desc: 'Only genuine products from trusted brands' },
              { icon: <FiClock />, title: '24/7 Support', desc: 'Always available to assist with your orders' },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                className="feature-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <div className="feature-icon">
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <h2>Our Products</h2>
            <p>Choose from our range of quality construction materials</p>
          </motion.div>
          <div className="category-cards">
            <motion.div
              className="category-card cement"
              onClick={() => navigate('/products?category=cement')}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="category-content">
                <h3>Cement</h3>
                <p>Premium cement from top brands like UltraTech, ACC, Ambuja</p>
                <span className="category-link">
                  Shop Now <FiArrowRight />
                </span>
              </div>
            </motion.div>
            <motion.div
              className="category-card steel"
              onClick={() => navigate('/products?category=steel')}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 }}
              whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="category-content">
                <h3>Steel</h3>
                <p>High-quality TMT bars from TATA, JSW, SAIL and more</p>
                <span className="category-link">
                  Shop Now <FiArrowRight />
                </span>
              </div>
            </motion.div>
          </div>
          {/* Others Category */}
          <div className="category-others">
            <motion.div
              className="category-item-large"
              onClick={() => navigate('/products?category=others')}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="category-icon">📦</span>
              <div className="category-text">
                <span className="category-name">Other Materials</span>
                <span className="category-desc">Additional construction materials</span>
              </div>
              <FiArrowRight className="arrow-icon" />
            </motion.div>
            <motion.div
              className="category-item-large view-all"
              onClick={() => navigate('/products')}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.4 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="category-icon">🏗️</span>
              <div className="category-text">
                <span className="category-name">View All Products</span>
                <span className="category-desc">Browse our complete catalog</span>
              </div>
              <FiArrowRight className="arrow-icon" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-products">
        <div className="container">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
          >
            <h2>Featured Products</h2>
            <Link to="/products" className="view-all">
              View All Products <FiArrowRight />
            </Link>
          </motion.div>
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          ) : (
            <div className="products-grid">
              {featuredProducts.map((product, index) => (
                <ProductCard key={product._id} product={product} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>


      {/* Google Map Embed - Full Width Below Contact Cards */}



      {/* CTA Section - Only show if not logged in */}
      {!isAuthenticated && (
        <motion.section
          className="cta"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="container">
            <div className="cta-content">
              <h2>Ready to Start Your Project?</h2>
              <p>Get the best prices on quality construction materials from {BUSINESS_CONFIG.name}</p>
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Link to="/register" className="btn btn-primary btn-lg">
                  Create Account
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.section>
      )}
    </PageTransition>
  );
};

export default Home;
