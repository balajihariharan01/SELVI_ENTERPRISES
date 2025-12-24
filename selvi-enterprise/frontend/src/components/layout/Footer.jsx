import { Link } from 'react-router-dom';
import { FiPhone, FiMail, FiMapPin } from 'react-icons/fi';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          {/* Company Info */}
          <div className="footer-section">
            <div className="footer-logo">
              <img src="/logo.png" alt="Selvi Enterprise" className="logo-img" />
              <span>Selvi Enterprise</span>
            </div>
            <p className="footer-desc">
              Your trusted partner for quality steel and cement materials. 
              Serving the construction industry with excellence since establishment.
            </p>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/products">Products</Link></li>
              <li><Link to="/products?category=cement">Cement</Link></li>
              <li><Link to="/products?category=steel">Steel</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="footer-section">
            <h4>Customer Service</h4>
            <ul className="footer-links">
              <li><Link to="/my-orders">Track Order</Link></li>
              <li><Link to="/profile">My Account</Link></li>
              <li><Link to="/cart">Shopping Cart</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer-section">
            <h4>Contact Us</h4>
            <ul className="contact-info">
              <li>
                <FiMapPin />
                <span>123 Main Street, Chennai, Tamil Nadu 600001</span>
              </li>
              <li>
                <FiPhone />
                <span>+91 98765 43210</span>
              </li>
              <li>
                <FiMail />
                <span>info@selvienterprises.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Selvi Enterprise. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
