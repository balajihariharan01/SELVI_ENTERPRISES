import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { FiArrowLeft, FiMapPin, FiPhone, FiUser, FiCalendar, FiPackage, FiDownload, FiEdit2, FiTrash2, FiX, FiPlus, FiMinus, FiCreditCard, FiLoader } from 'react-icons/fi';
import orderService from '../../services/orderService';
import paymentService from '../../services/paymentService';
import { generateReceipt } from '../../utils/receiptGenerator';
import CheckoutForm from '../../components/CheckoutForm';
import toast from 'react-hot-toast';
import './OrderDetail.css';

// Initialize Stripe with publishable key
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  // Payment states
  const [clientSecret, setClientSecret] = useState('');
  const [creatingPaymentIntent, setCreatingPaymentIntent] = useState(false);
  
  // Edit form state
  const [editItems, setEditItems] = useState([]);
  const [editAddress, setEditAddress] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const response = await orderService.getOrder(id);
      setOrder(response.order);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Order not found');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }

    setCancelling(true);
    try {
      await orderService.cancelOrder(id);
      toast.success('Order cancelled successfully');
      fetchOrder();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelling(false);
    }
  };

  const handleDownloadReceipt = async () => {
    setDownloading(true);
    try {
      await generateReceipt(order, false);
      toast.success('Receipt downloaded successfully');
    } catch (error) {
      console.error('Error generating receipt:', error);
      toast.error('Failed to generate receipt');
    } finally {
      setDownloading(false);
    }
  };

  // Open edit modal and populate form
  const openEditModal = () => {
    setEditItems(order.items.map(item => ({
      productId: item.product?._id || item.product,
      productName: item.productName,
      quantity: item.quantity,
      price: item.price,
      unit: item.unit
    })));
    setEditAddress({ ...order.shippingAddress });
    setEditNotes(order.notes || '');
    setShowEditModal(true);
  };

  // Handle quantity change in edit modal
  const handleQuantityChange = (index, delta) => {
    setEditItems(prev => {
      const updated = [...prev];
      const newQty = updated[index].quantity + delta;
      if (newQty >= 1) {
        updated[index].quantity = newQty;
      }
      return updated;
    });
  };

  // Remove item from edit
  const handleRemoveItem = (index) => {
    if (editItems.length === 1) {
      toast.error('Order must have at least one item');
      return;
    }
    setEditItems(prev => prev.filter((_, i) => i !== index));
  };

  // Handle address change
  const handleAddressChange = (field, value) => {
    setEditAddress(prev => ({ ...prev, [field]: value }));
  };

  // Submit order update
  const handleUpdateOrder = async () => {
    // Validate
    if (editItems.length === 0) {
      toast.error('Order must have at least one item');
      return;
    }

    if (!editAddress.name || !editAddress.phone || !editAddress.street || 
        !editAddress.city || !editAddress.state || !editAddress.pincode) {
      toast.error('Please fill in all address fields');
      return;
    }

    if (!/^[0-9]{10}$/.test(editAddress.phone)) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }

    if (!/^[0-9]{6}$/.test(editAddress.pincode)) {
      toast.error('Please enter a valid 6-digit pincode');
      return;
    }

    setUpdating(true);
    try {
      const updateData = {
        items: editItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        shippingAddress: editAddress,
        notes: editNotes
      };

      await orderService.updateOrder(id, updateData);
      toast.success('Order updated successfully');
      setShowEditModal(false);
      fetchOrder();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update order');
    } finally {
      setUpdating(false);
    }
  };

  // Handle delete order
  const handleDeleteOrder = async () => {
    setDeleting(true);
    try {
      await orderService.deleteOrder(id);
      toast.success('Order deleted successfully');
      navigate('/my-orders');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete order');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      confirmed: 'info',
      processing: 'info',
      shipped: 'primary',
      delivered: 'success',
      cancelled: 'danger'
    };
    return colors[status] || 'secondary';
  };

  // Handle opening payment modal
  const openPaymentModal = async () => {
    setShowPaymentModal(true);
    setCreatingPaymentIntent(true);
    
    try {
      const response = await paymentService.createPaymentIntent(
        order._id,
        order.totalAmount,
        null // email will be fetched from auth
      );
      setClientSecret(response.clientSecret);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to initialize payment');
      setShowPaymentModal(false);
    } finally {
      setCreatingPaymentIntent(false);
    }
  };

  // Handle successful payment
  const handlePaymentSuccess = async (paymentIntent) => {
    try {
      await paymentService.confirmPayment(paymentIntent.id, order._id);
      toast.success('Payment successful!');
      setShowPaymentModal(false);
      navigate(`/payment-success?orderId=${order._id}`);
    } catch (error) {
      toast.success('Payment processed! Refreshing...');
      setShowPaymentModal(false);
      fetchOrder();
    }
  };

  // Handle payment error
  const handlePaymentError = (error) => {
    toast.error(error.message || 'Payment failed');
  };

  // Stripe appearance config
  const stripeAppearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#2563eb',
      borderRadius: '8px',
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusSteps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
  
  const getCurrentStep = () => {
    if (order?.orderStatus === 'cancelled') return -1;
    return statusSteps.indexOf(order?.orderStatus);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="order-detail-page">
      <div className="page-header">
        <div className="container">
          <h1>Order Details</h1>
          <p>Order #{order.orderNumber}</p>
        </div>
      </div>

      <div className="container">
        <Link to="/my-orders" className="back-link">
          <FiArrowLeft /> Back to Orders
        </Link>

        <div className="order-detail-layout">
          {/* Order Status */}
          <div className="order-status-card">
            <div className="status-header">
              <div>
                <h3>Order Status</h3>
                <span className={`badge badge-${getStatusColor(order.orderStatus)} badge-lg`}>
                  {order.orderStatus}
                </span>
              </div>
              <div className="status-actions">
                {/* Download Receipt Button */}
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={handleDownloadReceipt}
                  disabled={downloading}
                  title="Download Receipt"
                >
                  <FiDownload /> {downloading ? 'Generating...' : 'Receipt'}
                </button>
                
                {/* Pay Now Button - for online orders with pending payment */}
                {order.paymentMethod === 'online' && order.paymentStatus === 'pending' && order.orderStatus !== 'cancelled' && (
                  <button 
                    className="btn btn-success btn-sm"
                    onClick={openPaymentModal}
                    title="Complete Payment"
                  >
                    <FiCreditCard /> Pay Now
                  </button>
                )}
                
                {order.orderStatus === 'pending' && (
                  <>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={openEditModal}
                      title="Edit Order"
                    >
                      <FiEdit2 /> Edit
                    </button>
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => setShowDeleteModal(true)}
                      title="Delete Order"
                    >
                      <FiTrash2 /> Delete
                    </button>
                  </>
                )}
              </div>
            </div>

            {order.orderStatus !== 'cancelled' && (
              <div className="status-timeline">
                {statusSteps.map((step, index) => (
                  <div 
                    key={step} 
                    className={`timeline-step ${index <= getCurrentStep() ? 'completed' : ''}`}
                  >
                    <div className="step-indicator">
                      {index <= getCurrentStep() ? '✓' : index + 1}
                    </div>
                    <span className="step-label">{step}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="order-details-grid">
            {/* Order Items */}
            <div className="detail-card order-items-card">
              <h3><FiPackage /> Order Items</h3>
              <div className="items-list">
                {order.items.map((item, index) => (
                  <div key={index} className="item-row">
                    <div className="item-info">
                      <span className="item-name">{item.productName}</span>
                      <span className="item-unit">₹{item.price.toLocaleString()} per {item.unit}</span>
                    </div>
                    <div className="item-qty">x {item.quantity}</div>
                    <div className="item-subtotal">₹{item.subtotal.toLocaleString()}</div>
                  </div>
                ))}
              </div>
              <div className="order-total-row">
                <span>Total Amount</span>
                <span className="order-total">₹{order.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="detail-card">
              <h3><FiMapPin /> Delivery Address</h3>
              <div className="address-details">
                <p className="address-name">
                  <FiUser /> {order.shippingAddress.name}
                </p>
                <p className="address-phone">
                  <FiPhone /> {order.shippingAddress.phone}
                </p>
                <p className="address-text">
                  {order.shippingAddress.street}<br />
                  {order.shippingAddress.city}, {order.shippingAddress.state}<br />
                  {order.shippingAddress.pincode}
                </p>
              </div>
            </div>

            {/* Order Info */}
            <div className="detail-card">
              <h3><FiCalendar /> Order Information</h3>
              <div className="info-rows">
                <div className="info-row">
                  <span>Order Number</span>
                  <span>{order.orderNumber}</span>
                </div>
                <div className="info-row">
                  <span>Order Date</span>
                  <span>{formatDate(order.createdAt)}</span>
                </div>
                <div className="info-row">
                  <span>Payment Method</span>
                  <span>{order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod === 'online' ? 'Online Payment' : order.paymentMethod}</span>
                </div>
                <div className="info-row">
                  <span>Payment Status</span>
                  <span className={`badge badge-${order.paymentStatus === 'paid' ? 'success' : order.paymentStatus === 'failed' ? 'danger' : 'warning'}`}>
                    {order.paymentStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Order Modal */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal edit-order-modal">
            <div className="modal-header">
              <h2><FiEdit2 /> Edit Order</h2>
              <button className="close-btn" onClick={() => setShowEditModal(false)}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              {/* Edit Items */}
              <div className="edit-section">
                <h3>Order Items</h3>
                <div className="edit-items-list">
                  {editItems.map((item, index) => (
                    <div key={index} className="edit-item-row">
                      <div className="edit-item-info">
                        <span className="edit-item-name">{item.productName}</span>
                        <span className="edit-item-price">₹{item.price}/{item.unit}</span>
                      </div>
                      <div className="edit-item-controls">
                        <button 
                          className="qty-btn"
                          onClick={() => handleQuantityChange(index, -1)}
                          disabled={item.quantity <= 1}
                        >
                          <FiMinus />
                        </button>
                        <span className="qty-display">{item.quantity}</span>
                        <button 
                          className="qty-btn"
                          onClick={() => handleQuantityChange(index, 1)}
                        >
                          <FiPlus />
                        </button>
                        <button 
                          className="remove-btn"
                          onClick={() => handleRemoveItem(index)}
                          title="Remove item"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                      <div className="edit-item-subtotal">
                        ₹{(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="edit-total">
                  <span>Total:</span>
                  <span>₹{editItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Edit Address */}
              <div className="edit-section">
                <h3>Delivery Address</h3>
                <div className="edit-form-grid">
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      value={editAddress.name}
                      onChange={(e) => handleAddressChange('name', e.target.value)}
                      placeholder="Full name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="text"
                      value={editAddress.phone}
                      onChange={(e) => handleAddressChange('phone', e.target.value)}
                      placeholder="10-digit phone number"
                      maxLength="10"
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Street Address</label>
                    <input
                      type="text"
                      value={editAddress.street}
                      onChange={(e) => handleAddressChange('street', e.target.value)}
                      placeholder="Street address"
                    />
                  </div>
                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      value={editAddress.city}
                      onChange={(e) => handleAddressChange('city', e.target.value)}
                      placeholder="City"
                    />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input
                      type="text"
                      value={editAddress.state}
                      onChange={(e) => handleAddressChange('state', e.target.value)}
                      placeholder="State"
                    />
                  </div>
                  <div className="form-group">
                    <label>Pincode</label>
                    <input
                      type="text"
                      value={editAddress.pincode}
                      onChange={(e) => handleAddressChange('pincode', e.target.value)}
                      placeholder="6-digit pincode"
                      maxLength="6"
                    />
                  </div>
                </div>
              </div>

              {/* Edit Notes */}
              <div className="edit-section">
                <h3>Order Notes (Optional)</h3>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Add any special instructions..."
                  rows="3"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-outline"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleUpdateOrder}
                disabled={updating}
              >
                {updating ? 'Updating...' : 'Update Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal delete-modal">
            <div className="modal-header">
              <h2><FiTrash2 /> Delete Order</h2>
              <button className="close-btn" onClick={() => setShowDeleteModal(false)}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="delete-warning">
                <div className="warning-icon">⚠️</div>
                <h3>Are you sure you want to delete this order?</h3>
                <p>Order #{order.orderNumber} will be permanently deleted. This action cannot be undone.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-outline"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleDeleteOrder}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay">
          <div className="modal payment-modal">
            <div className="modal-header">
              <h2><FiCreditCard /> Complete Payment</h2>
              <button className="close-btn" onClick={() => setShowPaymentModal(false)}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <div className="payment-order-summary">
                <p>Order #{order.orderNumber}</p>
                <p className="payment-amount">Amount: ₹{order.totalAmount?.toLocaleString()}</p>
              </div>
              
              {creatingPaymentIntent ? (
                <div className="payment-loading">
                  <FiLoader className="spinner-large" />
                  <p>Initializing secure payment...</p>
                </div>
              ) : clientSecret ? (
                <Elements 
                  stripe={stripePromise} 
                  options={{ clientSecret, appearance: stripeAppearance }}
                >
                  <CheckoutForm
                    orderId={order._id}
                    amount={order.totalAmount}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                </Elements>
              ) : (
                <div className="payment-error-state">
                  <p>Failed to initialize payment. Please try again.</p>
                  <button 
                    className="btn btn-primary"
                    onClick={openPaymentModal}
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
