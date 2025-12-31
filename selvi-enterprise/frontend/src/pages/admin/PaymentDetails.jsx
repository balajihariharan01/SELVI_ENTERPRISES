import { useState, useEffect } from 'react';
import { 
  FiDollarSign, 
  FiCheckCircle, 
  FiClock, 
  FiXCircle,
  FiSearch,
  FiFilter,
  FiCalendar,
  FiEye,
  FiCopy,
  FiDownload,
  FiX,
  FiCreditCard,
  FiUser,
  FiPackage,
  FiHash,
  FiRefreshCw,
  FiDatabase,
  FiAlertCircle
} from 'react-icons/fi';
import paymentService from '../../services/paymentService';
import { generateReceipt } from '../../utils/receiptGenerator';
import toast from 'react-hot-toast';
import './PaymentDetails.css';

const PaymentDetails = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    successfulPayments: 0,
    pendingPayments: 0,
    failedPayments: 0,
    totalPayments: 0
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');

  useEffect(() => {
    fetchPayments();
  }, [statusFilter, methodFilter, dateRange, currentPage]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchPayments();
      } else {
        setCurrentPage(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getAllPayments({
        status: statusFilter,
        method: methodFilter,
        startDate: dateRange.start,
        endDate: dateRange.end,
        search: searchTerm,
        page: currentPage,
        limit: 50
      });

      setPayments(response.payments || []);
      setStats(response.stats || {
        totalRevenue: 0,
        successfulPayments: 0,
        pendingPayments: 0,
        failedPayments: 0,
        totalPayments: 0
      });
      setTotalPages(response.pages || 1);
      setTotalRecords(response.total || 0);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      toast.error('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncPayments = async () => {
    try {
      setSyncing(true);
      const response = await paymentService.syncPayments();
      toast.success(response.message || 'Payments synced successfully');
      fetchPayments();
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Failed to sync payments');
    } finally {
      setSyncing(false);
    }
  };

  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
    setShowModal(true);
  };

  const handleCopyTransactionId = async (transactionId) => {
    try {
      await navigator.clipboard.writeText(transactionId);
      setCopySuccess('Copied!');
      toast.success('Transaction ID copied');
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy');
    }
  };

  const handleDownloadReceipt = (payment) => {
    // Create order-like object for receipt generator
    const orderForReceipt = {
      orderNumber: payment.orderNumber,
      createdAt: payment.paymentDate || payment.createdAt,
      items: payment.order?.items || [],
      totalAmount: payment.amount,
      paymentMethod: payment.paymentMethod,
      paymentStatus: payment.status === 'success' ? 'paid' : payment.status,
      paymentIntentId: payment.transactionId,
      shippingAddress: payment.order?.shippingAddress
    };
    generateReceipt(orderForReceipt);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const maskTransactionId = (id) => {
    if (!id) return 'N/A';
    if (id.length <= 8) return id;
    return `${id.slice(0, 4)}****${id.slice(-4)}`;
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'success': 
      case 'paid': 
        return 'status-badge success';
      case 'pending': 
      case 'processing': 
        return 'status-badge pending';
      case 'failed': 
        return 'status-badge failed';
      case 'refunded':
        return 'status-badge refunded';
      case 'cancelled':
        return 'status-badge cancelled';
      default: 
        return 'status-badge';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'success': return 'Success';
      case 'paid': return 'Paid';
      case 'pending': return 'Pending';
      case 'processing': return 'Processing';
      case 'failed': return 'Failed';
      case 'refunded': return 'Refunded';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const getMethodIcon = (method) => {
    switch (method?.toLowerCase()) {
      case 'stripe': return '💳';
      case 'cod': return '💵';
      case 'upi': return '📱';
      case 'credit': return '📝';
      default: return '💰';
    }
  };

  const getMethodLabel = (method) => {
    switch (method?.toLowerCase()) {
      case 'stripe': return 'Stripe';
      case 'cod': return 'Cash on Delivery';
      case 'upi': return 'UPI';
      case 'credit': return 'Credit';
      default: return method || 'N/A';
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setMethodFilter('all');
    setDateRange({ start: '', end: '' });
    setCurrentPage(1);
  };

  if (loading && payments.length === 0) {
    return (
      <div className="payment-details loading-state">
        <div className="loading-spinner">
          <FiRefreshCw className="spin" />
          <p>Loading payment details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-details">
      {/* Header Section */}
      <div className="page-header">
        <div className="header-content">
          <h1>Payment Details</h1>
          <p>Track and manage all customer payment transactions</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-sync"
            onClick={handleSyncPayments}
            disabled={syncing}
            title="Sync payments from orders"
          >
            <FiDatabase className={syncing ? 'spin' : ''} />
            {syncing ? 'Syncing...' : 'Sync Payments'}
          </button>
          <button 
            className="btn-refresh"
            onClick={fetchPayments}
            disabled={loading}
            title="Refresh data"
          >
            <FiRefreshCw className={loading ? 'spin' : ''} />
            Refresh
          </button>
          <span className="live-badge">
            <span className="live-dot"></span>
            Live
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="payment-stats">
        <div className="stat-card revenue">
          <div className="stat-icon">
            <FiDollarSign />
          </div>
          <div className="stat-content">
            <span className="stat-value">{formatCurrency(stats.totalRevenue)}</span>
            <span className="stat-label">Total Revenue</span>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">
            <FiCheckCircle />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.successfulPayments}</span>
            <span className="stat-label">Successful Payments</span>
          </div>
        </div>

        <div className="stat-card pending">
          <div className="stat-icon">
            <FiClock />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.pendingPayments}</span>
            <span className="stat-label">Pending Payments</span>
          </div>
        </div>

        <div className="stat-card failed">
          <div className="stat-icon">
            <FiXCircle />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.failedPayments}</span>
            <span className="stat-label">Failed Payments</span>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Search by Payment ID, Order ID, Customer, or Transaction ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              <FiX />
            </button>
          )}
        </div>

        <div className="filter-controls">
          <div className="filter-group">
            <FiFilter />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div className="filter-group">
            <FiCreditCard />
            <select 
              value={methodFilter} 
              onChange={(e) => setMethodFilter(e.target.value)}
            >
              <option value="all">All Methods</option>
              <option value="stripe">Stripe</option>
              <option value="cod">Cash on Delivery</option>
              <option value="upi">UPI</option>
            </select>
          </div>

          <div className="filter-group date-range">
            <FiCalendar />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              placeholder="Start Date"
            />
            <span className="date-separator">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              placeholder="End Date"
            />
          </div>

          {(searchTerm || statusFilter !== 'all' || methodFilter !== 'all' || dateRange.start || dateRange.end) && (
            <button className="clear-filters-btn" onClick={clearFilters}>
              <FiX /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Payment Table */}
      <div className="table-container">
        {payments.length === 0 && !loading ? (
          <div className="empty-state-container">
            <div className="empty-state-icon">
              <FiCreditCard />
            </div>
            <h3>No Payment Transactions Yet</h3>
            <p>Payment records will appear here once customers complete their transactions.</p>
            <button className="btn-sync-empty" onClick={handleSyncPayments} disabled={syncing}>
              <FiDatabase /> {syncing ? 'Syncing...' : 'Sync from Orders'}
            </button>
          </div>
        ) : (
          <>
            <table className="payment-table">
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Transaction ID</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment, index) => (
                  <tr key={payment._id} style={{ animationDelay: `${index * 0.03}s` }}>
                    <td className="payment-id">
                      <span className="id-badge">{payment.paymentId}</span>
                    </td>
                    <td className="order-id">{payment.orderNumber}</td>
                    <td className="customer-name">
                      <div className="customer-info">
                        <span className="name">{payment.customerName}</span>
                        <span className="email">{payment.customerEmail}</span>
                      </div>
                    </td>
                    <td className="payment-method">
                      <span className="method-badge">
                        {getMethodIcon(payment.paymentMethod)} {getMethodLabel(payment.paymentMethod)}
                      </span>
                    </td>
                    <td className="amount">{formatCurrency(payment.amount)}</td>
                    <td>
                      <span className={getStatusBadgeClass(payment.status)}>
                        {getStatusLabel(payment.status)}
                      </span>
                    </td>
                    <td className="transaction-id">
                      <span className="txn-id" title={payment.transactionId}>
                        {maskTransactionId(payment.transactionId)}
                      </span>
                    </td>
                    <td className="date">{formatDate(payment.paymentDate || payment.createdAt)}</td>
                    <td className="actions">
                      <button 
                        className="action-btn view"
                        onClick={() => handleViewDetails(payment)}
                        title="View Details"
                      >
                        <FiEye />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  Previous
                </button>
                <span>Page {currentPage} of {totalPages}</span>
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Results count */}
      <div className="results-info">
        {loading ? (
          <span><FiRefreshCw className="spin" /> Loading...</span>
        ) : (
          <span>Showing {payments.length} of {totalRecords} payment records</span>
        )}
      </div>

      {/* Payment Details Modal */}
      {showModal && selectedPayment && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="payment-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Payment Details</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <FiX />
              </button>
            </div>

            <div className="modal-body">
              {/* Payment Info Section */}
              <div className="detail-section">
                <h3><FiCreditCard /> Payment Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Payment ID</label>
                    <span className="id-value">{selectedPayment.paymentId}</span>
                  </div>
                  <div className="detail-item">
                    <label>Status</label>
                    <span className={getStatusBadgeClass(selectedPayment.status)}>
                      {getStatusLabel(selectedPayment.status)}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Amount</label>
                    <span className="amount-large">{formatCurrency(selectedPayment.amount)}</span>
                  </div>
                  <div className="detail-item">
                    <label>Payment Method</label>
                    <span>{getMethodIcon(selectedPayment.paymentMethod)} {getMethodLabel(selectedPayment.paymentMethod)}</span>
                  </div>
                  <div className="detail-item full-width">
                    <label>Transaction ID</label>
                    <div className="transaction-copy">
                      <span>{selectedPayment.transactionId || 'N/A'}</span>
                      {selectedPayment.transactionId && (
                        <button 
                          className="copy-btn"
                          onClick={() => handleCopyTransactionId(selectedPayment.transactionId)}
                        >
                          <FiCopy />
                          {copySuccess || 'Copy'}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="detail-item">
                    <label>Payment Date</label>
                    <span>{formatDate(selectedPayment.paymentDate || selectedPayment.createdAt)}</span>
                  </div>
                  {selectedPayment.failureReason && (
                    <div className="detail-item full-width">
                      <label>Failure Reason</label>
                      <span className="failure-reason">{selectedPayment.failureReason}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Info Section */}
              <div className="detail-section">
                <h3><FiPackage /> Order Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Order ID</label>
                    <span>{selectedPayment.orderNumber}</span>
                  </div>
                  <div className="detail-item">
                    <label>Items</label>
                    <span>{selectedPayment.order?.items?.length || 0} item(s)</span>
                  </div>
                </div>
                {selectedPayment.order?.items && selectedPayment.order.items.length > 0 && (
                  <div className="items-list">
                    {selectedPayment.order.items.map((item, idx) => (
                      <div key={idx} className="item-row">
                        <span className="item-name">{item.productName}</span>
                        <span className="item-qty">x{item.quantity} {item.unit}</span>
                        <span className="item-price">{formatCurrency(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Customer Info Section */}
              <div className="detail-section">
                <h3><FiUser /> Customer Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Name</label>
                    <span>{selectedPayment.customerName}</span>
                  </div>
                  <div className="detail-item">
                    <label>Email</label>
                    <span>{selectedPayment.customerEmail}</span>
                  </div>
                  <div className="detail-item">
                    <label>Phone</label>
                    <span>{selectedPayment.customerPhone || 'N/A'}</span>
                  </div>
                  {selectedPayment.order?.shippingAddress && (
                    <div className="detail-item full-width">
                      <label>Shipping Address</label>
                      <span>
                        {selectedPayment.order.shippingAddress.street}, {selectedPayment.order.shippingAddress.city}, {selectedPayment.order.shippingAddress.state} - {selectedPayment.order.shippingAddress.pincode}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Close
              </button>
              {selectedPayment.status === 'success' && (
                <button 
                  className="btn-primary"
                  onClick={() => handleDownloadReceipt(selectedPayment)}
                >
                  <FiDownload /> Download Receipt
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentDetails;
