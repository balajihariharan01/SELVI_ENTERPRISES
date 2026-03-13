import { useState, useEffect } from 'react';
import { FiSearch, FiEye, FiTruck, FiCheckCircle, FiXCircle, FiX, FiPackage, FiDownload, FiShoppingBag, FiClock, FiRefreshCw } from 'react-icons/fi';
import orderService from '../../services/orderService';
import { generateReceipt } from '../../utils/receiptGenerator';
import toast from 'react-hot-toast';
import './OrderManagement.css';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await orderService.getAllOrdersAdmin();
      setOrders(response.orders);
      setStats(response.stats);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      toast.success('Order status updated');
      fetchOrders();

      if (selectedOrder && selectedOrder._id === orderId) {
        setSelectedOrder({ ...selectedOrder, orderStatus: newStatus });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handleDownloadReceipt = async (order) => {
    try {
      await generateReceipt(order, true);
      toast.success('Receipt downloaded successfully');
    } catch (error) {
      console.error('Error generating receipt:', error);
      toast.error('Failed to generate receipt');
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || order.orderStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <FiPackage />;
      case 'confirmed': return <FiCheckCircle />;
      case 'processing': return <FiTruck />;
      case 'shipped': return <FiTruck />;
      case 'delivered': return <FiCheckCircle />;
      case 'cancelled': return <FiXCircle />;
      default: return <FiPackage />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
    <div className="order-management">
      <div className="page-title !flex !justify-between !items-center !mb-10 max-md:!flex-col max-md:!items-start max-md:!gap-6 max-md:!px-4">
        <div>
          <h1 className="!text-3xl !font-black !text-slate-900 max-md:!text-2xl">Fulfillment Log</h1>
          <p className="!text-sm !font-bold !text-gray-400 !uppercase !tracking-widest">Global Order Synchronization</p>
        </div>
      </div>

      {/* Stats */}
      <div className="order-stats !grid !grid-cols-4 !gap-6 !mb-12 max-xl:!grid-cols-2 max-md:!gap-4 max-md:!px-4">
        {[
          { label: 'Total Volume', value: stats?.total || 0, color: 'blue', icon: <FiShoppingBag /> },
          { label: 'Pending Bridge', value: stats?.pending || 0, color: 'amber', icon: <FiClock /> },
          { label: 'active Process', value: stats?.processing || 0, color: 'indigo', icon: <FiRefreshCw /> },
          { label: 'Successful', value: stats?.delivered || 0, color: 'emerald', icon: <FiCheckCircle /> }
        ].map((item, idx) => (
          <div key={idx} className="stat-card !bg-white !p-6 !rounded-3xl !border !border-gray-50 !shadow-sm !flex !items-center !gap-6">
            <div className={`!w-12 !h-12 !bg-${item.color}-50 !text-${item.color}-600 !rounded-2xl !flex !items-center !justify-center !text-xl !shrink-0`}>
              {item.icon}
            </div>
            <div className="!flex !flex-col">
              <span className="!text-2xl !font-black !text-slate-900">{item.value}</span>
              <span className="!text-[9px] !font-bold !text-gray-400 !uppercase !tracking-widest">{item.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filters-bar !flex !gap-6 !mb-10 max-md:!flex-col max-md:!px-4">
        <div className="search-box !flex-1 !relative">
          <FiSearch className="!absolute !left-6 !top-1/2 !-translate-y-1/2 !text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search Order Number or Customer..."
            className="!w-full !bg-white !border !border-gray-50 !rounded-2xl !pl-14 !pr-6 !py-4 !text-sm !font-medium focus:!border-blue-500 !shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select !min-w-[240px] !bg-white !border !border-gray-50 !rounded-2xl !px-6 !py-4 !text-sm !font-black !uppercase !tracking-widest !shadow-sm max-md:!w-full"
        >
          <option value="">Full Log Status</option>
          {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
            <option key={status} value={status}>{status.toUpperCase()}</option>
          ))}
        </select>
      </div>

      {/* Orders View */}
      <div className="table-container max-md:!hidden">
        <table className="table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order._id}>
                <td>
                  <strong>{order.orderNumber}</strong>
                </td>
                <td>
                  <div className="customer-cell">
                    <span>{order.user?.name || 'N/A'}</span>
                    <small>{order.user?.phone || ''}</small>
                  </div>
                </td>
                <td>{order.items.length} items</td>
                <td>₹{order.totalAmount.toLocaleString()}</td>
                <td>
                  <span className={`status-badge ${order.orderStatus}`}>
                    {getStatusIcon(order.orderStatus)}
                    {order.orderStatus}
                  </span>
                </td>
                <td>{formatDate(order.createdAt)}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="action-btn view"
                      onClick={() => viewOrderDetails(order)}
                      title="View Details"
                    >
                      <FiEye />
                    </button>
                    <button
                      className="action-btn download"
                      onClick={() => handleDownloadReceipt(order)}
                      title="Download Receipt"
                    >
                      <FiDownload />
                    </button>
                    <select
                      className="status-select"
                      value={order.orderStatus}
                      onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Orders View (Card List) */}
      <div className="hidden max-md:!flex max-md:!flex-col max-md:!gap-6 max-md:!p-4">
        {filteredOrders.map(order => (
          <div key={order._id} className="!bg-white !rounded-[2.5rem] !p-8 !shadow-sm !border !border-gray-50 !relative !overflow-hidden">
            <div className="!relative !z-10">
              <div className="!flex !justify-between !items-center !mb-6">
                <div className="!flex !flex-col">
                  <span className="!text-[9px] !font-black !text-gray-400 !uppercase !tracking-widest !mb-1">Reference ID</span>
                  <span className="!text-lg !font-black !text-slate-900">{order.orderNumber}</span>
                </div>
                <span className={`!px-4 !py-1.5 !rounded-full !text-[10px] !font-black !uppercase !tracking-widest !flex !items-center !gap-2 ${order.orderStatus === 'delivered' ? '!bg-emerald-50 !text-emerald-600' :
                    order.orderStatus === 'cancelled' ? '!bg-red-50 !text-red-600' : '!bg-blue-50 !text-blue-600'
                  }`}>
                  {getStatusIcon(order.orderStatus)}
                  {order.orderStatus}
                </span>
              </div>

              <div className="!grid !grid-cols-2 !gap-6 !mb-8">
                <div>
                  <span className="!text-[9px] !font-black !text-gray-400 !uppercase !tracking-widest !block !mb-1">Entity</span>
                  <span className="!text-sm !font-black !text-slate-900 !block !truncate">{order.user?.name}</span>
                </div>
                <div className="!text-right">
                  <span className="!text-[9px] !font-black !text-gray-400 !uppercase !tracking-widest !block !mb-1">Fiscal Total</span>
                  <span className="!text-sm !font-black !text-blue-600 !block">₹{order.totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="!flex !gap-2 !mb-6">
                <button
                  className="!flex-1 !flex !items-center !justify-center !gap-2 !bg-slate-50 !text-slate-900 !py-4 !rounded-2xl !text-xs !font-black !uppercase !tracking-widest hover:!bg-slate-100"
                  onClick={() => viewOrderDetails(order)}
                >
                  <FiEye size={16} /> Inspect
                </button>
                <button
                  className="!flex-1 !flex !items-center !justify-center !gap-2 !bg-blue-50 !text-blue-600 !py-4 !rounded-2xl !text-xs !font-black !uppercase !tracking-widest hover:!bg-blue-100"
                  onClick={() => handleDownloadReceipt(order)}
                >
                  <FiDownload size={16} /> Receipt
                </button>
              </div>

              <div className="!relative">
                <select
                  className="!w-full !appearance-none !bg-slate-900 !text-white !py-4 !px-6 !rounded-2xl !text-[10px] !font-black !uppercase !tracking-widest !outline-none"
                  value={order.orderStatus}
                  onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                >
                  <option value="pending">Shift to Pending</option>
                  <option value="confirmed">Confirm Protocol</option>
                  <option value="processing">Initialize Processing</option>
                  <option value="shipped">Deploy Shipment</option>
                  <option value="delivered">Finalize Delivery</option>
                  <option value="cancelled">Abort Order</option>
                </select>
                <div className="!absolute !right-6 !top-1/2 !-translate-y-1/2 !pointer-events-none !text-white/40">
                  <FiClock size={16} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredOrders.length === 0 && (
        <div className="no-data !py-20">
          <p className="!text-gray-400 !font-medium">No matches found for your search</p>
        </div>
      )}

      {/* Order Detail Modal */}
      {showModal && selectedOrder && (
        <div className="modal-overlay !p-0 max-md:!items-end">
          <div className="modal order-modal max-md:!w-full max-md:!max-w-none max-md:!h-[90vh] max-md:!rounded-t-3xl max-md:!rounded-b-none max-md:!m-0 max-md:!overflow-hidden !flex !flex-col">
            <div className="modal-header max-md:!px-5 max-md:!py-6 max-md:!border-b">
              <h2 className="max-md:!text-lg">Order {selectedOrder.orderNumber}</h2>
              <button className="close-btn !bg-gray-100 !p-2 !rounded-full" onClick={() => setShowModal(false)}>
                <FiX size={20} />
              </button>
            </div>
            <div className="modal-body !flex-1 !overflow-y-auto max-md:!p-5">
              <div className="order-info-grid max-md:!grid-cols-1 max-md:!gap-6">
                <div className="info-section">
                  <h3 className="max-md:!text-sm max-md:!mb-3 !text-blue-600">Customer Info</h3>
                  <div className="!space-y-2">
                    <p className="!flex !justify-between !text-sm"><strong>Name:</strong> <span>{selectedOrder.user?.name}</span></p>
                    <p className="!flex !justify-between !text-sm"><strong>Phone:</strong> <span>{selectedOrder.user?.phone}</span></p>
                    <p className="!flex !justify-between !text-sm"><strong>Email:</strong> <span>{selectedOrder.user?.email}</span></p>
                  </div>
                </div>
                <div className="info-section">
                  <h3 className="max-md:!text-sm max-md:!mb-3 !text-blue-600">Order Context</h3>
                  <div className="!space-y-2">
                    <p className="!flex !justify-between !text-sm"><strong>Payment:</strong> <span>{selectedOrder.paymentMethod}</span></p>
                    <p className="!flex !justify-between !text-sm"><strong>Date:</strong> <span>{formatDate(selectedOrder.createdAt)}</span></p>
                  </div>
                </div>
              </div>

              <div className="info-section !mt-8">
                <h3 className="max-md:!text-sm max-md:!mb-3 !text-blue-600">Delivery Address</h3>
                <p className="!text-sm !bg-gray-50 !p-4 !rounded-xl !leading-relaxed">
                  {selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.city}<br />
                  {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.pincode}
                </p>
              </div>

              <div className="info-section !mt-8">
                <h3 className="max-md:!text-sm max-md:!mb-3 !text-blue-600">Items Checklist</h3>
                <div className="hidden max-md:!flex max-md:!flex-col max-md:!gap-3">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="!flex !justify-between !items-center !p-3 !bg-white !border !border-gray-100 !rounded-xl">
                      <div className="!flex !flex-col">
                        <span className="!text-sm !font-bold">{item.product?.productName}</span>
                        <span className="!text-xs !text-gray-400">Qty: {item.quantity} × ₹{item.price}</span>
                      </div>
                      <span className="!font-bold !text-slate-900">₹{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                {/* Desktop items table hidden on mobile via CSS or here */}
                <table className="items-table max-md:!hidden">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Qty</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <strong>{item.product?.productName || 'Product'}</strong>
                          <br />
                          <small>{item.product?.brand}</small>
                        </td>
                        <td>₹{item.price.toLocaleString()}</td>
                        <td>{item.quantity}</td>
                        <td>₹{(item.price * item.quantity).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="order-totals !bg-slate-50 !p-5 !rounded-2xl !mt-8">
                <div className="total-row !text-gray-500">
                  <span>Subtotal:</span>
                  <span>₹{(selectedOrder.totalAmount - (selectedOrder.deliveryCharges || 0)).toLocaleString()}</span>
                </div>
                <div className="total-row !text-gray-500">
                  <span>Delivery:</span>
                  <span>₹{(selectedOrder.deliveryCharges || 0).toLocaleString()}</span>
                </div>
                <div className="total-row grand !text-slate-900 !pt-3 !mt-3 !border-t !border-gray-200">
                  <span>Grand Total:</span>
                  <span>₹{selectedOrder.totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="modal-actions max-md:!flex-col max-md:!gap-4 !mt-10">
                <button
                  className="btn btn-secondary !w-full !py-4 !rounded-xl !flex !justify-center !gap-3"
                  onClick={() => handleDownloadReceipt(selectedOrder)}
                >
                  <FiDownload size={20} /> Get Receipt PDF
                </button>
                <div className="status-update !w-full">
                  <label className="!text-[10px] !uppercase !font-bold !text-gray-400 !mb-2 !block">Quick Update Status</label>
                  <select
                    className="form-select !w-full !h-[56px] !rounded-xl !px-4 !bg-blue-600 !text-white !border-none !font-bold"
                    value={selectedOrder.orderStatus}
                    onChange={(e) => handleStatusUpdate(selectedOrder._id, e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
