import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiPackage,
  FiShoppingCart,
  FiUsers,
  FiAlertTriangle,
  FiTrendingUp,
  FiDollarSign,
  FiCalendar,
  FiArrowRight,
  FiBox,
  FiActivity,
  FiMapPin,
  FiPhone,
  FiMail,
  FiCreditCard
} from 'react-icons/fi';
import orderService from '../../services/orderService';
import { BUSINESS_CONFIG } from '../../config/businessConfig';
import { AnimatedCounter, PageTransition } from '../../components/animations';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState(null);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState({
    period: 'month',
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchDashboardStats();
    fetchRevenueAnalytics('month');
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await orderService.getDashboardStats();
      setStats(response.stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueAnalytics = async (period = null, startDate = null, endDate = null) => {
    setRevenueLoading(true);
    try {
      const params = {};
      if (period) params.period = period;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await orderService.getRevenueAnalytics(params);
      setRevenueData(response);
    } catch (error) {
      console.error('Error fetching revenue analytics:', error);
    } finally {
      setRevenueLoading(false);
    }
  };

  const handlePeriodChange = (period) => {
    setDateFilter({ period, startDate: '', endDate: '' });
    fetchRevenueAnalytics(period);
  };

  const handleDateRangeSubmit = () => {
    if (dateFilter.startDate && dateFilter.endDate) {
      setDateFilter(prev => ({ ...prev, period: '' }));
      fetchRevenueAnalytics(null, dateFilter.startDate, dateFilter.endDate);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  // Stat card animation variants
  const statCardVariants = {
    initial: { opacity: 0, y: 30, scale: 0.95 },
    animate: (index) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        delay: index * 0.1,
        ease: [0.4, 0, 0.2, 1]
      }
    }),
    hover: {
      y: -5,
      scale: 1.02,
      transition: { duration: 0.2 }
    },
  };

  return (
    <PageTransition className="admin-dashboard">
      {/* Header Section */}
      <header className="dashboard-header !mb-10 max-md:!mb-6">
        <motion.div
          className="header-content !flex !justify-between !items-end !pb-8 !border-b-2 !border-blue-50/50 max-md:!flex-col max-md:!items-start max-md:!gap-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="header-text">
            <h1 className="!text-4xl !font-black !text-slate-900 !tracking-tight !mb-2 max-md:!text-3xl">Command Center</h1>
            <p className="!text-sm !font-bold !text-gray-400 !uppercase !tracking-widest">Enterprise Oversight • {BUSINESS_CONFIG.name}</p>
          </div>
          <div className="header-date !bg-white !px-6 !py-3 !rounded-2xl !shadow-sm !border !border-gray-50 !flex !items-center !gap-3 max-md:!w-full max-md:!justify-center">
            <FiCalendar className="!text-blue-600" />
            <span className="!text-xs !font-black !text-slate-700 !uppercase !tracking-wider">{new Date().toLocaleDateString('en-IN', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}</span>
          </div>
        </motion.div>
      </header>

      {/* Stats Overview Cards */}
      <section className="stats-section !mb-12">
        <div className="stats-row !grid !grid-cols-4 !gap-6 max-xl:!grid-cols-2 max-sm:!grid-cols-1">
          <motion.div
            className="stat-card !bg-white !p-8 !rounded-[2.5rem] !shadow-sm !border !border-gray-50 !relative !overflow-hidden"
            variants={statCardVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            custom={0}
          >
            <div className="!relative !z-10 !flex !items-center !gap-6">
              <div className="stat-icon-wrapper !w-16 !h-16 !bg-blue-50 !text-blue-600 !rounded-2xl !flex !items-center !justify-center !text-2xl">
                <FiShoppingCart />
              </div>
              <div className="stat-content">
                <h3 className="!text-3xl !font-black !text-slate-900 !mb-1"><AnimatedCounter value={stats?.totalOrders || 0} duration={1.2} /></h3>
                <p className="!text-[10px] !font-bold !text-gray-400 !uppercase !tracking-widest">Global Requests</p>
              </div>
            </div>
            <div className="!absolute !top-0 !right-0 !w-32 !h-32 !bg-blue-500/5 !rounded-full !translate-x-12 !-translate-y-12"></div>
          </motion.div>

          <motion.div
            className="stat-card !bg-white !p-8 !rounded-[2.5rem] !shadow-sm !border !border-gray-50 !relative !overflow-hidden"
            variants={statCardVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            custom={1}
          >
            <div className="!relative !z-10 !flex !items-center !gap-6">
              <div className="stat-icon-wrapper !w-16 !h-16 !bg-amber-50 !text-amber-600 !rounded-2xl !flex !items-center !justify-center !text-2xl">
                <FiActivity />
              </div>
              <div className="stat-content">
                <h3 className="!text-3xl !font-black !text-slate-900 !mb-1"><AnimatedCounter value={stats?.pendingOrders || 0} duration={1.2} delay={0.1} /></h3>
                <p className="!text-[10px] !font-bold !text-gray-400 !uppercase !tracking-widest">Active Threads</p>
              </div>
            </div>
            <div className="!absolute !top-0 !right-0 !w-32 !h-32 !bg-amber-500/5 !rounded-full !translate-x-12 !-translate-y-12"></div>
          </motion.div>

          <motion.div
            className="stat-card !bg-white !p-8 !rounded-[2.5rem] !shadow-sm !border !border-gray-50 !relative !overflow-hidden"
            variants={statCardVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            custom={2}
          >
            <div className="!relative !z-10 !flex !items-center !gap-6">
              <div className="stat-icon-wrapper !w-16 !h-16 !bg-indigo-50 !text-indigo-600 !rounded-2xl !flex !items-center !justify-center !text-2xl">
                <FiBox />
              </div>
              <div className="stat-content">
                <h3 className="!text-3xl !font-black !text-slate-900 !mb-1"><AnimatedCounter value={stats?.totalProducts || 0} duration={1.2} delay={0.2} /></h3>
                <p className="!text-[10px] !font-bold !text-gray-400 !uppercase !tracking-widest">Inventory Nodes</p>
              </div>
            </div>
            <div className="!absolute !top-0 !right-0 !w-32 !h-32 !bg-indigo-500/5 !rounded-full !translate-x-12 !-translate-y-12"></div>
          </motion.div>

          <motion.div
            className="stat-card !bg-white !p-8 !rounded-[2.5rem] !shadow-sm !border !border-gray-50 !relative !overflow-hidden"
            variants={statCardVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            custom={3}
          >
            <div className="!relative !z-10 !flex !items-center !gap-6">
              <div className="stat-icon-wrapper !w-16 !h-16 !bg-emerald-50 !text-emerald-600 !rounded-2xl !flex !items-center !justify-center !text-2xl">
                <FiUsers />
              </div>
              <div className="stat-content">
                <h3 className="!text-3xl !font-black !text-slate-900 !mb-1"><AnimatedCounter value={stats?.totalCustomers || 0} duration={1.2} delay={0.3} /></h3>
                <p className="!text-[10px] !font-bold !text-gray-400 !uppercase !tracking-widest">Affiliate Network</p>
              </div>
            </div>
            <div className="!absolute !top-0 !right-0 !w-32 !h-32 !bg-emerald-500/5 !rounded-full !translate-x-12 !-translate-y-12"></div>
          </motion.div>
        </div>
      </section>

      {/* Main Dashboard Grid */}
      <div className="dashboard-main-grid max-lg:!grid-cols-1">
        {/* Revenue Analytics Section */}
        <section className="revenue-panel !bg-white !rounded-[2.5rem] !p-10 !shadow-sm !border !border-gray-50 max-md:!p-6">
          <div className="panel-header !flex !justify-between !items-center !mb-10 max-md:!flex-col max-md:!items-start max-md:!gap-6">
            <div className="panel-title !flex !items-center !gap-4">
              <div className="title-icon revenue-icon !w-12 !h-12 !bg-blue-600 !text-white !rounded-2xl !flex !items-center !justify-center !text-xl">
                <FiDollarSign />
              </div>
              <h2 className="!text-xl !font-black !text-slate-900">Capital Flow</h2>
            </div>
            <div className="period-selector !bg-slate-50 !p-1 !rounded-2xl !flex !gap-1 max-md:!w-full">
              {['today', 'week', 'month', 'year'].map((period) => (
                <button
                  key={period}
                  className={`!flex-1 !px-6 !py-3 !rounded-xl !text-[10px] !font-black !uppercase !tracking-widest !transition-all ${dateFilter.period === period ? '!bg-white !text-blue-600 !shadow-sm' : '!text-slate-400 hover:!text-slate-600'}`}
                  onClick={() => handlePeriodChange(period)}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          <div className="custom-date-range !bg-slate-900 !rounded-3xl !p-6 !mb-10 !flex !items-center !gap-4 max-md:!flex-col max-md:!gap-4">
            <div className="date-input-wrapper !flex-1 !bg-white/10 !border !border-white/10 !rounded-2xl !px-5 !py-3 !flex !items-center !gap-3 max-md:!w-full">
              <FiCalendar className="!text-blue-400" />
              <input
                type="date"
                className="!bg-transparent !border-0 !text-white !text-sm !font-bold !w-full focus:!ring-0"
                value={dateFilter.startDate}
                onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <span className="!text-white/20 !font-black max-md:!hidden">—</span>
            <div className="date-input-wrapper !flex-1 !bg-white/10 !border !border-white/10 !rounded-2xl !px-5 !py-3 !flex !items-center !gap-3 max-md:!w-full">
              <FiCalendar className="!text-blue-400" />
              <input
                type="date"
                className="!bg-transparent !border-0 !text-white !text-sm !font-bold !w-full focus:!ring-0"
                value={dateFilter.endDate}
                onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <button
              className="!px-10 !py-4 !bg-blue-600 !text-white !rounded-2xl !text-xs !font-black !uppercase !tracking-widest hover:!bg-blue-700 max-md:!w-full"
              onClick={handleDateRangeSubmit}
              disabled={!dateFilter.startDate || !dateFilter.endDate}
            >
              Analyze
            </button>
          </div>

          {revenueLoading ? (
            <div className="!py-20 !text-center">
              <div className="!w-10 !h-10 !border-4 !border-blue-100 !border-t-blue-600 !rounded-full !animate-spin !mx-auto !mb-4"></div>
              <p className="!text-xs !font-bold !text-gray-400 !uppercase !tracking-widest">Parsing Ledger...</p>
            </div>
          ) : (
            <>
              {revenueData && (
                <p className="!text-[10px] !font-black !text-blue-600 !uppercase !tracking-widest !mb-6 !flex !items-center !gap-2">
                  <span className="!w-2 !h-2 !bg-blue-600 !rounded-full"></span>
                  Chronological Scope: {revenueData.period}
                </p>
              )}
              <div className="revenue-metrics !grid !grid-cols-3 !gap-6 max-md:!grid-cols-1">
                <div className="metric-card !bg-white !p-8 !rounded-3xl !border !border-gray-50 !text-center !shadow-sm">
                  <div className="metric-icon !w-12 !h-12 !bg-blue-50 !text-blue-600 !rounded-2xl !flex !items-center !justify-center !text-xl !mx-auto !mb-6">
                    <FiDollarSign />
                  </div>
                  <div className="metric-data">
                    <span className="metric-value !text-2xl !font-black !text-slate-900 !block">
                      {formatCurrency(revenueData?.analytics?.totalRevenue || stats?.totalRevenue || 0)}
                    </span>
                    <span className="metric-label !text-[10px] !font-bold !text-gray-400 !uppercase !tracking-widest">Gross Revenue</span>
                  </div>
                </div>

                <div className="metric-card !bg-white !p-8 !rounded-3xl !border !border-gray-50 !text-center !shadow-sm">
                  <div className="metric-icon !w-12 !h-12 !bg-indigo-50 !text-indigo-600 !rounded-2xl !flex !items-center !justify-center !text-xl !mx-auto !mb-6">
                    <FiShoppingCart />
                  </div>
                  <div className="metric-data">
                    <span className="metric-value !text-2xl !font-black !text-slate-900 !block">
                      {revenueData?.analytics?.totalOrders || 0}
                    </span>
                    <span className="metric-label !text-[10px] !font-bold !text-gray-400 !uppercase !tracking-widest">Completed Deals</span>
                  </div>
                </div>

                <div className="metric-card !bg-white !p-8 !rounded-3xl !border !border-gray-50 !text-center !shadow-sm">
                  <div className="metric-icon !w-12 !h-12 !bg-amber-50 !text-amber-600 !rounded-2xl !flex !items-center !justify-center !text-xl !mx-auto !mb-6">
                    <FiTrendingUp />
                  </div>
                  <div className="metric-data">
                    <span className="metric-value !text-2xl !font-black !text-slate-900 !block">
                      {formatCurrency(revenueData?.analytics?.averageOrderValue || 0)}
                    </span>
                    <span className="metric-label !text-[10px] !font-bold !text-gray-400 !uppercase !tracking-widest">Median Ticket</span>
                  </div>
                </div>
              </div>

              {revenueData?.analytics?.totalOrders === 0 && (
                <div className="!mt-8 !p-6 !bg-amber-50 !rounded-2xl !flex !items-center !gap-4 !text-amber-700">
                  <FiAlertTriangle size={24} />
                  <span className="!text-sm !font-black !uppercase !tracking-wider">Insignificant activity detected in this window</span>
                </div>
              )}
            </>
          )}
        </section>

        {/* Stock Alerts Section */}
        <section className="alerts-panel !bg-white !rounded-[2.5rem] !p-10 !shadow-sm !border !border-gray-50 max-md:!p-6 max-md:!mt-0">
          <div className="panel-header !mb-10">
            <div className="panel-title !flex !items-center !gap-4">
              <div className="title-icon alert-icon !w-12 !h-12 !bg-amber-50 !text-amber-600 !rounded-2xl !flex !items-center !justify-center !text-xl">
                <FiAlertTriangle />
              </div>
              <h2 className="!text-xl !font-black !text-slate-900">Inventory Status</h2>
            </div>
          </div>

          <div className="alert-boxes !grid !grid-cols-2 !gap-6 !mb-10 max-md:!grid-cols-1">
            <div className="alert-box warning-box !bg-amber-50 !p-8 !rounded-3xl !border !border-amber-100 !flex !flex-col !items-center !gap-4">
              <span className="alert-number !text-4xl !font-black !text-amber-600">{stats?.lowStockProducts || 0}</span>
              <span className="alert-text !text-[10px] !font-bold !text-gray-400 !uppercase !tracking-widest !text-center">Warning: Low Quota</span>
            </div>
            <div className="alert-box danger-box !bg-red-50 !p-8 !rounded-3xl !border !border-red-100 !flex !flex-col !items-center !gap-4">
              <span className="alert-number !text-4xl !font-black !text-red-600">{stats?.outOfStockProducts || 0}</span>
              <span className="alert-text !text-[10px] !font-bold !text-gray-400 !uppercase !tracking-widest !text-center">Critical: Exhausted</span>
            </div>
          </div>

          <Link to="/admin/products" className="!w-full !flex !items-center !justify-center !gap-3 !py-5 !bg-slate-900 !text-white !rounded-2xl !font-black !text-xs !uppercase !tracking-widest hover:!bg-blue-600">
            Audit Logistics <FiArrowRight />
          </Link>
        </section>
      </div>

      {/* Quick Actions */}
      <section className="quick-actions-section !bg-slate-900 !rounded-[2.5rem] !p-10 !shadow-2xl !shadow-slate-200 !mb-12 max-md:!p-6">
        <h2 className="!text-xl !font-black !text-white !mb-10 !flex !items-center !gap-3"><FiTrendingUp className="!text-blue-400" /> Operational Matrix</h2>
        <div className="actions-row !grid !grid-cols-3 !gap-6 max-md:!grid-cols-1">
          <Link to="/admin/products" className="action-tile !flex !flex-col !items-center !gap-4 !p-8 !bg-white/5 !rounded-3xl !transition-all hover:!bg-blue-600 group">
            <div className="action-icon products-action !w-14 !h-14 !bg-blue-400/20 !text-blue-400 !rounded-2xl !flex !items-center !justify-center !text-2xl group-hover:!bg-white group-hover:!text-blue-600">
              <FiPackage />
            </div>
            <span className="!text-[10px] !font-black !text-white !uppercase !tracking-widest">Inventory Console</span>
          </Link>
          <Link to="/admin/orders" className="action-tile !flex !flex-col !items-center !gap-4 !p-8 !bg-white/5 !rounded-3xl !transition-all hover:!bg-blue-600 group">
            <div className="action-icon orders-action !w-14 !h-14 !bg-indigo-400/20 !text-indigo-400 !rounded-2xl !flex !items-center !justify-center !text-2xl group-hover:!bg-white group-hover:!text-indigo-600">
              <FiShoppingCart />
            </div>
            <span className="!text-[10px] !font-black !text-white !uppercase !tracking-widest">Fulfillment Log</span>
          </Link>
          <Link to="/admin/customers" className="action-tile !flex !flex-col !items-center !gap-4 !p-8 !bg-white/5 !rounded-3xl !transition-all hover:!bg-blue-600 group">
            <div className="action-icon customers-action !w-14 !h-14 !bg-emerald-400/20 !text-emerald-400 !rounded-2xl !flex !items-center !justify-center !text-2xl group-hover:!bg-white group-hover:!text-emerald-600">
              <FiUsers />
            </div>
            <span className="!text-[10px] !font-black !text-white !uppercase !tracking-widest">Entity Metadata</span>
          </Link>
        </div>
      </section>

      {/* Business Information */}
      <section className="business-info-section !bg-white !rounded-[2.5rem] !p-10 !shadow-sm !border !border-gray-50 !mb-12 max-md:!p-6">
        <h2 className="!text-xl !font-black !text-slate-900 !mb-10">Corporate Identity</h2>
        <div className="business-grid !grid !grid-cols-3 !gap-6 max-xl:!grid-cols-2 max-md:!grid-cols-1">
          <div className="info-card !flex !items-center !gap-6 !p-6 !bg-slate-50 !rounded-3xl !border !border-slate-100">
            <div className="info-icon !w-12 !h-12 !bg-blue-600 !text-white !rounded-2xl !flex !items-center !justify-center !text-xl">
              <FiBox />
            </div>
            <div className="info-content">
              <label className="!text-[10px] !font-bold !text-gray-400 !uppercase !tracking-widest !block !mb-1">Legal Entity</label>
              <p className="!text-sm !font-black !text-slate-900">{BUSINESS_CONFIG.fullName}</p>
            </div>
          </div>

          <div className="info-card !flex !items-center !gap-6 !p-6 !bg-slate-50 !rounded-3xl !border !border-slate-100">
            <div className="info-icon !w-12 !h-12 !bg-blue-600 !text-white !rounded-2xl !flex !items-center !justify-center !text-xl">
              <FiUsers />
            </div>
            <div className="info-content">
              <label className="!text-[10px] !font-bold !text-gray-400 !uppercase !tracking-widest !block !mb-1">Governance</label>
              <p className="!text-sm !font-black !text-slate-900">{BUSINESS_CONFIG.owners.map(o => o.name).join(', ')}</p>
            </div>
          </div>

          <div className="info-card !flex !items-center !gap-6 !p-6 !bg-slate-50 !rounded-3xl !border !border-slate-100">
            <div className="info-icon !w-12 !h-12 !bg-blue-600 !text-white !rounded-2xl !flex !items-center !justify-center !text-xl">
              <FiPhone />
            </div>
            <div className="info-content">
              <label className="!text-[10px] !font-bold !text-gray-400 !uppercase !tracking-widest !block !mb-1">Comm Channel</label>
              <p className="!text-sm !font-black !text-slate-900">{BUSINESS_CONFIG.contact.phones.join(', ')}</p>
            </div>
          </div>

          <div className="info-card !flex !items-center !gap-6 !p-6 !bg-slate-50 !rounded-3xl !border !border-slate-100">
            <div className="info-icon !w-12 !h-12 !bg-blue-600 !text-white !rounded-2xl !flex !items-center !justify-center !text-xl">
              <FiMail />
            </div>
            <div className="info-content">
              <label className="!text-[10px] !font-bold !text-gray-400 !uppercase !tracking-widest !block !mb-1">Relay System</label>
              <p className="!text-sm !font-black !text-slate-900">{BUSINESS_CONFIG.contact.email}</p>
            </div>
          </div>

          <div className="info-card !flex !items-center !gap-6 !p-6 !bg-slate-50 !rounded-3xl !border !border-slate-100">
            <div className="info-icon !w-12 !h-12 !bg-blue-600 !text-white !rounded-2xl !flex !items-center !justify-center !text-xl">
              <FiCreditCard />
            </div>
            <div className="info-content">
              <label className="!text-[10px] !font-bold !text-gray-400 !uppercase !tracking-widest !block !mb-1">UPI Registry</label>
              <p className="!text-sm !font-black !text-slate-900">{BUSINESS_CONFIG.payment.upiId}</p>
            </div>
          </div>

          <div className="info-card !flex !items-center !gap-6 !p-6 !bg-slate-50 !rounded-3xl !border !border-slate-100">
            <div className="info-icon !w-12 !h-12 !bg-blue-600 !text-white !rounded-2xl !flex !items-center !justify-center !text-xl">
              <FiMapPin />
            </div>
            <div className="info-content">
              <label className="!text-[10px] !font-bold !text-gray-400 !uppercase !tracking-widest !block !mb-1">Coordinates</label>
              <p className="!text-sm !font-black !text-slate-900">{BUSINESS_CONFIG.location.fullAddress}</p>
            </div>
          </div>
        </div>
      </section>
    </PageTransition>
  );
};

export default Dashboard;
