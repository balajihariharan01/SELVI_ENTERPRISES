import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiTarget, FiEye, FiAward, FiTruck, FiShield, FiHeart, FiCheck, FiUsers, FiPackage, FiStar, FiPhone } from 'react-icons/fi';
import { FaBuilding, FaHandshake, FaHardHat } from 'react-icons/fa';
import { BUSINESS_CONFIG } from '../config/businessConfig';
import { PageTransition } from '../components/animations';
import './About.css';

const About = () => {
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

  return (
    <PageTransition className="about-page">
      {/* Hero Section */}
      <section className="about-hero !relative !overflow-hidden !bg-slate-900 !py-32 max-md:!py-16">
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
            <FaBuilding /> Institutional Narrative
          </div>
          <h1 className="hero-title !text-7xl !font-black !text-white !mb-8 !leading-none max-md:!text-4xl">
            Engineering <span className="!text-blue-500">Resilience.</span>
          </h1>
          <p className="hero-subtitle !text-slate-400 !text-xl !max-w-2xl !mx-auto !mb-16 max-md:!text-sm">
            Forging the structural backbone of South India with high-performance material logistics and uncompromising technical standards.
          </p>
          <div className="hero-stats !grid !grid-cols-3 !gap-8 !max-w-4xl !mx-auto max-md:!gap-4">
            {[
              { number: '2+', label: 'Decades of Rigor' },
              { number: '500+', label: 'Deployments' },
              { number: '100%', label: 'Metric Precision' },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                className="stat-item !text-center"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + (index * 0.1) }}
              >
                <div className="stat-number !text-4xl !font-black !text-white !mb-2 max-md:!text-2xl">{stat.number}</div>
                <div className="stat-label !text-slate-500 !text-[10px] !font-black !uppercase !tracking-tighter">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Company Introduction */}
      <section className="about-section intro-section !bg-white !py-24 max-md:!py-12">
        <div className="container">
          <div className="intro-grid !grid !grid-cols-2 !gap-20 !items-center max-md:!grid-cols-1 max-md:!gap-12 animate-on-scroll">
            <div className="intro-content">
              <span className="section-badge !inline-block !bg-slate-100 !text-blue-600 !px-4 !py-1 !rounded-full !text-[10px] !font-black !uppercase !tracking-widest !mb-6">Institutional Identity</span>
              <h2 className="section-title !text-4xl !font-black !text-slate-900 !mb-8 max-md:!text-3xl">
                {BUSINESS_CONFIG.name}
              </h2>
              <p className="intro-text !text-slate-600 !text-lg !leading-relaxed !mb-6">
                <strong>{BUSINESS_CONFIG.name}</strong> stands as an industrial vanguard in material logistics. Since our inception, we have optimized the procurement pipelines for high-grade steel and cement across the technical terrain of Ooty.
              </p>
              <div className="intro-highlights !grid !grid-cols-2 !gap-4 max-md:!grid-cols-1">
                {[
                  'Strategic Sourcing',
                  'Technical Precision',
                  'Express Logistics',
                  'Executive Guidance'
                ].map((item) => (
                  <div key={item} className="highlight-item !flex !items-center !gap-3 !bg-slate-50 !p-4 !rounded-xl">
                    <FiCheck className="!text-blue-500" />
                    <span className="!text-xs !font-bold !text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="intro-image !relative">
              <div className="image-frame !bg-slate-900 !aspect-square !rounded-3xl !flex !flex-col !items-center !justify-center !gap-6 !shadow-2xl max-md:!max-w-[280px] max-md:!mx-auto">
                <FaHardHat className="!text-6xl !text-blue-500" />
                <div className="frame-text !text-center">
                  <span className="!block !text-white !text-xl !font-black !uppercase !tracking-widest">Industrial</span>
                  <span className="!block !text-white !text-xl !font-black !uppercase !tracking-widest">Logistics</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="about-section vision-mission-section !bg-slate-50 !py-24 max-md:!py-12">
        <div className="container">
          <div className="vm-grid !grid !grid-cols-2 !gap-10 max-md:!grid-cols-1">
            <div className="vm-card !bg-white !p-12 !rounded-3xl !shadow-sm max-md:!p-8 animate-on-scroll">
              <div className="vm-icon-wrapper !w-16 !h-16 !bg-blue-600 !rounded-2xl !flex !items-center !justify-center !mb-8">
                <FiEye className="!text-white !text-2xl" />
              </div>
              <h3 className="vm-title !text-2xl !font-black !text-slate-900 !mb-6">Global Vision</h3>
              <p className="vm-text !text-slate-600 !leading-relaxed">
                To engineer the most resilient procurement ecosystem in the construction industry, defined by technical transparency and operational excellence.
              </p>
            </div>
            <div className="vm-card !bg-white !p-12 !rounded-3xl !shadow-sm max-md:!p-8 animate-on-scroll">
              <div className="vm-icon-wrapper mission !w-16 !h-16 !bg-blue-500 !rounded-2xl !flex !items-center !justify-center !mb-8">
                <FiTarget className="!text-white !text-2xl" />
              </div>
              <h3 className="vm-title !text-2xl !font-black !text-slate-900 !mb-6">Institutional Mission</h3>
              <p className="vm-text !text-slate-600 !leading-relaxed">
                To deploy high-performance materials through validated logistical pipelines, ensuring project stability for stakeholders across the Nilgiris terrain.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="about-section why-choose-section">
        <div className="container">
          <div className="section-header animate-on-scroll">
            <span className="section-badge">Why Us</span>
            <h2 className="section-title">
              Why Customers Trust Us
              <span className="title-underline"></span>
            </h2>
            <p className="section-subtitle">
              We've built our reputation on delivering consistent quality and honest service
            </p>
          </div>
          <div className="reasons-grid">
            <div className="reason-card animate-on-scroll">
              <div className="reason-icon">
                <FiShield />
              </div>
              <h4 className="reason-title">Quality Guarantee</h4>
              <p className="reason-text">
                Every product we sell meets strict quality standards. We source directly from
                reputed manufacturers to ensure authenticity and durability.
              </p>
            </div>
            <div className="reason-card animate-on-scroll">
              <div className="reason-icon">
                <FaHandshake />
              </div>
              <h4 className="reason-title">Transparent Pricing</h4>
              <p className="reason-text">
                No hidden charges, no surprises. We believe in fair pricing and provide detailed
                quotations so you know exactly what you're paying for.
              </p>
            </div>
            <div className="reason-card animate-on-scroll">
              <div className="reason-icon">
                <FiTruck />
              </div>
              <h4 className="reason-title">Reliable Delivery</h4>
              <p className="reason-text">
                We understand construction timelines are crucial. Our delivery team ensures your
                materials reach you on time, every time.
              </p>
            </div>
            <div className="reason-card animate-on-scroll">
              <div className="reason-icon">
                <FiUsers />
              </div>
              <h4 className="reason-title">Expert Guidance</h4>
              <p className="reason-text">
                Not sure which grade of steel or type of cement you need? Our experienced team
                provides honest recommendations based on your project requirements.
              </p>
            </div>
            <div className="reason-card animate-on-scroll">
              <div className="reason-icon">
                <FiPackage />
              </div>
              <h4 className="reason-title">Wide Product Range</h4>
              <p className="reason-text">
                From TMT bars and cement to building accessories, we stock everything you need
                for your construction project under one roof.
              </p>
            </div>
            <div className="reason-card animate-on-scroll">
              <div className="reason-icon">
                <FiHeart />
              </div>
              <h4 className="reason-title">Customer First</h4>
              <p className="reason-text">
                Your satisfaction is our priority. We go the extra mile to address concerns,
                handle bulk orders, and support you throughout your project.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Commitment */}
      <section className="about-section commitment-section">
        <div className="container">
          <div className="commitment-content animate-on-scroll">
            <div className="commitment-icon">
              <FiAward />
            </div>
            <h2 className="commitment-title">Our Commitment to You</h2>
            <div className="commitment-list">
              <div className="commitment-item">
                <FiStar className="commit-icon" />
                <div>
                  <h4>Quality Without Compromise</h4>
                  <p>We never compromise on the quality of materials we supply. Every product is verified before delivery.</p>
                </div>
              </div>
              <div className="commitment-item">
                <FiStar className="commit-icon" />
                <div>
                  <h4>Honest Business Practices</h4>
                  <p>We believe in building long-term relationships through transparency and integrity in all dealings.</p>
                </div>
              </div>
              <div className="commitment-item">
                <FiStar className="commit-icon" />
                <div>
                  <h4>Supporting Local Construction</h4>
                  <p>We're proud to contribute to the growth of Ooty and the Nilgiris through quality construction support.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Proprietors Section */}
      <section className="about-section proprietors-section !bg-slate-50 !py-24 max-md:!py-12">
        <div className="container">
          <div className="section-header !text-center !mb-16 animate-on-scroll">
            <span className="section-badge !inline-block !bg-blue-100 !text-blue-600 !px-4 !py-1 !rounded-full !text-[10px] !font-black !uppercase !tracking-widest !mb-4">Executive Leadership</span>
            <h2 className="section-title !text-4xl !font-black !text-slate-900">Proprietors Registry</h2>
          </div>
          <div className="proprietors-grid !grid !grid-cols-2 !gap-12 max-md:!grid-cols-1 max-md:!gap-8">
            {BUSINESS_CONFIG.owners.map((owner, index) => (
              <div key={index} className="proprietor-card !bg-white !p-10 !rounded-3xl !text-center !shadow-sm animate-on-scroll">
                <div className="proprietor-avatar !w-20 !h-20 !bg-slate-900 !text-white !rounded-full !flex !items-center !justify-center !mx-auto !mb-6 !text-3xl !font-black">
                  {owner.name.charAt(0)}
                </div>
                <h3 className="proprietor-name !text-xl !font-black !text-slate-900 !mb-2">{owner.name}</h3>
                <p className="proprietor-role !text-slate-500 !text-xs !font-bold !uppercase !tracking-widest !mb-6">Senior Partner</p>
                <a href={`tel:${owner.phone.replace(/\s/g, '')}`} className="proprietor-phone !inline-flex !items-center !gap-2 !bg-blue-600 !text-white !px-6 !py-3 !rounded-full !text-sm !font-bold !transition-all hover:!bg-blue-700">
                  <FiPhone /> {owner.phone}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="about-section cta-section">
        <div className="container">
          <div className="cta-content animate-on-scroll">
            <h2 className="cta-title">Ready to Start Your Project?</h2>
            <p className="cta-text">
              Browse our wide selection of construction materials or get in touch for personalized assistance.
            </p>
            <div className="cta-buttons">
              <a href="/products" className="cta-btn primary">
                <FiPackage /> View Products
              </a>
              <a href="/contact" className="cta-btn secondary">
                <FaHandshake /> Contact Us
              </a>
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
};

export default About;
