import { useState, useEffect, useRef } from 'react';
import { FiSend, FiUser, FiMail, FiPhone, FiMessageSquare, FiMapPin, FiClock, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { FaWhatsapp, FaBuilding } from 'react-icons/fa';
import { BUSINESS_CONFIG, getWhatsAppLink } from '../config/businessConfig';
import contactService from '../services/contactService';
import toast from 'react-hot-toast';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  const observerRef = useRef(null);

  useEffect(() => {
    // Intersection Observer for scroll animations
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const animatedElements = document.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach((el) => observerRef.current.observe(el));

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid 10-digit phone number';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      await contactService.sendContactMessage(formData);
      setSubmitted(true);
      toast.success('Message sent successfully! We will get back to you soon.');
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: ''
        });
        setSubmitted(false);
      }, 3000);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(error.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page">
      {/* Hero Section */}
      <section className="contact-hero">
        <div className="hero-background">
          <div className="hero-pattern"></div>
        </div>
        <div className="hero-content">
          <div className="hero-badge">
            <FaBuilding /> Contact Us
          </div>
          <h1 className="hero-title">
            Get in Touch <span>With Us</span>
          </h1>
          <p className="hero-subtitle">
            Have questions about our products or services? We're here to help you with your construction material needs.
          </p>
        </div>
      </section>

      {/* Main Contact Section */}
      <section className="contact-main">
        <div className="container">
          <div className="contact-grid">
            {/* Contact Form */}
            <div className="contact-form-wrapper animate-on-scroll">
              <div className="form-header">
                <h2 className="form-title">Send Us a Message</h2>
                <p className="form-subtitle">Fill out the form below and we'll get back to you as soon as possible.</p>
              </div>

              {submitted ? (
                <div className="success-message">
                  <div className="success-icon">
                    <FiCheck />
                  </div>
                  <h3>Message Sent!</h3>
                  <p>Thank you for reaching out. We'll respond to your inquiry within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="contact-form">
                  <div className="form-row">
                    <div className={`form-group ${errors.name ? 'has-error' : ''}`}>
                      <label className="form-label">
                        <FiUser className="label-icon" />
                        Full Name <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                        className="form-input"
                      />
                      {errors.name && (
                        <span className="error-message">
                          <FiAlertCircle /> {errors.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="form-row two-cols">
                    <div className={`form-group ${errors.email ? 'has-error' : ''}`}>
                      <label className="form-label">
                        <FiMail className="label-icon" />
                        Email Address <span className="required">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="your@email.com"
                        className="form-input"
                      />
                      {errors.email && (
                        <span className="error-message">
                          <FiAlertCircle /> {errors.email}
                        </span>
                      )}
                    </div>

                    <div className={`form-group ${errors.phone ? 'has-error' : ''}`}>
                      <label className="form-label">
                        <FiPhone className="label-icon" />
                        Phone Number <span className="required">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="10-digit number"
                        className="form-input"
                      />
                      {errors.phone && (
                        <span className="error-message">
                          <FiAlertCircle /> {errors.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">
                        <FiMessageSquare className="label-icon" />
                        Subject (Optional)
                      </label>
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="e.g., Bulk Order Inquiry"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className={`form-group ${errors.message ? 'has-error' : ''}`}>
                      <label className="form-label">
                        <FiMessageSquare className="label-icon" />
                        Your Message <span className="required">*</span>
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Tell us about your requirements, questions, or feedback..."
                        className="form-textarea"
                        rows="5"
                      ></textarea>
                      {errors.message && (
                        <span className="error-message">
                          <FiAlertCircle /> {errors.message}
                        </span>
                      )}
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className={`submit-btn ${loading ? 'loading' : ''}`}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="btn-spinner"></span>
                        Sending...
                      </>
                    ) : (
                      <>
                        <FiSend /> Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Contact Information */}
            <div className="contact-info-wrapper animate-on-scroll">
              <div className="info-card address-card">
                <div className="info-icon">
                  <FiMapPin />
                </div>
                <h3 className="info-title">Visit Our Store</h3>
                <div className="info-content">
                  <p className="store-name">{BUSINESS_CONFIG.name}</p>
                  <p>{BUSINESS_CONFIG.location.landmark}</p>
                  <p>{BUSINESS_CONFIG.location.street}</p>
                  <p>{BUSINESS_CONFIG.location.city} - {BUSINESS_CONFIG.location.pincode}</p>
                  <p>{BUSINESS_CONFIG.location.state}, India</p>
                </div>
                <a 
                  href={BUSINESS_CONFIG.location.googleMapsUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="info-link"
                >
                  View on Google Maps →
                </a>
              </div>

              <div className="info-card phone-card">
                <div className="info-icon">
                  <FiPhone />
                </div>
                <h3 className="info-title">Call Us</h3>
                <div className="info-content">
                  {BUSINESS_CONFIG.contact.phones.map((phone, index) => (
                    <a 
                      key={index} 
                      href={`tel:${phone.replace(/\s/g, '')}`} 
                      className="phone-link"
                    >
                      {phone}
                    </a>
                  ))}
                </div>
              </div>

              <div className="info-card email-card">
                <div className="info-icon">
                  <FiMail />
                </div>
                <h3 className="info-title">Email Us</h3>
                <div className="info-content">
                  <a 
                    href={`mailto:${BUSINESS_CONFIG.contact.email}`} 
                    className="email-link"
                  >
                    {BUSINESS_CONFIG.contact.email}
                  </a>
                </div>
              </div>

              <div className="info-card whatsapp-card">
                <div className="info-icon whatsapp">
                  <FaWhatsapp />
                </div>
                <h3 className="info-title">WhatsApp</h3>
                <div className="info-content">
                  <p>Quick response guaranteed!</p>
                  <a 
                    href={getWhatsAppLink('Hi, I would like to inquire about your products.')} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="whatsapp-btn"
                  >
                    <FaWhatsapp /> Chat on WhatsApp
                  </a>
                </div>
              </div>

              <div className="info-card hours-card">
                <div className="info-icon">
                  <FiClock />
                </div>
                <h3 className="info-title">Business Hours</h3>
                <div>
                  <div>
                    <span>Monday - Saturday </span>
                    <span> { "   " + BUSINESS_CONFIG.businessHours.weekdays}</span>
                  </div>
                  
                  <div className="hours-row">
                    <span>Sunday</span>
                    <span>Holiday</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="map-section animate-on-scroll">
        <div className="container">
          <div className="map-wrapper">
            <iframe
              src={BUSINESS_CONFIG.location.googleMapsEmbed}
              width="100%"
              height="400"
              style={{ border: 0, borderRadius: '16px' }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Selvi Enterprise Location"
            ></iframe>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
