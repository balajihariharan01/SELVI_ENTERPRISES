import { useState, useEffect } from 'react';
import { FiSearch, FiEye, FiTruck, FiCheckCircle, FiXCircle, FiX, FiPackage, FiDownload } from 'react-icons/fi';
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
      <div className="page-title">
        <div>
          <h1>Order Management</h1>
          <p>Track and manage customer orders</p>
        </div>
      </div>

      {/* Stats */}
      <div className="order-stats">
        <div className="stat-card">
          <span className="stat-value">{stats?.total || 0}</span>
          <span className="stat-label">Total Orders</span>
        </div>
        <div className="stat-card pending">
          <span className="stat-value">{stats?.pending || 0}</span>
          <span className="stat-label">Pending</span>
        </div>
        <div className="stat-card processing">
          <span className="stat-value">{stats?.processing || 0}</span>
          <span className="stat-label">Processing</span>
        </div>
        <div className="stat-card delivered">
          <span className="stat-value">{stats?.delivered || 0}</span>
          <span className="stat-label">Delivered</span>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Search by order number or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="table-container">
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

        {filteredOrders.length === 0 && (
          <div className="no-data">
            <p>No orders found</p>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {showModal && selectedOrder && (
        <div className="modal-overlay">
          <div className="modal order-modal">
            <div className="modal-header">
              <h2>Order Details - {selectedOrder.orderNumber}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="order-info-grid">
                <div className="info-section">
                  <h3>Customer Info</h3>
                  <p><strong>Name:</strong> {selectedOrder.user?.name}</p>
                  <p><strong>Phone:</strong> {selectedOrder.user?.phone}</p>
                  <p><strong>Email:</strong> {selectedOrder.user?.email}</p>
                </div>
                <div className="info-section">
                  <h3>Order Info</h3>
                  <p><strong>Status:</strong> 
                    <span className={`status-badge ${selectedOrder.orderStatus}`}>
                      {selectedOrder.orderStatus}
                    </span>
                  </p>
                  <p><strong>Date:</strong> {formatDate(selectedOrder.createdAt)}</p>
                  <p><strong>Payment:</strong> {selectedOrder.paymentMethod}</p>
                </div>
              </div>

              <div className="info-section">
                <h3>Delivery Address</h3>
                <p>
                  {selectedOrder.shippingAddress?.street}, {selectedOrder.shippingAddress?.city}<br />
                  {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.pincode}
                </p>
              </div>

              <div className="info-section">
                <h3>Order Items</h3>
                <table className="items-table">
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

              <div className="order-totals">
                <div className="total-row">
                  <span>Subtotal:</span>
                  <span>₹{(selectedOrder.totalAmount - (selectedOrder.deliveryCharges || 0)).toLocaleString()}</span>
                </div>
                <div className="total-row">
                  <span>Delivery:</span>
                  <span>₹{(selectedOrder.deliveryCharges || 0).toLocaleString()}</span>
                </div>
                <div className="total-row grand">
                  <span>Total:</span>
                  <span>₹{selectedOrder.totalAmount.toLocaleString()}</span>
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => handleDownloadReceipt(selectedOrder)}
                >
                  <FiDownload /> Download Receipt
                </button>
                <div className="status-update">
                  <label>Update Status:</label>
                  <select
                    className="form-select"
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
