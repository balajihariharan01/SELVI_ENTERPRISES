import { Link, useNavigate } from 'react-router-dom';
import { FiTruck, FiShield, FiClock, FiArrowRight, FiSearch, FiShoppingCart, FiPhone, FiMail, FiMapPin, FiBox, FiUser, FiHome, FiLayout } from 'react-icons/fi';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import productService from '../services/productService';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import Logo from '../components/common/Logo';
import { BUSINESS_CONFIG } from '../config/businessConfig';
import './MobileHome.css';

const MobileHome = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { getCartCount } = useCart();

  const homeRef = useRef(null);
  const productsRef = useRef(null);
  const contactRef = useRef(null);

  useEffect(() => {
    fetchAllProducts();
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
    if (activeCategory !== 'all') filtered = filtered.filter(p => p.category === activeCategory);
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.productName.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query)
      );
    }
    setFilteredProducts(filtered);
  };

  const scrollToSection = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const cartCount = getCartCount();

  return (
    <div className="mobile-spa !bg-slate-950 !min-h-screen !pb-32">
      {/* Cinematic Header */}
      <header className={`!fixed !top-0 !left-0 !right-0 !z-[1000] !transition-all !duration-500 ${scrolled ? '!bg-slate-900/90 !backdrop-blur-xl !py-4 !border-b !border-white/5' : '!bg-transparent !py-8'}`}>
        <div className="!px-6 !flex !justify-between !items-center">
          <Link to="/" className="!flex !items-center !gap-3">
            <div className="!w-10 !h-10 !bg-white !rounded-xl !flex !items-center !justify-center !shadow-lg">
              <Logo className="!w-7 !h-7" />
            </div>
            <div className="!flex !flex-col">
              <span className="!text-white !font-black !text-sm !leading-tight !uppercase !tracking-widest">{BUSINESS_CONFIG.name}</span>
              <span className="!text-blue-500 !font-bold !text-[9px] !uppercase !tracking-tighter">Premium Construction</span>
            </div>
          </Link>
          <div className="!flex !items-center !gap-4">
            {isAuthenticated && (
              <Link to="/cart" className="!relative !w-11 !h-11 !bg-white/10 !backdrop-blur-md !rounded-full !flex !items-center !justify-center !text-white !border !border-white/10">
                <FiShoppingCart size={18} />
                {cartCount > 0 && (
                  <span className="!absolute !-top-1 !-right-1 !bg-blue-600 !text-white !text-[9px] !font-black !w-5 !h-5 !rounded-full !flex !items-center !justify-center !border-2 !border-slate-950">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Experience */}
      <main className="!flex !flex-col">
        {/* Dynamic Hero */}
        <section ref={homeRef} className="!relative !pt-40 !pb-20 !px-6 !overflow-hidden">
          <div className="!absolute !top-0 !left-0 !right-0 !h-[60vh] !bg-gradient-to-b !from-blue-600/20 !to-transparent !pointer-events-none"></div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="!relative !z-10"
          >
            <span className="!inline-block !px-4 !py-1.5 !bg-blue-600/10 !backdrop-blur-md !border !border-blue-500/20 !text-blue-400 !text-[10px] !font-black !uppercase !tracking-[0.2em] !rounded-full !mb-6">
              Official Material supplier
            </span>
            <h1 className="!text-5xl !font-black !text-white !leading-[1.1] !mb-6">
              Build The <span className="!text-blue-500">Future</span> With Strength.
            </h1>
            <p className="!text-slate-400 !text-base !leading-relaxed !mb-10 !max-w-[85%]">
              Direct procurement of premium Steel & Cement from global market leaders. Engineered for durability.
            </p>
            <button
              onClick={() => scrollToSection(productsRef)}
              className="!w-full !max-w-[240px] !bg-white !text-slate-950 !py-5 !rounded-2xl !text-sm !font-black !uppercase !tracking-widest !flex !items-center !justify-center !gap-3 !shadow-2xl !shadow-white/5 active:!scale-95 !transition-all"
            >
              Explore Registry <FiArrowRight size={18} />
            </button>
          </motion.div>

          {/* Floating Metric */}
          <div className="!mt-16 !grid !grid-cols-3 !gap-4">
            {[
              { icon: <FiTruck />, label: 'Express' },
              { icon: <FiShield />, label: 'Certified' },
              { icon: <FiClock />, label: '24/7 Ops' }
            ].map((m, i) => (
              <div key={i} className="!bg-white/5 !backdrop-blur-sm !border !border-white/5 !p-4 !rounded-2xl !flex !flex-col !items-center !gap-2">
                <span className="!text-blue-500 !text-lg">{m.icon}</span>
                <span className="!text-[9px] !font-black !text-slate-500 !uppercase !tracking-wider">{m.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Product Explorer */}
        <section ref={productsRef} className="!px-6 !py-12 !bg-slate-950">
          <div className="!mb-10">
            <h2 className="!text-3xl !font-black !text-white !mb-2">Industrial Store</h2>
            <p className="!text-slate-500 !text-sm !font-bold !uppercase !tracking-widest">High-Density Material Supply</p>
          </div>

          {/* Search Hub */}
          <div className="!relative !mb-10">
            <FiSearch className="!absolute !left-5 !top-1/2 !-translate-y-1/2 !text-blue-500" size={20} />
            <input
              type="text"
              placeholder="Search Material Registry..."
              className="!w-full !bg-white/5 !border !border-white/10 !rounded-2xl !pl-14 !pr-6 !py-5 !text-white !text-sm !font-medium focus:!border-blue-500 !transition-all !outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Nav Categories */}
          <div className="!flex !gap-4 !overflow-x-auto !pb-10 !no-scrollbar">
            {['all', 'cement', 'steel', 'others'].map((cat) => (
              <button
                key={cat}
                className={`!px-7 !py-4 !rounded-2xl !text-[10px] !font-black !uppercase !tracking-widest !whitespace-nowrap !transition-all ${activeCategory === cat
                    ? '!bg-blue-600 !text-white !shadow-lg !shadow-blue-600/20'
                    : '!bg-white/5 !text-slate-500 !border !border-white/5'
                  }`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat === 'all' ? 'Inventory' : cat === 'cement' ? '🧱 Cement' : cat === 'steel' ? '🔩 Steel' : '📦 Others'}
              </button>
            ))}
          </div>

          {/* Grid Engine */}
          {loading ? (
            <div className="!py-20 !flex !justify-center">
              <div className="!w-10 !h-10 !border-4 !border-blue-600/20 !border-t-blue-600 !rounded-full !animate-spin"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="!py-20 !text-center !bg-white/5 !rounded-3xl !border !border-dashed !border-white/10">
              <span className="!text-4xl !block !mb-4">🛰️</span>
              <p className="!text-slate-500 !text-sm !font-bold !uppercase !tracking-widest">No spectral matches found</p>
            </div>
          ) : (
            <div className="!grid !grid-cols-1 !gap-6">
              {filteredProducts.map(product => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </section>

        {/* Global Support */}
        <section ref={contactRef} className="!px-6 !py-20 !bg-slate-900/50">
          <div className="!mb-10">
            <h2 className="!text-3xl !font-black !text-white !mb-2">Bridge Support</h2>
            <p className="!text-slate-500 !text-sm !font-bold !uppercase !tracking-widest">Connect with Logistics</p>
          </div>

          <div className="!flex !flex-col !gap-6">
            <a href={`tel:${BUSINESS_CONFIG.phone}`} className="!bg-white/5 !backdrop-blur-xl !border !border-white/5 !p-8 !rounded-[2.5rem] !flex !items-center !gap-6 active:!scale-95 !transition-all">
              <div className="!w-16 !h-16 !bg-blue-600 !rounded-2xl !flex !items-center !justify-center !text-white !text-2xl">
                <FiPhone />
              </div>
              <div className="!flex !flex-col">
                <span className="!text-[10px] !font-black !text-slate-500 !uppercase !tracking-widest !mb-1">Voice Protocol</span>
                <span className="!text-white !font-black !text-lg">{BUSINESS_CONFIG.phone}</span>
              </div>
            </a>

            <a href="https://wa.me/919876543210" className="!bg-emerald-600/10 !backdrop-blur-xl !border !border-emerald-500/20 !p-8 !rounded-[2.5rem] !flex !items-center !gap-6 active:!scale-95 !transition-all">
              <div className="!w-16 !h-16 !bg-emerald-600 !rounded-2xl !flex !items-center !justify-center !text-white !text-3xl">
                📱
              </div>
              <div className="!flex !flex-col">
                <span className="!text-[10px] !font-black !text-emerald-500 !uppercase !tracking-widest !mb-1">WhatsApp Direct</span>
                <span className="!text-white !font-black !text-lg">Open Secure Chat</span>
              </div>
            </a>
          </div>
        </section>
      </main>

      {/* Floating Bottom Command Bar */}
      <nav className="!fixed !bottom-10 !left-6 !right-6 !z-[1000]">
        <div className="!bg-slate-900/80 !backdrop-blur-2xl !border !border-white/10 !rounded-[2.5rem] !py-5 !px-8 !shadow-2xl !shadow-black/50 !flex !justify-between !items-center">
          <button onClick={() => scrollToSection(homeRef)} className="!flex !flex-col !items-center !gap-2 !text-blue-500">
            <FiHome size={26} />
            <span className="!text-[9px] !font-black !uppercase !tracking-tighter">Core</span>
          </button>
          <button onClick={() => scrollToSection(productsRef)} className="!flex !flex-col !items-center !gap-2 !text-slate-500 active:!text-blue-500">
            <FiLayout size={26} />
            <span className="!text-[9px] !font-black !uppercase !tracking-tighter">Catalog</span>
          </button>

          {isAuthenticated ? (
            <>
              <Link to="/cart" className="!relative !flex !flex-col !items-center !gap-2 !text-slate-500 active:!text-blue-500">
                <FiShoppingCart size={26} />
                <span className="!text-[9px] !font-black !uppercase !tracking-tighter">Vault</span>
                {cartCount > 0 && <span className="!absolute !-top-1 !-right-1 !bg-blue-600 !text-[9px] !font-black !w-5 !h-5 !rounded-full !flex !items-center !justify-center !text-white">{cartCount}</span>}
              </Link>
              <Link to="/profile" className="!flex !flex-col !items-center !gap-2 !text-slate-500 active:!text-blue-500">
                <FiUser size={26} />
                <span className="!text-[9px] !font-black !uppercase !tracking-tighter">Officer</span>
              </Link>
            </>
          ) : (
            <Link to="/login" className="!flex !flex-col !items-center !gap-2 !text-blue-500">
              <FiUser size={26} />
              <span className="!text-[9px] !font-black !uppercase !tracking-tighter">Login</span>
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
};

export default MobileHome;
