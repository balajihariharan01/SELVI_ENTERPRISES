import { useState, useEffect } from 'react';
import { FiSearch, FiUser, FiShoppingBag, FiMail, FiPhone, FiUserX, FiUserCheck, FiAlertTriangle } from 'react-icons/fi';
import userService from '../../services/userService';
import toast from 'react-hot-toast';
import './CustomerRecords.css';

const CustomerRecords = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [actionType, setActionType] = useState(''); // 'deactivate' or 'delete'
  const [actionLoading, setActionLoading] = useState(false);
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

  const handleAction = (customer, type) => {
    setSelectedCustomer(customer);
    setActionType(type);
    setShowConfirmModal(true);
  };

  const confirmAction = async () => {
    if (!selectedCustomer) return;
    
    setActionLoading(true);
    try {
      if (actionType === 'deactivate') {
        await userService.deactivateUser(selectedCustomer._id);
        toast.success('Customer account deactivated successfully');
      } else if (actionType === 'reactivate') {
        await userService.reactivateUser(selectedCustomer._id);
        toast.success('Customer account reactivated successfully');
      } else if (actionType === 'delete') {
        await userService.deleteUser(selectedCustomer._id);
        toast.success('Customer deleted permanently');
      }
      fetchCustomers(); // Refresh list
    } catch (error) {
      toast.error(error.response?.data?.message || `Failed to ${actionType} customer`);
    } finally {
      setActionLoading(false);
      setShowConfirmModal(false);
      setSelectedCustomer(null);
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
            <div className="customer-actions">
              {customer.isActive !== false ? (
                <button 
                  className="btn btn-outline btn-sm btn-deactivate"
                  onClick={() => handleAction(customer, 'deactivate')}
                  title="Deactivate customer account"
                >
                  <FiUserX size={14} /> Deactivate
                </button>
              ) : (
                <button 
                  className="btn btn-outline btn-sm btn-reactivate"
                  onClick={() => handleAction(customer, 'reactivate')}
                  title="Reactivate customer account"
                >
                  <FiUserCheck size={14} /> Reactivate
                </button>
              )}
            </div>
            {customer.isActive === false && (
              <div className="customer-status-badge inactive">Inactive</div>
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
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(customer => (
                <tr key={customer._id} className={customer.isActive === false ? 'inactive-row' : ''}>
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
                  <td>
                    <span className={`status-badge ${customer.isActive !== false ? 'active' : 'inactive'}`}>
                      {customer.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{formatDate(customer.createdAt)}</td>
                  <td>
                    {customer.isActive !== false ? (
                      <button 
                        className="action-btn deactivate"
                        onClick={() => handleAction(customer, 'deactivate')}
                        title="Deactivate"
                      >
                        <FiUserX size={16} />
                      </button>
                    ) : (
                      <button 
                        className="action-btn reactivate"
                        onClick={() => handleAction(customer, 'reactivate')}
                        title="Reactivate"
                      >
                        <FiUserCheck size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-icon warning">
              <FiAlertTriangle size={32} />
            </div>
            <h3>
              {actionType === 'deactivate' && 'Deactivate Customer?'}
              {actionType === 'reactivate' && 'Reactivate Customer?'}
              {actionType === 'delete' && 'Delete Customer Permanently?'}
            </h3>
            <p>
              {actionType === 'deactivate' && (
                <>
                  Are you sure you want to deactivate <strong>{selectedCustomer?.name}</strong>'s account? 
                  They will no longer be able to login, but their order history will be preserved.
                </>
              )}
              {actionType === 'reactivate' && (
                <>
                  Are you sure you want to reactivate <strong>{selectedCustomer?.name}</strong>'s account?
                  They will be able to login again.
                </>
              )}
              {actionType === 'delete' && (
                <>
                  This action cannot be undone. Are you sure you want to permanently delete 
                  <strong> {selectedCustomer?.name}</strong>?
                </>
              )}
            </p>
            <div className="modal-actions">
              <button 
                className="btn btn-outline"
                onClick={() => setShowConfirmModal(false)}
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button 
                className={`btn ${actionType === 'reactivate' ? 'btn-success' : 'btn-danger'}`}
                onClick={confirmAction}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : (
                  actionType === 'deactivate' ? 'Deactivate' : 
                  actionType === 'reactivate' ? 'Reactivate' : 'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerRecords;
