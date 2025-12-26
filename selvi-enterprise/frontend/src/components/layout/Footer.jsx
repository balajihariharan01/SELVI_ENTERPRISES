import { Link } from 'react-router-dom';
import { FiPhone, FiMail, FiMapPin, FiExternalLink } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
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
                <img src="/logo.png" alt={BUSINESS_CONFIG.name} className="brand-logo" />
                <div className="brand-name">{BUSINESS_CONFIG.fullName}</div>
              </div>
              <p className="brand-desc">{BUSINESS_CONFIG.description}</p>
              <p className="brand-owners">
                <span className="owners-label">Owners:</span> {BUSINESS_CONFIG.owners.map(o => o.name).join(', ')}
              </p>
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
                <FiMapPin className="contact-icon" />
                <div className="contact-details">
                  <span>Opposite to Eye Foundation,</span>
                  <span>Coonoor Main Road,</span>
                  <span>Ooty – 643001, Tamil Nadu</span>
                </div>
              </li>
              <li className="contact-row">
                <FiPhone className="contact-icon" />
                <div className="contact-details">
                  <a href={`tel:${BUSINESS_CONFIG.contact.phone1.replace(/\s/g, '')}`}>
                    {BUSINESS_CONFIG.contact.phone1}
                  </a>
                  <a href={`tel:${BUSINESS_CONFIG.contact.phone2.replace(/\s/g, '')}`}>
                    {BUSINESS_CONFIG.contact.phone2}
                  </a>
                </div>
              </li>
              <li className="contact-row">
                <FiMail className="contact-icon" />
                <a href={`mailto:${BUSINESS_CONFIG.contact.email}`} className="email-link">
                  {BUSINESS_CONFIG.contact.email}
                </a>
              </li>
              <li className="contact-row whatsapp-row">
                <FaWhatsapp className="contact-icon whatsapp-icon" />
                <a 
                  href={getWhatsAppGeneralLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {BUSINESS_CONFIG.contact.whatsappDisplay}
                </a>
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
                <FiExternalLink className="external-icon" />
                <span>Open in Google Maps</span>
              </a>
            </div>
          </div>
        </div>

        {/* Payment & Copyright */}
        <div className="footer-bottom-section">
          <div className="payment-info">
            <span className="payment-label">UPI ID:</span>
            <span className="payment-value">{BUSINESS_CONFIG.payment.upiId}</span>
          </div>
          <div className="copyright">
            &copy; {new Date().getFullYear()} {BUSINESS_CONFIG.name}. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
