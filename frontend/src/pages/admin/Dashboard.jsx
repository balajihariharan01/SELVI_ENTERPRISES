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

  const statCardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: (index) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        delay: index * 0.1
      }
    }),
    hover: {
      y: -4,
      transition: { duration: 0.2 }
    },
  };

  return (
    <PageTransition className="admin-dashboard">
      <header className="dashboard-header">
        <div className="header-info">
          <h1 className="dashboard-title">Dashboard Overview</h1>
          <p className="dashboard-subtitle">Monitor your business performance and inventory</p>
        </div>
        <div className="header-date-badge">
          <FiCalendar />
          <span>{new Date().toLocaleDateString('en-IN', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}</span>
        </div>
      </header>

      <section className="stats-section">
        <div className="stats-grid">
          <motion.div
            className="stat-card"
            variants={statCardVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            custom={0}
          >
            <div className="stat-icon-box orders">
              <FiShoppingCart />
            </div>
            <div className="stat-details">
              <span className="stat-label">Total Orders</span>
              <h3 className="stat-value"><AnimatedCounter value={stats?.totalOrders || 0} duration={1.2} /></h3>
            </div>
          </motion.div>

          <motion.div
            className="stat-card"
            variants={statCardVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            custom={1}
          >
            <div className="stat-icon-box pending">
              <FiActivity />
            </div>
            <div className="stat-details">
              <span className="stat-label">Pending Orders</span>
              <h3 className="stat-value"><AnimatedCounter value={stats?.pendingOrders || 0} duration={1.2} delay={0.1} /></h3>
            </div>
          </motion.div>

          <motion.div
            className="stat-card"
            variants={statCardVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            custom={2}
          >
            <div className="stat-icon-box products">
              <FiBox />
            </div>
            <div className="stat-details">
              <span className="stat-label">Total Products</span>
              <h3 className="stat-value"><AnimatedCounter value={stats?.totalProducts || 0} duration={1.2} delay={0.2} /></h3>
            </div>
          </motion.div>

          <motion.div
            className="stat-card"
            variants={statCardVariants}
            initial="initial"
            animate="animate"
            whileHover="hover"
            custom={3}
          >
            <div className="stat-icon-box customers">
              <FiUsers />
            </div>
            <div className="stat-details">
              <span className="stat-label">Total Customers</span>
              <h3 className="stat-value"><AnimatedCounter value={stats?.totalCustomers || 0} duration={1.2} delay={0.3} /></h3>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="dashboard-grid-layout">
        <section className="revenue-chart-panel card">
          <div className="card-header">
            <h2 className="card-title"><FiDollarSign /> Revenue Analytics</h2>
            <div className="period-tabs">
              {['today', 'week', 'month', 'year'].map((period) => (
                <button
                  key={period}
                  className={`tab-btn ${dateFilter.period === period ? 'active' : ''}`}
                  onClick={() => handlePeriodChange(period)}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          <div className="date-range-picker">
            <div className="input-group">
              <FiCalendar />
              <input
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <span className="separator">to</span>
            <div className="input-group">
              <FiCalendar />
              <input
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleDateRangeSubmit}
              disabled={!dateFilter.startDate || !dateFilter.endDate}
            >
              Analyze
            </button>
          </div>

          {revenueLoading ? (
            <div className="chart-loader">
              <div className="spinner"></div>
              <p>Analyzing financial data...</p>
            </div>
          ) : (
            <div className="metrics-row">
              <div className="metric-box">
                <span className="metric-title">Total Revenue</span>
                <span className="metric-amount">
                  {formatCurrency(revenueData?.analytics?.totalRevenue || stats?.totalRevenue || 0)}
                </span>
              </div>
              <div className="metric-box">
                <span className="metric-title">Completed Orders</span>
                <span className="metric-amount">{revenueData?.analytics?.totalOrders || 0}</span>
              </div>
              <div className="metric-box">
                <span className="metric-title">Avg. Order Value</span>
                <span className="metric-amount">
                  {formatCurrency(revenueData?.analytics?.averageOrderValue || 0)}
                </span>
              </div>
            </div>
          )}
        </section>

        <section className="inventory-alerts-panel card">
          <div className="card-header">
            <h2 className="card-title"><FiAlertTriangle /> Inventory Alerts</h2>
          </div>
          <div className="alert-grid">
            <div className="alert-item warning">
              <span className="alert-count">{stats?.lowStockProducts || 0}</span>
              <span className="alert-label">Low Stock</span>
            </div>
            <div className="alert-item danger">
              <span className="alert-count">{stats?.outOfStockProducts || 0}</span>
              <span className="alert-label">Out of Stock</span>
            </div>
          </div>
          <Link to="/admin/products" className="action-link">
            Logistics Audit <FiArrowRight />
          </Link>
        </section>
      </div>

      <section className="quick-nav-section">
        <h2 className="section-heading">Operational Matrix</h2>
        <div className="nav-cards">
          <Link to="/admin/products" className="nav-card">
            <div className="icon-wrap inventory"><FiPackage /></div>
            <span>Inventory</span>
          </Link>
          <Link to="/admin/orders" className="nav-card">
            <div className="icon-wrap fulfillment"><FiShoppingCart /></div>
            <span>Fulfillment</span>
          </Link>
          <Link to="/admin/customers" className="nav-card">
            <div className="icon-wrap customers"><FiUsers /></div>
            <span>Customers</span>
          </Link>
        </div>
      </section>

      <section className="business-details-section card">
        <div className="card-header">
          <h2 className="card-title">Corporate Information</h2>
        </div>
        <div className="details-grid">
          <div className="detail-item">
            <label>Legal Entity</label>
            <p>{BUSINESS_CONFIG.fullName}</p>
          </div>
          <div className="detail-item">
            <label>Governance</label>
            <p>{BUSINESS_CONFIG.owners.map(o => o.name).join(', ')}</p>
          </div>
          <div className="detail-item">
            <label>Comm Channel</label>
            <p>{BUSINESS_CONFIG.contact.phones.join(', ')}</p>
          </div>
          <div className="detail-item">
            <label>Relay System</label>
            <p>{BUSINESS_CONFIG.contact.email}</p>
          </div>
          <div className="detail-item">
            <label>UPI Registry</label>
            <p>{BUSINESS_CONFIG.payment.upiId}</p>
          </div>
          <div className="detail-item">
            <label>Coordinates</label>
            <p>{BUSINESS_CONFIG.location.fullAddress}</p>
          </div>
        </div>
      </section>
    </PageTransition>
  );
};

export default Dashboard;
