import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiSend, FiUser, FiMail, FiPhone, FiMessageSquare, FiMapPin, FiClock, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { FaWhatsapp, FaBuilding } from 'react-icons/fa';
import { BUSINESS_CONFIG, getWhatsAppLink } from '../config/businessConfig';
import contactService from '../services/contactService';
import { PageTransition } from '../components/animations';
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
    <PageTransition className="contact-page">
      {/* Hero Section */}
      <section className="contact-hero !relative !overflow-hidden !bg-slate-900 !py-32 max-md:!py-16">
        <div className="hero-background !absolute !inset-0 !opacity-10">
          <div className="hero-pattern !grid !grid-cols-12 !h-full !gap-1">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="!border-r !border-white/10" />
            ))}
          </div>
        </div>
        <motion.div
          className="container !relative !z-10 !text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="hero-badge !inline-flex !items-center !gap-3 !bg-blue-600 !text-white !px-6 !py-3 !rounded-full !text-xs !font-black !uppercase !tracking-widest !mb-10">
            <FaBuilding /> Global Support Nexus
          </div>
          <h1 className="hero-title !text-7xl !font-black !text-white !mb-8 !leading-none max-md:!text-4xl">
            Inbound <span className="!text-blue-500">Logistics.</span>
          </h1>
          <p className="hero-subtitle !text-slate-400 !text-xl !max-w-2xl !mx-auto !mb-16 max-md:!text-sm">
            Immediate technical deployment and material procurement assistance. Resolve your construction logistics queries with our executive support tier.
          </p>
        </motion.div>
      </section>

      {/* Main Contact Section */}
      <section className="contact-main">
        <div className="container">
          <div className="contact-grid">
            {/* Contact Form */}
            <motion.div
              className="contact-form-wrapper !bg-white !p-12 !rounded-[2.5rem] !shadow-2xl !border !border-slate-100 max-md:!p-6 animate-on-scroll"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <div className="form-header !mb-10">
                <h2 className="form-title !text-3xl !font-black !text-slate-900 !mb-4">Transmission Matrix</h2>
                <p className="form-subtitle !text-slate-500 !text-sm">Initiate an encrypted inquiry thread with our support collective.</p>
              </div>

              {submitted ? (
                <div className="success-message !text-center !py-12">
                  <div className="success-icon !w-20 !h-20 !bg-emerald-600 !text-white !rounded-full !flex !items-center !justify-center !mx-auto !mb-6 !text-3xl">
                    <FiCheck />
                  </div>
                  <h3 className="!text-2xl !font-black !text-slate-900 !mb-4">Data Transmitted</h3>
                  <p className="!text-slate-500">Your logistical query has been queued for executive review. Expected latency: &lt; 24h.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="contact-form !flex !flex-col !gap-6">
                  <div className="form-row">
                    <div className={`form-group ${errors.name ? 'has-error' : ''}`}>
                      <label className="form-label !flex !items-center !gap-2 !text-[10px] !font-black !uppercase !tracking-widest !text-slate-400 !mb-3">
                        <FiUser className="!text-blue-500" /> Executive Identity
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        className="form-input !w-full !bg-slate-50 !border-0 !p-5 !rounded-2xl !text-sm focus:!ring-2 focus:!ring-blue-500 !transition-all"
                      />
                    </div>
                  </div>

                  <div className="form-row !grid !grid-cols-2 !gap-6 max-md:!grid-cols-1">
                    <div className={`form-group ${errors.email ? 'has-error' : ''}`}>
                      <label className="form-label !flex !items-center !gap-2 !text-[10px] !font-black !uppercase !tracking-widest !text-slate-400 !mb-3">
                        <FiMail className="!text-blue-500" /> Digital Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john@enterprise.com"
                        className="form-input !w-full !bg-slate-50 !border-0 !p-5 !rounded-2xl !text-sm focus:!ring-2 focus:!ring-blue-500 !transition-all"
                      />
                    </div>

                    <div className={`form-group ${errors.phone ? 'has-error' : ''}`}>
                      <label className="form-label !flex !items-center !gap-2 !text-[10px] !font-black !uppercase !tracking-widest !text-slate-400 !mb-3">
                        <FiPhone className="!text-blue-500" /> Voice Link
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+91 XXXXX XXXXX"
                        className="form-input !w-full !bg-slate-50 !border-0 !p-5 !rounded-2xl !text-sm focus:!ring-2 focus:!ring-blue-500 !transition-all"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className={`form-group ${errors.message ? 'has-error' : ''}`}>
                      <label className="form-label !flex !items-center !gap-2 !text-[10px] !font-black !uppercase !tracking-widest !text-slate-400 !mb-3">
                        <FiMessageSquare className="!text-blue-500" /> Technical Brief
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Specify your material requirements or logistical challenges..."
                        className="form-textarea !w-full !bg-slate-50 !border-0 !p-5 !rounded-2xl !text-sm !min-h-[150px] focus:!ring-2 focus:!ring-blue-500 !transition-all"
                      ></textarea>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className={`submit-btn !w-full !bg-slate-900 !text-white !p-6 !rounded-2xl !text-sm !font-black !uppercase !tracking-widest !flex !items-center !justify-center !gap-3 hover:!bg-blue-600 !transition-all active:!scale-95 ${loading ? 'loading' : ''}`}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="btn-spinner !w-5 !h-5 !border-2 !border-white/20 !border-t-white !rounded-full !animate-spin"></span>
                        Transmitting...
                      </>
                    ) : (
                      <>
                        <FiSend /> Execute Data Packet
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>

            {/* Contact Information */}
            <motion.div
              className="contact-info-wrapper !grid !grid-cols-1 !gap-6 animate-on-scroll"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div className="info-card !bg-white !p-8 !rounded-3xl !shadow-sm !border !border-slate-100">
                <div className="info-icon !w-12 !h-12 !bg-blue-600 !text-white !rounded-xl !flex !items-center !justify-center !mb-6">
                  <FiMapPin />
                </div>
                <h3 className="info-title !text-xl !font-black !text-slate-900 !mb-4">Physical Node</h3>
                <div className="info-content !text-slate-500 !text-sm !leading-relaxed">
                  <p className="!font-black !text-slate-900">{BUSINESS_CONFIG.name}</p>
                  <p>{BUSINESS_CONFIG.location.landmark}, {BUSINESS_CONFIG.location.street}</p>
                  <p>{BUSINESS_CONFIG.location.city} - {BUSINESS_CONFIG.location.pincode}</p>
                </div>
              </div>

              <div className="info-card !bg-white !p-8 !rounded-3xl !shadow-sm !border !border-slate-100">
                <div className="info-icon !w-12 !h-12 !bg-emerald-600 !text-white !rounded-xl !flex !items-center !justify-center !mb-6">
                  <FaWhatsapp />
                </div>
                <h3 className="info-title !text-xl !font-black !text-slate-900 !mb-4">Express Chat</h3>
                <a
                  href={getWhatsAppLink('Hi, I need assistance with material procurement.')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="!inline-flex !items-center !gap-2 !bg-emerald-600 !text-white !px-6 !py-3 !rounded-full !text-xs !font-black !uppercase !tracking-widest"
                >
                  <FaWhatsapp /> Initiate WhatsApp Channel
                </a>
              </div>

              <div className="info-card !bg-slate-900 !p-8 !rounded-3xl !shadow-sm">
                <div className="info-icon !w-12 !h-12 !bg-blue-500 !text-white !rounded-xl !flex !items-center !justify-center !mb-6">
                  <FiClock />
                </div>
                <h3 className="info-title !text-xl !font-black !text-white !mb-4">Operation Timeline</h3>
                <div className="!text-slate-400 !text-xs !font-bold !uppercase !tracking-widest !flex !flex-col !gap-2">
                  <div className="!flex !justify-between">
                    <span>Mon - Sat</span>
                    <span className="!text-blue-400">{BUSINESS_CONFIG.businessHours.weekdays}</span>
                  </div>
                  <div className="!flex !justify-between">
                    <span>Sunday</span>
                    <span className="!text-red-500">Logistics Offline</span>
                  </div>
                </div>
              </div>
            </motion.div>
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
    </PageTransition>
  );
};

export default Contact;
