import { useState, useEffect } from 'react';
import { FiSearch, FiUser, FiShoppingBag, FiMail, FiPhone } from 'react-icons/fi';
import userService from '../../services/userService';
import toast from 'react-hot-toast';
import './CustomerRecords.css';

const CustomerRecords = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    activeThisMonth: 0,
    totalOrders: 0
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await userService.getAllCustomers();
      setCustomers(response.customers);
      setStats(response.stats || {
        total: response.customers.length,
        activeThisMonth: 0,
        totalOrders: 0
      });
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone?.includes(searchTerm);
    return matchesSearch;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="customer-records">
      <div className="page-title">
        <div>
          <h1>Customer Records</h1>
          <p>View and manage registered customers</p>
        </div>
      </div>

      {/* Stats */}
      <div className="customer-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <FiUser />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Customers</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon active">
            <FiUser />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.activeThisMonth}</span>
            <span className="stat-label">Active This Month</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orders">
            <FiShoppingBag />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.totalOrders}</span>
            <span className="stat-label">Total Orders</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="filters-bar">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Search by name, email or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Customers Grid */}
      <div className="customers-grid">
        {filteredCustomers.map(customer => (
          <div key={customer._id} className="customer-card">
            <div className="customer-avatar">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div className="customer-info">
              <h3>{customer.name}</h3>
              <div className="customer-detail">
                <FiMail />
                <span>{customer.email}</span>
              </div>
              <div className="customer-detail">
                <FiPhone />
                <span>{customer.phone || 'Not provided'}</span>
              </div>
            </div>
            <div className="customer-meta">
              <div className="meta-item">
                <span className="meta-label">Orders</span>
                <span className="meta-value">{customer.orderCount || 0}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Total Spent</span>
                <span className="meta-value">₹{(customer.totalSpent || 0).toLocaleString()}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Member Since</span>
                <span className="meta-value">{formatDate(customer.createdAt)}</span>
              </div>
            </div>
            {customer.address?.city && (
              <div className="customer-address">
                📍 {customer.address.city}, {customer.address.state}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredCustomers.length === 0 && (
        <div className="no-data">
          <FiUser size={48} />
          <h3>No Customers Found</h3>
          <p>No customers match your search criteria</p>
        </div>
      )}

      {/* Customer Table View */}
      <div className="table-section">
        <h2>All Customers</h2>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Orders</th>
                <th>Total Spent</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(customer => (
                <tr key={customer._id}>
                  <td>
                    <div className="table-customer">
                      <div className="avatar-small">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <span>{customer.name}</span>
                    </div>
                  </td>
                  <td>{customer.email}</td>
                  <td>{customer.phone || '-'}</td>
                  <td>{customer.orderCount || 0}</td>
                  <td>₹{(customer.totalSpent || 0).toLocaleString()}</td>
                  <td>{formatDate(customer.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CustomerRecords;
