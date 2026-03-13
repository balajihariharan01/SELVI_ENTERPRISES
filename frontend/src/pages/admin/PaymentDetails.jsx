import { useState, useEffect, useCallback } from 'react';
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
  FiAlertCircle,
  FiCheckSquare,
  FiInfo
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
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const [syncError, setSyncError] = useState(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [syncStatusFilter, setSyncStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');
  const [verifying, setVerifying] = useState(false);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setSyncError(null);
      const response = await paymentService.getAllPayments({
        status: statusFilter,
        method: methodFilter,
        syncStatus: syncStatusFilter,
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
      setLastSyncedAt(response.lastSyncedAt);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      toast.error('Failed to load payment data');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, methodFilter, syncStatusFilter, dateRange, searchTerm, currentPage]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

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

  const handleSyncPayments = async () => {
    try {
      setSyncing(true);
      setSyncError(null);

      const response = await paymentService.syncPayments();

      // Show detailed success message
      if (response.synced > 0) {
        toast.success(
          <div>
            <strong>Sync Complete!</strong>
            <br />
            ✓ {response.synced} payment(s) synced
            {response.skipped > 0 && <><br />↷ {response.skipped} already existed</>}
          </div>,
          { duration: 4000 }
        );
      } else if (response.skipped > 0) {
        toast.success('All payments are already synced', { duration: 3000 });
      } else {
        toast('No new payments found to sync', { icon: 'ℹ️', duration: 3000 });
      }

      // Show errors if any
      if (response.failed > 0 && response.errors?.length > 0) {
        toast.error(
          <div>
            <strong>{response.failed} sync error(s)</strong>
            <br />
            {response.errors.slice(0, 3).map((err, i) => (
              <span key={i}>• {err.orderNumber}: {err.reason}<br /></span>
            ))}
            {response.errors.length > 3 && <span>...and {response.errors.length - 3} more</span>}
          </div>,
          { duration: 6000 }
        );
      }

      fetchPayments();
    } catch (error) {
      console.error('Sync failed:', error);

      // Parse error response for detailed message
      const errorData = error.response?.data;
      let errorMessage = 'Failed to sync payments';

      if (errorData?.error) {
        switch (errorData.error.code) {
          case 'GATEWAY_ERROR':
            errorMessage = 'Payment gateway unavailable. Using local data.';
            break;
          case 'NETWORK_ERROR':
            errorMessage = 'Network error. Please check your connection.';
            break;
          case 'AUTH_ERROR':
            errorMessage = 'Authentication failed. Please re-login.';
            break;
          default:
            errorMessage = errorData.error.message || errorMessage;
        }
      }

      setSyncError({
        message: errorMessage,
        details: errorData?.error?.message,
        canRetry: true
      });

      toast.error(
        <div>
          <strong>Sync Failed</strong>
          <br />
          {errorMessage}
          <br />
          <small>Click to retry</small>
        </div>,
        { duration: 5000 }
      );
    } finally {
      setSyncing(false);
    }
  };

  const handleVerifyPayment = async (paymentId) => {
    try {
      setVerifying(true);
      const response = await paymentService.verifyPayment(paymentId);

      if (response.success) {
        toast.success(
          <div>
            <strong>Payment Verified</strong>
            <br />
            Gateway Status: {response.gatewayStatus}
          </div>
        );
        fetchPayments();
      }
    } catch (error) {
      const errorData = error.response?.data;
      if (errorData?.fallback) {
        toast.error(
          <div>
            <strong>Gateway Unavailable</strong>
            <br />
            Using local status: {errorData.fallback.localStatus}
          </div>,
          { duration: 4000 }
        );
      } else {
        toast.error(errorData?.message || 'Verification failed');
      }
    } finally {
      setVerifying(false);
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

  const formatLastSynced = (date) => {
    if (!date) return 'Never synced';
    const d = new Date(date);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setMethodFilter('all');
    setSyncStatusFilter('all');
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
      <div className="payment-header max-md:!flex-col max-md:!items-start max-md:!gap-6 max-md:!p-4">
        <div className="header-title">
          <h1 className="max-md:!text-2xl">Payment Details</h1>
          <p className="max-md:!text-sm">Track and manage all customer transactions</p>
        </div>
        <div className="header-actions max-md:!w-full max-md:!flex-col max-md:!gap-4">
          <div className="!flex !items-center !justify-between !w-full">
            <div className="last-synced-info !m-0">
              <FiClock size={12} />
              <span className="!text-[10px]">Synced: {formatLastSynced(lastSyncedAt)}</span>
            </div>
            <span className="live-badge !m-0">
              <span className="live-dot"></span>
              Live
            </span>
          </div>

          <div className="!flex !gap-2 !w-full">
            <button
              className={`btn-sync ${syncing ? 'syncing' : ''} !flex-1 !py-3.5 !rounded-xl !text-sm`}
              onClick={handleSyncPayments}
              disabled={syncing}
            >
              <FiDatabase size={16} className={syncing ? 'spin' : ''} />
              {syncing ? 'Syncing...' : 'Sync'}
            </button>
            <button
              className="btn-refresh !flex-1 !py-3.5 !rounded-xl !text-sm"
              onClick={fetchPayments}
              disabled={loading}
            >
              <FiRefreshCw size={16} className={loading ? 'spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Sync Error Banner */}
      {syncError && (
        <div className="sync-error-banner">
          <FiAlertCircle />
          <div className="error-content">
            <strong>{syncError.message}</strong>
            {syncError.details && <p>{syncError.details}</p>}
          </div>
          {syncError.canRetry && (
            <button onClick={handleSyncPayments} disabled={syncing}>
              <FiRefreshCw /> Retry
            </button>
          )}
          <button className="dismiss-btn" onClick={() => setSyncError(null)}>
            <FiX />
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="payment-stats max-md:!grid max-md:!grid-cols-2 max-md:!gap-3 max-md:!p-4">
        <div className="stat-card revenue max-md:!p-4 max-md:!flex-col max-md:!text-center">
          <div className="stat-icon max-md:!mx-auto"><FiDollarSign /></div>
          <div className="stat-content">
            <span className="stat-value max-md:!text-xl">{formatCurrency(stats.totalRevenue)}</span>
            <span className="stat-label max-md:!text-[10px]">Revenue</span>
          </div>
        </div>
        <div className="stat-card success max-md:!p-4 max-md:!flex-col max-md:!text-center">
          <div className="stat-icon max-md:!mx-auto"><FiCheckCircle /></div>
          <div className="stat-content">
            <span className="stat-value max-md:!text-xl">{stats.successfulPayments}</span>
            <span className="stat-label max-md:!text-[10px]">Success</span>
          </div>
        </div>
        <div className="stat-card pending max-md:!p-4 max-md:!flex-col max-md:!text-center">
          <div className="stat-icon max-md:!mx-auto"><FiClock /></div>
          <div className="stat-content">
            <span className="stat-value max-md:!text-xl">{stats.pendingPayments}</span>
            <span className="stat-label max-md:!text-[10px]">Pending</span>
          </div>
        </div>
        <div className="stat-card failed max-md:!p-4 max-md:!flex-col max-md:!text-center">
          <div className="stat-icon max-md:!mx-auto"><FiXCircle /></div>
          <div className="stat-content">
            <span className="stat-value max-md:!text-xl">{stats.failedPayments}</span>
            <span className="stat-label max-md:!text-[10px]">Failed</span>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section max-md:!flex-col max-md:!gap-4 max-md:!p-4">
        <div className="search-box max-md:!w-full">
          <FiSearch />
          <input
            type="text"
            placeholder="Search by ID, Order, or Name..."
            className="max-md:!text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              <FiX />
            </button>
          )}
        </div>

        <div className="filter-controls max-md:!grid max-md:!grid-cols-2 max-md:!gap-3 max-md:!w-full">
          <div className="filter-group max-md:!w-full">
            <FiFilter />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="max-md:!text-sm"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div className="filter-group max-md:!w-full">
            <FiCreditCard />
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="max-md:!text-sm"
            >
              <option value="all">Methods</option>
              <option value="stripe">Stripe</option>
              <option value="cod">COD</option>
              <option value="upi">UPI</option>
            </select>
          </div>

          <div className="filter-group max-md:!w-full max-md:!col-span-2">
            <FiDatabase />
            <select
              value={syncStatusFilter}
              onChange={(e) => setSyncStatusFilter(e.target.value)}
              className="max-md:!text-sm"
            >
              <option value="all">All Payment Sources</option>
              <option value="gateway">Gateway Payments</option>
              <option value="synced">Synced from Orders</option>
            </select>
          </div>

          {(searchTerm || statusFilter !== 'all' || methodFilter !== 'all' || syncStatusFilter !== 'all' || dateRange.start || dateRange.end) && (
            <button className="clear-filters-btn max-md:!col-span-2 max-md:!w-full max-md:!h-[48px] max-md:!justify-center" onClick={clearFilters}>
              <FiX /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Desktop Payment Table */}
      <div className="table-container max-md:!hidden">
        {payments.length === 0 && !loading ? (
          <div className="empty-state-container">
            <div className="empty-state-icon"><FiCreditCard /></div>
            <h3>No Transactions</h3>
            <p>Wait for customers to complete payments.</p>
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
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment, index) => (
                  <tr key={payment._id} style={{ animationDelay: `${index * 0.03}s` }}>
                    <td className="payment-id"><span className="id-badge">{payment.paymentId}</span></td>
                    <td className="order-id">{payment.orderNumber}</td>
                    <td className="customer-name">
                      <div className="customer-info">
                        <span className="name">{payment.customerName}</span>
                        <small className="email">{payment.customerEmail}</small>
                      </div>
                    </td>
                    <td className="payment-method">
                      <span className="method-badge">
                        {getMethodIcon(payment.paymentMethod)} {getMethodLabel(payment.paymentMethod)}
                      </span>
                    </td>
                    <td className="amount">{formatCurrency(payment.amount)}</td>
                    <td><span className={getStatusBadgeClass(payment.status)}>{getStatusLabel(payment.status)}</span></td>
                    <td className="date">{formatDate(payment.paymentDate || payment.createdAt)}</td>
                    <td className="actions">
                      <button className="action-btn view" onClick={() => handleViewDetails(payment)}><FiEye /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Previous</button>
                <span>Page {currentPage} of {totalPages}</span>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile Payment Cards */}
      <div className="hidden max-md:!flex max-md:!flex-col max-md:!gap-4 max-md:!p-4 max-md:!bg-gray-50/50">
        {payments.length === 0 && !loading ? (
          <div className="!py-12 !text-center">
            <FiCreditCard size={48} className="!mx-auto !text-gray-200 !mb-4" />
            <p className="!text-gray-400 !text-sm">No payment records found</p>
          </div>
        ) : (
          <>
            {payments.map(payment => (
              <div key={payment._id} className="!bg-white !rounded-2xl !p-5 !shadow-sm !border !border-gray-100 !flex !flex-col !gap-4" onClick={() => handleViewDetails(payment)}>
                <div className="!flex !justify-between !items-start">
                  <div className="!flex !flex-col">
                    <span className="!text-[10px] !font-bold !text-blue-600 !uppercase !tracking-wider">ID: #{payment.paymentId}</span>
                    <span className="!text-sm !font-bold !text-slate-900">Order: {payment.orderNumber}</span>
                  </div>
                  <span className={`${getStatusBadgeClass(payment.status)} !m-0 !py-1 !px-2.5 !text-[10px] !rounded-full`}>
                    {getStatusLabel(payment.status)}
                  </span>
                </div>

                <div className="!flex !items-center !gap-3 !py-3 !border-y !border-dashed !border-gray-100">
                  <div className="!w-10 !h-10 !bg-gray-50 !rounded-full !flex !items-center !justify-center !text-lg">
                    {getMethodIcon(payment.paymentMethod)}
                  </div>
                  <div className="!flex !flex-col !flex-1">
                    <span className="!text-sm !font-bold !text-slate-700">{payment.customerName}</span>
                    <span className="!text-[11px] !text-gray-400">{getMethodLabel(payment.paymentMethod)}</span>
                  </div>
                  <div className="!text-right">
                    <span className="!text-lg !font-black !text-slate-900">{formatCurrency(payment.amount)}</span>
                  </div>
                </div>

                <div className="!flex !justify-between !items-center">
                  <span className="!text-[11px] !text-gray-400">{formatDate(payment.paymentDate || payment.createdAt)}</span>
                  <button className="!bg-blue-50 !text-blue-600 !p-2.5 !rounded-lg"><FiEye size={16} /></button>
                </div>
              </div>
            ))}

            {/* Mobile Pagination */}
            {totalPages > 1 && (
              <div className="!flex !justify-between !items-center !mt-4 !bg-white !p-4 !rounded-2xl !shadow-sm">
                <button
                  disabled={currentPage === 1}
                  onClick={(e) => { e.stopPropagation(); setCurrentPage(p => p - 1); }}
                  className="!px-4 !py-2 !bg-gray-50 !rounded-lg !text-xs !font-bold !text-slate-600 disabled:!opacity-50"
                >
                  Prev
                </button>
                <span className="!text-[10px] !font-bold !text-gray-400">Page {currentPage} of {totalPages}</span>
                <button
                  disabled={currentPage === totalPages}
                  onClick={(e) => { e.stopPropagation(); setCurrentPage(p => p + 1); }}
                  className="!px-4 !py-2 !bg-blue-600 !text-white !rounded-lg !text-xs !font-bold disabled:!bg-gray-200"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Results info */}
      <div className="results-info max-md:!p-4 max-md:!text-center">
        {loading ? (
          <span><FiRefreshCw className="spin" /> Updating...</span>
        ) : (
          <span className="max-md:!text-xs max-md:!text-gray-400">Showing {payments.length} records</span>
        )}
      </div>

      {/* Detail Modal */}
      {showModal && selectedPayment && (
        <div className="modal-overlay !p-0 max-md:!items-end" onClick={() => setShowModal(false)}>
          <div className="payment-modal max-md:!w-full max-md:!max-w-none max-md:!h-[90vh] max-md:!rounded-t-3xl max-md:!rounded-b-none max-md:!m-0 max-md:!overflow-hidden !flex !flex-col" onClick={e => e.stopPropagation()}>
            <div className="modal-header max-md:!px-5 max-md:!py-6 max-md:!border-b">
              <h2 className="max-md:!text-lg">Payment Info</h2>
              <button className="close-btn !bg-gray-100 !p-2 !rounded-full" onClick={() => setShowModal(false)}>
                <FiX size={20} />
              </button>
            </div>

            <div className="modal-body !flex-1 !overflow-y-auto max-md:!p-5">
              <div className="detail-section">
                <h3 className="!text-blue-600 !text-sm !font-bold !mb-4"><FiCreditCard /> Transaction</h3>
                <div className="detail-grid max-md:!grid-cols-1">
                  <div className="!flex !justify-between !items-center !py-2 !border-b !border-gray-50">
                    <label className="!text-xs !text-gray-400 !uppercase !font-bold">ID</label>
                    <span className="!font-bold !text-slate-900">#{selectedPayment.paymentId}</span>
                  </div>
                  <div className="!flex !justify-between !items-center !py-2 !border-b !border-gray-50">
                    <label className="!text-xs !text-gray-400 !uppercase !font-bold">Status</label>
                    <span className={getStatusBadgeClass(selectedPayment.status)}>{getStatusLabel(selectedPayment.status)}</span>
                  </div>
                  <div className="!flex !justify-between !items-center !py-2 !border-b !border-gray-50">
                    <label className="!text-xs !text-gray-400 !uppercase !font-bold">Amount</label>
                    <span className="!text-xl !font-black !text-blue-600">{formatCurrency(selectedPayment.amount)}</span>
                  </div>
                  <div className="!flex !justify-between !items-center !py-2 !border-b !border-gray-50">
                    <label className="!text-xs !text-gray-400 !uppercase !font-bold">Method</label>
                    <span className="!text-sm !font-semibold">{getMethodIcon(selectedPayment.paymentMethod)} {getMethodLabel(selectedPayment.paymentMethod)}</span>
                  </div>
                  <div className="!flex !flex-col !gap-2 !py-4">
                    <label className="!text-xs !text-gray-400 !uppercase !font-bold">Transaction ID</label>
                    <div className="!flex !items-center !gap-2 !bg-gray-50 !p-3 !rounded-xl">
                      <span className="!flex-1 !text-[11px] !font-mono !break-all !text-slate-600">{selectedPayment.transactionId || 'N/A'}</span>
                      {selectedPayment.transactionId && (
                        <button className="!bg-white !p-2 !rounded-lg !shadow-sm" onClick={() => handleCopyTransactionId(selectedPayment.transactionId)}>
                          <FiCopy size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="detail-section !mt-8">
                <h3 className="!text-blue-600 !text-sm !font-bold !mb-4"><FiUser /> Customer</h3>
                <div className="!bg-slate-50 !p-5 !rounded-2xl !space-y-3">
                  <div className="!flex !justify-between">
                    <span className="!text-xs !text-gray-400">Name</span>
                    <span className="!text-sm !font-bold">{selectedPayment.customerName}</span>
                  </div>
                  <div className="!flex !justify-between">
                    <span className="!text-xs !text-gray-400">Email</span>
                    <span className="!text-sm !font-medium !text-blue-600">{selectedPayment.customerEmail}</span>
                  </div>
                  <div className="!flex !justify-between">
                    <span className="!text-xs !text-gray-400">Order</span>
                    <span className="!text-sm !font-bold">#{selectedPayment.orderNumber}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer max-md:!flex-col max-md:!gap-3 max-md:!p-5 !border-t">
              {selectedPayment.status === 'success' && (
                <button className="!w-full !bg-blue-600 !text-white !py-4 !rounded-xl !font-bold !flex !items-center !justify-center !gap-2" onClick={() => handleDownloadReceipt(selectedPayment)}>
                  <FiDownload /> Download Receipt
                </button>
              )}
              {selectedPayment.paymentMethod === 'stripe' && selectedPayment.stripePaymentIntentId && (
                <button className="!w-full !bg-blue-50 !text-blue-600 !py-4 !rounded-xl !font-bold !flex !items-center !justify-center !gap-2" onClick={() => handleVerifyPayment(selectedPayment._id)} disabled={verifying}>
                  <FiCheckSquare /> {verifying ? 'Verifying...' : 'Verify Transaction'}
                </button>
              )}
              <button className="!w-full !bg-gray-100 !text-gray-600 !py-4 !rounded-xl !font-bold" onClick={() => setShowModal(false)}>
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentDetails;
