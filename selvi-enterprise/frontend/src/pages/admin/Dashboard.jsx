import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPackage, FiShoppingCart, FiUsers, FiAlertTriangle, FiTrendingUp, FiDollarSign } from 'react-icons/fi';
import orderService from '../../services/orderService';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
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
        <p>Welcome to Selvi Enterprise Admin Panel</p>
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
        {/* Revenue Cards */}
        <div className="revenue-section">
          <h2>Revenue Overview</h2>
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
    </div>
  );
};

export default Dashboard;
