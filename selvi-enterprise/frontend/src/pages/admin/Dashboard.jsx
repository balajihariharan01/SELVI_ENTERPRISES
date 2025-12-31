import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

  return (
    <div className="admin-dashboard">
      {/* Header Section */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-text">
            <h1>Dashboard</h1>
            <p>Welcome to {BUSINESS_CONFIG.name} Admin Panel</p>
          </div>
          <div className="header-date">
            <FiCalendar />
            <span>{new Date().toLocaleDateString('en-IN', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</span>
          </div>
        </div>
      </header>

      {/* Stats Overview Cards */}
      <section className="stats-section">
        <div className="stats-row">
          <div className="stat-card stat-orders">
            <div className="stat-icon-wrapper">
              <FiShoppingCart />
            </div>
            <div className="stat-content">
              <h3>{stats?.totalOrders || 0}</h3>
              <p>Total Orders</p>
            </div>
            <div className="stat-decoration"></div>
          </div>

          <div className="stat-card stat-pending">
            <div className="stat-icon-wrapper">
              <FiActivity />
            </div>
            <div className="stat-content">
              <h3>{stats?.pendingOrders || 0}</h3>
              <p>Pending Orders</p>
            </div>
            <div className="stat-decoration"></div>
          </div>

          <div className="stat-card stat-products">
            <div className="stat-icon-wrapper">
              <FiBox />
            </div>
            <div className="stat-content">
              <h3>{stats?.totalProducts || 0}</h3>
              <p>Total Products</p>
            </div>
            <div className="stat-decoration"></div>
          </div>

          <div className="stat-card stat-customers">
            <div className="stat-icon-wrapper">
              <FiUsers />
            </div>
            <div className="stat-content">
              <h3>{stats?.totalCustomers || 0}</h3>
              <p>Total Customers</p>
            </div>
            <div className="stat-decoration"></div>
          </div>
        </div>
      </section>

      {/* Main Dashboard Grid */}
      <div className="dashboard-main-grid">
        {/* Revenue Analytics Section */}
        <section className="revenue-panel">
          <div className="panel-header">
            <div className="panel-title">
              <div className="title-icon revenue-icon">
                <FiDollarSign />
              </div>
              <h2>Revenue Overview</h2>
            </div>
            <div className="period-selector">
              {['today', 'week', 'month', 'year'].map((period) => (
                <button
                  key={period}
                  className={`period-btn ${dateFilter.period === period ? 'active' : ''}`}
                  onClick={() => handlePeriodChange(period)}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Range */}
          <div className="custom-date-range">
            <div className="date-input-wrapper">
              <FiCalendar className="date-icon" />
              <input
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <span className="date-to">to</span>
            <div className="date-input-wrapper">
              <FiCalendar className="date-icon" />
              <input
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <button 
              className="apply-btn"
              onClick={handleDateRangeSubmit}
              disabled={!dateFilter.startDate || !dateFilter.endDate}
            >
              Apply
            </button>
          </div>

          {revenueLoading ? (
            <div className="revenue-loading">
              <div className="mini-spinner"></div>
              <span>Loading analytics...</span>
            </div>
          ) : (
            <>
              {revenueData && (
                <p className="period-indicator">{revenueData.period}</p>
              )}
              <div className="revenue-metrics">
                <div className="metric-card metric-primary">
                  <div className="metric-icon">
                    <FiDollarSign />
                  </div>
                  <div className="metric-data">
                    <span className="metric-value">
                      {formatCurrency(revenueData?.analytics?.totalRevenue || stats?.totalRevenue || 0)}
                    </span>
                    <span className="metric-label">TOTAL REVENUE</span>
                  </div>
                </div>

                <div className="metric-card metric-secondary">
                  <div className="metric-icon">
                    <FiShoppingCart />
                  </div>
                  <div className="metric-data">
                    <span className="metric-value">
                      {revenueData?.analytics?.totalOrders || 0}
                    </span>
                    <span className="metric-label">ORDERS</span>
                  </div>
                </div>

                <div className="metric-card metric-tertiary">
                  <div className="metric-icon">
                    <FiTrendingUp />
                  </div>
                  <div className="metric-data">
                    <span className="metric-value">
                      {formatCurrency(revenueData?.analytics?.averageOrderValue || 0)}
                    </span>
                    <span className="metric-label">AVG. ORDER VALUE</span>
                  </div>
                </div>
              </div>

              {revenueData?.analytics?.totalOrders === 0 && (
                <div className="no-orders-alert">
                  <FiAlertTriangle />
                  <span>No orders found for the selected period</span>
                </div>
              )}
            </>
          )}
        </section>

        {/* Stock Alerts Section */}
        <section className="alerts-panel">
          <div className="panel-header">
            <div className="panel-title">
              <div className="title-icon alert-icon">
                <FiAlertTriangle />
              </div>
              <h2>Stock Alerts</h2>
            </div>
          </div>

          <div className="alert-boxes">
            <div className="alert-box warning-box">
              <span className="alert-number">{stats?.lowStockProducts || 0}</span>
              <span className="alert-text">LOW STOCK<br/>ITEMS</span>
            </div>
            <div className="alert-box danger-box">
              <span className="alert-number">{stats?.outOfStockProducts || 0}</span>
              <span className="alert-text">OUT OF STOCK</span>
            </div>
          </div>

          <Link to="/admin/products" className="view-products-btn">
            View Products <FiArrowRight />
          </Link>
        </section>
      </div>

      {/* Quick Actions */}
      <section className="quick-actions-section">
        <h2>Quick Actions</h2>
        <div className="actions-row">
          <Link to="/admin/products" className="action-tile">
            <div className="action-icon products-action">
              <FiPackage />
            </div>
            <span>Manage Products</span>
          </Link>
          <Link to="/admin/orders" className="action-tile">
            <div className="action-icon orders-action">
              <FiShoppingCart />
            </div>
            <span>View Orders</span>
          </Link>
          <Link to="/admin/customers" className="action-tile">
            <div className="action-icon customers-action">
              <FiUsers />
            </div>
            <span>Customer Records</span>
          </Link>
        </div>
      </section>

      {/* Business Information */}
      <section className="business-info-section">
        <h2>Business Information</h2>
        <div className="business-grid">
          <div className="info-card">
            <div className="info-icon">
              <FiBox />
            </div>
            <div className="info-content">
              <label>Business Name</label>
              <p>{BUSINESS_CONFIG.fullName}</p>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon">
              <FiUsers />
            </div>
            <div className="info-content">
              <label>Owners</label>
              <p>{BUSINESS_CONFIG.owners.map(o => o.name).join(', ')}</p>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon">
              <FiPhone />
            </div>
            <div className="info-content">
              <label>Contact</label>
              <p>{BUSINESS_CONFIG.contact.phones.join(', ')}</p>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon">
              <FiMail />
            </div>
            <div className="info-content">
              <label>Email</label>
              <p>{BUSINESS_CONFIG.contact.email}</p>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon">
              <FiCreditCard />
            </div>
            <div className="info-content">
              <label>UPI ID</label>
              <p>{BUSINESS_CONFIG.payment.upiId}</p>
            </div>
          </div>

          <div className="info-card">
            <div className="info-icon">
              <FiMapPin />
            </div>
            <div className="info-content">
              <label>Location</label>
              <p>{BUSINESS_CONFIG.location.fullAddress}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
