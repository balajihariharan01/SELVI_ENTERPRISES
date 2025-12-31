import { Link } from 'react-router-dom';
import { FiPhone, FiMail, FiMapPin, FiNavigation } from 'react-icons/fi';
import { FaWhatsapp, FaBuilding } from 'react-icons/fa';
import { BUSINESS_CONFIG, getWhatsAppGeneralLink } from '../../config/businessConfig';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Column 1: Brand / Company Info */}
          <div className="footer-col">
            <div className="brand-section">
              <div className="brand-header">
                <div className="brand-logo">
                  <FaBuilding size={20} color="#fff" />
                </div>
                <div className="brand-name-wrapper">
                  <span className="brand-name">{BUSINESS_CONFIG.name}</span>
                  <span className="brand-tagline">Building Materials</span>
                </div>
              </div>
              <p className="brand-desc">{BUSINESS_CONFIG.description}</p>
              <div className="brand-owners">
                {BUSINESS_CONFIG.owners.map((owner, index) => (
                  <div className="owner-item" key={index}>
                    <div className="owner-badge">{owner.name.charAt(0)}</div>
                    <div className="owner-details">
                      <span className="owner-name">{owner.name}</span>
                      <span className="owner-role">Proprietor</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="footer-col">
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="footer-list">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/products">Products</Link></li>
              <li><Link to="/products?category=cement">Cement</Link></li>
              <li><Link to="/products?category=steel">Steel</Link></li>
              <li><Link to="/my-orders">Track Order</Link></li>
              <li><Link to="/cart">Shopping Cart</Link></li>
            </ul>
          </div>

          {/* Column 3: Contact Details */}
          <div className="footer-col">
            <h4 className="footer-heading">Contact Us</h4>
            <ul className="contact-list">
              <li className="contact-row">
                <span className="contact-icon">
                  <FiMapPin size={14} />
                </span>
                <div className="contact-details">
                  <span className="contact-label">Address</span>
                  <span className="address-text">
                    Opposite to Eye Foundation,<br />
                    Coonoor Main Road,<br />
                    Ooty – 643001, Tamil Nadu
                  </span>
                </div>
              </li>
              <li className="contact-row">
                <span className="contact-icon">
                  <FiPhone size={14} />
                </span>
                <div className="contact-details">
                  <span className="contact-label">Phone</span>
                  <a href={`tel:${BUSINESS_CONFIG.contact.phone1.replace(/\s/g, '')}`}>
                    {BUSINESS_CONFIG.contact.phone1}
                  </a>
                  <a href={`tel:${BUSINESS_CONFIG.contact.phone2.replace(/\s/g, '')}`}>
                    {BUSINESS_CONFIG.contact.phone2}
                  </a>
                </div>
              </li>
              <li className="contact-row">
                <span className="contact-icon">
                  <FiMail size={14} />
                </span>
                <div className="contact-details">
                  <span className="contact-label">Email</span>
                  <a href={`mailto:${BUSINESS_CONFIG.contact.email}`} className="email-link">
                    {BUSINESS_CONFIG.contact.email}
                  </a>
                </div>
              </li>
              <li className="contact-row whatsapp-row">
                <span className="contact-icon">
                  <FaWhatsapp size={14} />
                </span>
                <div className="contact-details">
                  <span className="contact-label">WhatsApp</span>
                  <a 
                    href={getWhatsAppGeneralLink()}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {BUSINESS_CONFIG.contact.whatsappDisplay}
                  </a>
                </div>
              </li>
            </ul>
          </div>

          {/* Column 4: Map / Find Us */}
          <div className="footer-col">
            <h4 className="footer-heading">Find Us</h4>
            <div className="map-card">
              <div className="map-frame">
                <iframe
                  src={BUSINESS_CONFIG.location.googleMapsEmbed}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Selvi Enterprise Location"
                ></iframe>
              </div>
              <a 
                href={BUSINESS_CONFIG.location.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="map-external-link"
              >
                <FiNavigation size={12} />
                <span>Get Directions</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-section">
          <div className="payment-info">
            <span className="payment-icon">💳</span>
            <div className="payment-content">
              <span className="payment-label">UPI ID</span>
              <span className="payment-value">{BUSINESS_CONFIG.payment.upiId}</span>
            </div>
          </div>
          <div className="copyright">
            <p>&copy; {new Date().getFullYear()} {BUSINESS_CONFIG.name}. All rights reserved.</p>
            <p>Premium Building Materials Supplier</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
