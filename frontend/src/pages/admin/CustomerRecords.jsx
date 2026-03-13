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
      <div className="page-title max-md:!flex-col max-md:!items-start max-md:!gap-2 max-md:!p-4">
        <div>
          <h1 className="max-md:!text-2xl">Customer Records</h1>
          <p className="max-md:!text-sm">View and manage registered customers</p>
        </div>
      </div>

      {/* Stats */}
      <div className="customer-stats max-md:!grid max-md:!grid-cols-2 max-md:!gap-3 max-md:!p-4">
        <div className="stat-card max-md:!p-4 max-md:!flex-col max-md:!text-center">
          <div className="stat-icon max-md:!mx-auto">
            <FiUser />
          </div>
          <div className="stat-content">
            <span className="stat-value max-md:!text-xl">{stats.total}</span>
            <span className="stat-label max-md:!text-[10px]">Total</span>
          </div>
        </div>
        <div className="stat-card max-md:!p-4 max-md:!flex-col max-md:!text-center">
          <div className="stat-icon active max-md:!mx-auto">
            <FiUser />
          </div>
          <div className="stat-content">
            <span className="stat-value max-md:!text-xl">{stats.activeThisMonth}</span>
            <span className="stat-label max-md:!text-[10px]">Active</span>
          </div>
        </div>
        <div className="stat-card max-md:!p-4 max-md:!flex-col max-md:!text-center max-md:!col-span-2">
          <div className="stat-icon orders max-md:!mx-auto">
            <FiShoppingBag />
          </div>
          <div className="stat-content">
            <span className="stat-value max-md:!text-xl">{stats.totalOrders}</span>
            <span className="stat-label max-md:!text-[10px]">Total Orders</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="filters-bar max-md:!p-4">
        <div className="search-box max-md:!w-full">
          <FiSearch />
          <input
            type="text"
            placeholder="Search customers..."
            className="max-md:!text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Customers Grid */}
      <div className="customers-grid max-md:!grid-cols-1 max-md:!gap-4 max-md:!p-4">
        {filteredCustomers.map(customer => (
          <div key={customer._id} className="customer-card max-md:!p-5 max-md:!rounded-2xl !shadow-sm !border !border-gray-100">
            <div className="!flex !items-center !gap-4 !mb-4">
              <div className="customer-avatar !m-0 !w-12 !h-12 !text-lg">
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <div className="!flex-1">
                <h3 className="!text-lg !font-bold !text-slate-900 !m-0">{customer.name}</h3>
                <span className={`!text-[10px] !font-bold !uppercase !px-2 !py-0.5 !rounded-full ${customer.isActive !== false ? '!bg-green-100 !text-green-600' : '!bg-red-100 !text-red-600'}`}>
                  {customer.isActive !== false ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="!grid !grid-cols-1 !gap-2 !py-3 !border-y !border-dashed !border-gray-100">
              <div className="!flex !items-center !gap-2 !text-xs !text-slate-600">
                <FiMail size={12} className="!text-gray-400" />
                <span className="!break-all">{customer.email}</span>
              </div>
              <div className="!flex !items-center !gap-2 !text-xs !text-slate-600">
                <FiPhone size={12} className="!text-gray-400" />
                <span>{customer.phone || 'Not provided'}</span>
              </div>
              {customer.address?.city && (
                <div className="!flex !items-center !gap-2 !text-xs !text-slate-600">
                  <span className="!text-gray-400">📍</span>
                  <span>{customer.address.city}, {customer.address.state}</span>
                </div>
              )}
            </div>

            <div className="!flex !justify-between !items-center !mt-4 !mb-4">
              <div className="!text-center !flex-1">
                <small className="!text-[10px] !text-gray-400 !block !uppercase">Orders</small>
                <span className="!text-sm !font-bold">{customer.orderCount || 0}</span>
              </div>
              <div className="!w-[1px] !h-8 !bg-gray-100"></div>
              <div className="!text-center !flex-1">
                <small className="!text-[10px] !text-gray-400 !block !uppercase">Spent</small>
                <span className="!text-sm !font-bold">₹{(customer.totalSpent || 0).toLocaleString()}</span>
              </div>
              <div className="!w-[1px] !h-8 !bg-gray-100"></div>
              <div className="!text-center !flex-1">
                <small className="!text-[10px] !text-gray-400 !block !uppercase">Since</small>
                <span className="!text-sm !font-bold">{formatDate(customer.createdAt)}</span>
              </div>
            </div>

            <div className="!mt-auto">
              {customer.isActive !== false ? (
                <button
                  className="!w-full !flex !items-center !justify-center !gap-2 !py-3.5 !rounded-xl !bg-red-50 !text-red-600 !text-xs !font-bold"
                  onClick={() => handleAction(customer, 'deactivate')}
                >
                  <FiUserX size={14} /> Deactivate Account
                </button>
              ) : (
                <button
                  className="!w-full !flex !items-center !justify-center !gap-2 !py-3.5 !rounded-xl !bg-green-50 !text-green-600 !text-xs !font-bold"
                  onClick={() => handleAction(customer, 'reactivate')}
                >
                  <FiUserCheck size={14} /> Reactivate Account
                </button>
              )}
            </div>
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
      <div className="table-section max-md:!hidden">
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
        <div className="modal-overlay !p-0 max-md:!items-end" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-content max-md:!w-full max-md:!max-w-none max-md:!rounded-t-3xl max-md:!rounded-b-none max-md:!m-0 max-md:!p-6" onClick={e => e.stopPropagation()}>
            <div className="modal-icon warning !bg-amber-50 !text-amber-500 !w-16 !h-16 !flex !items-center !justify-center !rounded-full !mx-auto !mb-4">
              <FiAlertTriangle size={32} />
            </div>
            <h3 className="!text-center !text-xl !font-black !text-slate-900 !mb-2">
              {actionType === 'deactivate' && 'Deactivate Account?'}
              {actionType === 'reactivate' && 'Reactivate Account?'}
              {actionType === 'delete' && 'Delete Permanently?'}
            </h3>
            <p className="!text-center !text-sm !text-gray-500 !leading-relaxed !px-2">
              {actionType === 'deactivate' && (
                <>
                  Are you sure you want to deactivate <strong>{selectedCustomer?.name}</strong>'s account?
                  They will no longer be able to login.
                </>
              )}
              {actionType === 'reactivate' && (
                <>
                  Reactivate <strong>{selectedCustomer?.name}</strong>?
                  They will regain full access to their account immediately.
                </>
              )}
              {actionType === 'delete' && (
                <>
                  This action is permanent. Are you sure you want to delete
                  <strong> {selectedCustomer?.name}</strong>?
                </>
              )}
            </p>
            <div className="modal-actions !flex !flex-col !gap-3 !mt-8">
              <button
                className={`!w-full !py-4 !rounded-xl !font-bold !text-sm ${actionType === 'reactivate' ? '!bg-green-600 !text-white' : '!bg-red-600 !text-white'}`}
                onClick={confirmAction}
                disabled={actionLoading}
              >
                {actionLoading ? 'Processing...' : (
                  actionType === 'deactivate' ? 'Confirm Deactivation' :
                    actionType === 'reactivate' ? 'Confirm Reactivation' : 'Confirm Delete'
                )}
              </button>
              <button
                className="!w-full !py-4 !rounded-xl !font-bold !text-sm !text-gray-400 !bg-gray-50"
                onClick={() => setShowConfirmModal(false)}
                disabled={actionLoading}
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerRecords;
