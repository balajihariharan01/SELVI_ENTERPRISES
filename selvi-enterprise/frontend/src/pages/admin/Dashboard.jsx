import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPackage, FiShoppingCart, FiUsers, FiAlertTriangle, FiTrendingUp, FiDollarSign, FiCalendar } from 'react-icons/fi';
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
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome to {BUSINESS_CONFIG.name} Admin Panel</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon orders">
            <FiShoppingCart />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats?.totalOrders || 0}</span>
            <span className="stat-label">Total Orders</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon pending">
            <FiTrendingUp />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats?.pendingOrders || 0}</span>
            <span className="stat-label">Pending Orders</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon products">
            <FiPackage />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats?.totalProducts || 0}</span>
            <span className="stat-label">Total Products</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon customers">
            <FiUsers />
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats?.totalCustomers || 0}</span>
            <span className="stat-label">Total Customers</span>
          </div>
        </div>
      </div>

      {/* Revenue & Alerts */}
      <div className="dashboard-grid">
        {/* Revenue Section with Date Filter */}
        <div className="revenue-section enhanced">
          <div className="section-header">
            <h2><FiDollarSign /> Revenue Overview</h2>
            <div className="date-filters">
              <div className="period-buttons">
                <button 
                  className={`period-btn ${dateFilter.period === 'today' ? 'active' : ''}`}
                  onClick={() => handlePeriodChange('today')}
                >
                  Today
                </button>
                <button 
                  className={`period-btn ${dateFilter.period === 'week' ? 'active' : ''}`}
                  onClick={() => handlePeriodChange('week')}
                >
                  Week
                </button>
                <button 
                  className={`period-btn ${dateFilter.period === 'month' ? 'active' : ''}`}
                  onClick={() => handlePeriodChange('month')}
                >
                  Month
                </button>
                <button 
                  className={`period-btn ${dateFilter.period === 'year' ? 'active' : ''}`}
                  onClick={() => handlePeriodChange('year')}
                >
                  Year
                </button>
              </div>
            </div>
          </div>

          {/* Custom Date Range */}
          <div className="date-range-filter">
            <div className="date-input-group">
              <FiCalendar />
              <input
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                placeholder="From Date"
              />
            </div>
            <span className="date-separator">to</span>
            <div className="date-input-group">
              <FiCalendar />
              <input
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                placeholder="To Date"
              />
            </div>
            <button 
              className="btn btn-primary btn-sm"
              onClick={handleDateRangeSubmit}
              disabled={!dateFilter.startDate || !dateFilter.endDate}
            >
              Apply
            </button>
          </div>

          {revenueLoading ? (
            <div className="revenue-loading">
              <div className="spinner-small"></div>
              <span>Loading revenue data...</span>
            </div>
          ) : revenueData ? (
            <>
              <div className="period-label">{revenueData.period}</div>
              <div className="revenue-cards">
                <div className="revenue-card primary">
                  <div className="revenue-icon">
                    <FiDollarSign />
                  </div>
                  <div>
                    <span className="revenue-value">{formatCurrency(revenueData.analytics?.totalRevenue || 0)}</span>
                    <span className="revenue-label">Total Revenue</span>
                  </div>
                </div>
                <div className="revenue-card">
                  <div className="revenue-icon secondary">
                    <FiShoppingCart />
                  </div>
                  <div>
                    <span className="revenue-value">{revenueData.analytics?.totalOrders || 0}</span>
                    <span className="revenue-label">Orders</span>
                  </div>
                </div>
                <div className="revenue-card">
                  <div className="revenue-icon tertiary">
                    <FiTrendingUp />
                  </div>
                  <div>
                    <span className="revenue-value">{formatCurrency(revenueData.analytics?.averageOrderValue || 0)}</span>
                    <span className="revenue-label">Avg. Order Value</span>
                  </div>
                </div>
              </div>

              {revenueData.analytics?.totalOrders === 0 && (
                <div className="no-data-message">
                  <FiAlertTriangle />
                  <span>No orders found for the selected period</span>
                </div>
              )}
            </>
          ) : (
            <div className="revenue-cards">
              <div className="revenue-card">
                <div className="revenue-icon">
                  <FiDollarSign />
                </div>
                <div>
                  <span className="revenue-value">{formatCurrency(stats?.totalRevenue || 0)}</span>
                  <span className="revenue-label">Total Revenue</span>
                </div>
              </div>
              <div className="revenue-card">
                <div className="revenue-icon monthly">
                  <FiTrendingUp />
                </div>
                <div>
                  <span className="revenue-value">{formatCurrency(stats?.monthlyRevenue || 0)}</span>
                  <span className="revenue-label">This Month</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stock Alerts */}
        <div className="alerts-section">
          <h2><FiAlertTriangle /> Stock Alerts</h2>
          <div className="alert-cards">
            <div className="alert-card warning">
              <span className="alert-value">{stats?.lowStockProducts || 0}</span>
              <span className="alert-label">Low Stock Items</span>
            </div>
            <div className="alert-card danger">
              <span className="alert-value">{stats?.outOfStockProducts || 0}</span>
              <span className="alert-label">Out of Stock</span>
            </div>
          </div>
          <Link to="/admin/products" className="btn btn-outline btn-sm">
            View Products →
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="actions-grid">
          <Link to="/admin/products" className="action-card">
            <FiPackage />
            <span>Manage Products</span>
          </Link>
          <Link to="/admin/orders" className="action-card">
            <FiShoppingCart />
            <span>View Orders</span>
          </Link>
          <Link to="/admin/customers" className="action-card">
            <FiUsers />
            <span>Customer Records</span>
          </Link>
        </div>
      </div>

      {/* Business Info */}
      <div className="business-info-section">
        <h2>Business Information</h2>
        <div className="business-info-grid">
          <div className="business-info-item">
            <span className="info-label">Business Name</span>
            <span className="info-value">{BUSINESS_CONFIG.fullName}</span>
          </div>
          <div className="business-info-item">
            <span className="info-label">Owners</span>
            <span className="info-value">{BUSINESS_CONFIG.owners.map(o => o.name).join(', ')}</span>
          </div>
          <div className="business-info-item">
            <span className="info-label">Contact</span>
            <span className="info-value">{BUSINESS_CONFIG.contact.phones.join(', ')}</span>
          </div>
          <div className="business-info-item">
            <span className="info-label">Email</span>
            <span className="info-value">{BUSINESS_CONFIG.contact.email}</span>
          </div>
          <div className="business-info-item">
            <span className="info-label">UPI ID</span>
            <span className="info-value">{BUSINESS_CONFIG.payment.upiId}</span>
          </div>
          <div className="business-info-item">
            <span className="info-label">Location</span>
            <span className="info-value">{BUSINESS_CONFIG.location.fullAddress}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
