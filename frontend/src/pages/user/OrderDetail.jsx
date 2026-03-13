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
      <div className="page-header !bg-slate-900 !text-white !py-12 max-md:!py-8 max-md:!px-4">
        <div className="container !max-w-7xl !mx-auto">
          <Link to="/my-orders" className="!inline-flex !items-center !gap-2 !text-blue-400 !text-sm !font-bold !mb-6 hover:!text-blue-300">
            <FiArrowLeft /> Back to My Orders
          </Link>
          <div className="!flex !justify-between !items-end max-md:!flex-col max-md:!items-start max-md:!gap-4">
            <div>
              <h1 className="!text-3xl !font-black !mb-2">Order Details</h1>
              <p className="!text-sm !text-gray-400 !font-mono">Reference: #{order.orderNumber}</p>
            </div>
            <div className="!flex !gap-3 max-md:!w-full">
              <button
                className="!flex-1 !flex !items-center !justify-center !gap-2 !px-6 !py-3 !bg-blue-600 !text-white !rounded-xl !text-sm !font-bold !transition-all hover:!bg-blue-700"
                onClick={handleDownloadReceipt}
                disabled={downloading}
              >
                <FiDownload /> {downloading ? 'Wait...' : 'Receipt'}
              </button>
              {order.orderStatus === 'pending' && order.isModifiable && (
                <button
                  className="!flex-1 !flex !items-center !justify-center !gap-2 !px-6 !py-3 !bg-slate-800 !text-white !rounded-xl !text-sm !font-bold !border !border-slate-700"
                  onClick={openEditModal}
                >
                  <FiEdit2 /> Edit
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container !max-w-7xl !mx-auto !py-8 max-md:!px-0">

        <div className="order-detail-layout">
          {/* Order Status */}
          <div className="order-status-card !bg-white !rounded-3xl !p-8 !shadow-sm !border !border-gray-100 !mb-8 max-md:!rounded-none max-md:!p-6 max-md:!border-x-0">
            <div className="status-header !flex !justify-between !items-center !mb-10 max-md:!flex-col max-md:!items-start max-md:!gap-6">
              <div className="!flex !items-center !gap-4">
                <div className="!w-12 !h-12 !bg-blue-50 !text-blue-600 !rounded-2xl !flex !items-center !justify-center !text-xl">
                  <FiPackage />
                </div>
                <div>
                  <h3 className="!text-sm !font-bold !text-gray-400 !uppercase !tracking-widest !mb-1">Current Status</h3>
                  <span className={`!px-4 !py-1.5 !rounded-lg !text-xs !font-black !uppercase !tracking-wider badge-${getStatusColor(order.orderStatus)}`}>
                    {order.orderStatus}
                  </span>
                </div>
              </div>

              <div className="status-actions max-md:!w-full">
                {order.paymentMethod === 'online' && order.paymentStatus === 'pending' && order.orderStatus !== 'cancelled' && (
                  <button
                    className="!w-full !flex !items-center !justify-center !gap-2 !py-4 !bg-green-600 !text-white !rounded-2xl !font-black !text-sm !shadow-lg !shadow-green-100"
                    onClick={openPaymentModal}
                  >
                    <FiCreditCard size={18} /> Pay Total: ₹{order.totalAmount.toLocaleString()}
                  </button>
                )}

                {order.orderStatus === 'pending' && order.isModifiable && (
                  <button
                    className="!w-full !flex !items-center !justify-center !gap-2 !py-4 !bg-red-50 !text-red-700 !rounded-2xl !font-bold !text-sm"
                    onClick={() => setShowDeleteModal(true)}
                  >
                    <FiTrash2 size={16} /> Cancel & Delete Order
                  </button>
                )}
              </div>
            </div>

            {order.orderStatus !== 'cancelled' ? (
              <div className="status-timeline !flex !justify-between !relative !mt-12 max-md:!flex-col max-md:!gap-10">
                {/* Visual line */}
                <div className="!absolute !top-4 !left-2 !right-2 !h-[2px] !bg-gray-100 max-md:!left-4 max-md:!top-0 max-md:!bottom-0 max-md:!w-[2px] max-md:!h-full"></div>

                {statusSteps.map((step, index) => {
                  const isCompleted = index <= getCurrentStep();
                  const isCurrent = index === getCurrentStep();
                  return (
                    <div
                      key={step}
                      className={`timeline-step !relative !z-10 !flex !flex-col !items-center !flex-1 max-md:!flex-row max-md:!gap-4`}
                    >
                      <div className={`!w-8 !h-8 !rounded-full !flex !items-center !justify-center !text-xs !font-bold !transition-all !duration-500 ${isCompleted ? '!bg-blue-600 !text-white !shadow-lg !shadow-blue-200' : '!bg-white !text-gray-300 !border-2 !border-gray-100'}`}>
                        {isCompleted ? '✓' : index + 1}
                      </div>
                      <span className={`!mt-3 !text-[11px] !font-bold !uppercase !tracking-wider ${isCompleted ? '!text-slate-900' : '!text-gray-400'} ${isCurrent ? '!text-blue-600' : ''} max-md:!mt-0`}>
                        {step}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="!bg-red-50 !text-red-600 !p-5 !rounded-2xl !flex !items-center !gap-3">
                <FiXCircle size={24} />
                <div>
                  <h4 className="!font-bold">This order has been cancelled</h4>
                  <p className="!text-xs !opacity-80">Refund policy details are available in the help section.</p>
                </div>
              </div>
            )}
          </div>

          <div className="order-details-grid !grid !grid-cols-3 !gap-8 max-md:!flex max-md:!flex-col max-md:!gap-6 max-md:!p-4">
            {/* Order Items */}
            <div className="detail-card order-items-card !col-span-2 !bg-white !rounded-3xl !p-8 !shadow-sm !border !border-gray-100">
              <h3 className="!flex !items-center !gap-2 !text-lg !font-bold !text-slate-900 !mb-8"><FiPackage className="!text-blue-600" /> Items Summary</h3>
              <div className="items-list !flex !flex-col !gap-6">
                {order.items.map((item, index) => (
                  <div key={index} className="item-row !flex !gap-4 !pb-6 !border-b !border-gray-50 last:!border-0 last:!pb-0">
                    <div className="!w-16 !h-16 !bg-gray-50 !rounded-2xl !flex !items-center !justify-center !text-2xl">
                      📦
                    </div>
                    <div className="item-info !flex-1">
                      <span className="item-name !text-base !font-bold !text-slate-900 !block !mb-1">{item.productName}</span>
                      <span className="item-unit !text-xs !text-gray-400 !font-semibold">₹{item.price.toLocaleString()} per {item.unit}</span>
                    </div>
                    <div className="!text-right">
                      <div className="item-qty !text-xs !font-bold !text-gray-500 !mb-1">Qty: {item.quantity}</div>
                      <div className="item-subtotal !text-base !font-black !text-slate-900">₹{item.subtotal.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="order-total-row !mt-10 !pt-8 !border-t-2 !border-dashed !border-gray-100 !flex !justify-between !items-end">
                <div className="!flex !flex-col">
                  <span className="!text-xs !text-gray-400 !font-bold !uppercase !tracking-widest !mb-1">Grand Total</span>
                  <span className="!text-gray-400 !text-xs">(Inclusive of all taxes)</span>
                </div>
                <span className="order-total !text-4xl !font-black !text-blue-600 !leading-none">₹{order.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="!flex !flex-col !gap-6">
              {/* Shipping Address */}
              <div className="detail-card !bg-white !rounded-3xl !p-8 !shadow-sm !border !border-gray-100">
                <h3 className="!flex !items-center !gap-2 !text-lg !font-bold !text-slate-900 !mb-6"><FiMapPin className="!text-blue-600" /> Delivery To</h3>
                <div className="address-details !bg-slate-50 !p-6 !rounded-2xl !space-y-4">
                  <div className="!flex !items-center !gap-3 !pb-3 !border-b !border-gray-100">
                    <FiUser className="!text-blue-600" />
                    <span className="!text-sm !font-bold">{order.shippingAddress.name}</span>
                  </div>
                  <div className="!flex !items-center !gap-3">
                    <FiPhone className="!text-blue-600" />
                    <span className="!text-sm !font-medium">{order.shippingAddress.phone}</span>
                  </div>
                  <div className="!pl-7 !text-xs !text-gray-500 !leading-relaxed">
                    {order.shippingAddress.street}<br />
                    {order.shippingAddress.city}, {order.shippingAddress.state}<br />
                    {order.shippingAddress.pincode}
                  </div>
                </div>
              </div>

              {/* Order Info */}
              <div className="detail-card !bg-white !rounded-3xl !p-8 !shadow-sm !border !border-gray-100">
                <h3 className="!flex !items-center !gap-2 !text-lg !font-bold !text-slate-900 !mb-6"><FiCalendar className="!text-blue-600" /> Logistics</h3>
                <div className="info-rows !space-y-4">
                  <div className="info-row !flex !justify-between !items-center">
                    <span className="!text-xs !font-bold !text-gray-400 !uppercase">Order Date</span>
                    <span className="!text-xs !font-bold !text-slate-700">{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="info-row !flex !justify-between !items-center">
                    <span className="!text-xs !font-bold !text-gray-400 !uppercase">Method</span>
                    <span className="!text-xs !font-bold !text-slate-700">{order.paymentMethod === 'cod' ? '💵 Cash on Delivery' : order.paymentMethod === 'online' ? '💳 Online Payment' : order.paymentMethod}</span>
                  </div>
                  <div className="info-row !flex !justify-between !items-center">
                    <span className="!text-xs !font-bold !text-gray-400 !uppercase">Payment</span>
                    <span className={`!px-3 !py-1 !rounded-full !text-[10px] !font-black !uppercase !tracking-widest ${order.paymentStatus === 'paid' ? '!bg-green-100 !text-green-600' : '!bg-amber-100 !text-amber-600'}`}>
                      {order.paymentStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Order Modal */}
      {showEditModal && (
        <div className="modal-overlay !p-0 max-md:!items-end" onClick={() => setShowEditModal(false)}>
          <div className="modal edit-order-modal max-md:!w-full max-md:!max-w-none max-md:!h-[95vh] max-md:!rounded-t-3xl max-md:!rounded-b-none max-md:!m-0 max-md:!overflow-hidden !flex !flex-col" onClick={e => e.stopPropagation()}>
            <div className="modal-header max-md:!px-6 max-md:!py-6 max-md:!border-b">
              <h2 className="!text-xl !font-black !text-slate-900 !flex !items-center !gap-2"><FiEdit2 className="!text-blue-600" /> Modify Order</h2>
              <button className="close-btn !bg-gray-100 !p-2 !rounded-full" onClick={() => setShowEditModal(false)}>
                <FiX size={20} />
              </button>
            </div>
            <div className="modal-body !flex-1 !overflow-y-auto max-md:!p-6">
              {/* Edit Items */}
              <div className="edit-section !mb-10">
                <h3 className="!text-sm !font-black !text-gray-400 !uppercase !tracking-widest !mb-6">Adjust Quantities</h3>
                <div className="edit-items-list !flex !flex-col !gap-5">
                  {editItems.map((item, index) => (
                    <div key={index} className="edit-item-row !bg-slate-50 !p-5 !rounded-2xl !flex !flex-col !gap-4">
                      <div className="!flex !justify-between !items-start">
                        <div className="edit-item-info">
                          <span className="edit-item-name !text-sm !font-bold !text-slate-900 !block !mb-1">{item.productName}</span>
                          <span className="edit-item-price !text-[11px] !text-gray-400 !font-bold">₹{item.price}/{item.unit}</span>
                        </div>
                        <button
                          className="!p-2 !text-red-400 hover:!text-red-600"
                          onClick={() => handleRemoveItem(index)}
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>

                      <div className="!flex !justify-between !items-center">
                        <div className="edit-item-controls !flex !items-center !bg-white !p-1 !rounded-xl !border !border-gray-100">
                          <button
                            className="!w-10 !h-10 !flex !items-center !justify-center !text-blue-600 disabled:!opacity-30"
                            onClick={() => handleQuantityChange(index, -1)}
                            disabled={item.quantity <= 1}
                          >
                            <FiMinus />
                          </button>
                          <span className="!w-12 !text-center !font-black !text-slate-900">{item.quantity}</span>
                          <button
                            className="!w-10 !h-10 !flex !items-center !justify-center !text-blue-600"
                            onClick={() => handleQuantityChange(index, 1)}
                          >
                            <FiPlus />
                          </button>
                        </div>
                        <div className="edit-item-subtotal !text-sm !font-black !text-blue-600">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="!mt-6 !p-6 !bg-blue-600 !rounded-2xl !flex !justify-between !items-center !text-white">
                  <span className="!text-xs !font-bold !uppercase !tracking-widest">Updated Total</span>
                  <span className="!text-2xl !font-black">₹{editItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}</span>
                </div>
              </div>

              {/* Edit Address */}
              <div className="edit-section !mb-8">
                <h3 className="!text-sm !font-black !text-gray-400 !uppercase !tracking-widest !mb-6">Update Address</h3>
                <div className="edit-form-grid !grid !grid-cols-2 !gap-4 max-md:!grid-cols-1">
                  <div className="form-group !flex !flex-col !gap-2">
                    <label className="!text-[10px] !font-bold !text-gray-400 !uppercase">Receiver Name</label>
                    <input
                      type="text"
                      className="!w-full !px-5 !py-4 !bg-gray-50 !border-0 !rounded-xl !text-sm !font-bold focus:!ring-2 focus:!ring-blue-600"
                      value={editAddress.name}
                      onChange={(e) => handleAddressChange('name', e.target.value)}
                    />
                  </div>
                  <div className="form-group !flex !flex-col !gap-2">
                    <label className="!text-[10px] !font-bold !text-gray-400 !uppercase">Primary Phone</label>
                    <input
                      type="text"
                      className="!w-full !px-5 !py-4 !bg-gray-50 !border-0 !rounded-xl !text-sm !font-bold focus:!ring-2 focus:!ring-blue-600"
                      value={editAddress.phone}
                      onChange={(e) => handleAddressChange('phone', e.target.value)}
                      maxLength="10"
                    />
                  </div>
                  <div className="form-group !col-span-2 max-md:!col-span-1 !flex !flex-col !gap-2">
                    <label className="!text-[10px] !font-bold !text-gray-400 !uppercase">Full Street Address</label>
                    <input
                      type="text"
                      className="!w-full !px-5 !py-4 !bg-gray-50 !border-0 !rounded-xl !text-sm !font-bold focus:!ring-2 focus:!ring-blue-600"
                      value={editAddress.street}
                      onChange={(e) => handleAddressChange('street', e.target.value)}
                    />
                  </div>
                  <div className="form-group !flex !flex-col !gap-2">
                    <label className="!text-[10px] !font-bold !text-gray-400 !uppercase">City</label>
                    <input
                      type="text"
                      className="!w-full !px-5 !py-4 !bg-gray-50 !border-0 !rounded-xl !text-sm !font-bold focus:!ring-2 focus:!ring-blue-600"
                      value={editAddress.city}
                      onChange={(e) => handleAddressChange('city', e.target.value)}
                    />
                  </div>
                  <div className="form-group !flex !flex-col !gap-2">
                    <label className="!text-[10px] !font-bold !text-gray-400 !uppercase">Pincode</label>
                    <input
                      type="text"
                      className="!w-full !px-5 !py-4 !bg-gray-50 !border-0 !rounded-xl !text-sm !font-bold focus:!ring-2 focus:!ring-blue-600"
                      value={editAddress.pincode}
                      onChange={(e) => handleAddressChange('pincode', e.target.value)}
                      maxLength="6"
                    />
                  </div>
                </div>
              </div>

              {/* Edit Notes */}
              <div className="edit-section !pb-10">
                <h3 className="!text-sm !font-black !text-gray-400 !uppercase !tracking-widest !mb-6">Special Instructions</h3>
                <textarea
                  className="!w-full !px-5 !py-4 !bg-gray-50 !border-0 !rounded-2xl !text-sm !font-bold focus:!ring-2 focus:!ring-blue-600"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Drop a note for the delivery agent..."
                  rows="3"
                />
              </div>
            </div>
            <div className="modal-footer !p-6 !border-t !flex !gap-4">
              <button
                className="!flex-1 !py-4 !bg-blue-600 !text-white !rounded-2xl !font-black !text-sm !shadow-lg !shadow-blue-200"
                onClick={handleUpdateOrder}
                disabled={updating}
              >
                {updating ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                className="!px-8 !py-4 !bg-gray-100 !text-gray-500 !rounded-2xl !font-bold !text-sm"
                onClick={() => setShowEditModal(false)}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay !p-0 max-md:!items-end" onClick={() => setShowDeleteModal(false)}>
          <div className="modal delete-modal max-md:!w-full max-md:!max-w-none max-md:!rounded-t-3xl max-md:!rounded-b-none max-md:!m-0 max-md:!p-8" onClick={e => e.stopPropagation()}>
            <div className="modal-body !text-center">
              <div className="!w-20 !h-20 !bg-red-50 !text-red-500 !rounded-full !flex !items-center !justify-center !text-4xl !mx-auto !mb-6">
                ⚠️
              </div>
              <h3 className="!text-2xl !font-black !text-slate-900 !mb-2">Cancel Order?</h3>
              <p className="!text-gray-500 !text-sm !leading-relaxed !mb-10">
                Are you sure you want to cancel and delete Order <span className="!font-black !text-slate-900">#{order.orderNumber}</span>? This action is irreversible.
              </p>

              <div className="!flex !flex-col !gap-3">
                <button
                  className="!w-full !py-4 !bg-red-600 !text-white !rounded-2xl !font-black !text-sm !shadow-lg !shadow-red-200"
                  onClick={handleDeleteOrder}
                  disabled={deleting}
                >
                  {deleting ? 'Processing...' : 'Yes, Cancel Order'}
                </button>
                <button
                  className="!w-full !py-4 !bg-gray-100 !text-gray-500 !rounded-2xl !font-bold !text-sm"
                  onClick={() => setShowDeleteModal(false)}
                >
                  No, Keep Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay !p-0 max-md:!items-end" onClick={() => setShowPaymentModal(false)}>
          <div className="modal payment-modal max-md:!w-full max-md:!max-w-none max-md:!h-[90vh] max-md:!rounded-t-3xl max-md:!rounded-b-none max-md:!m-0 max-md:!overflow-hidden !flex !flex-col" onClick={e => e.stopPropagation()}>
            <div className="modal-header max-md:!px-8 max-md:!py-8 max-md:!border-b">
              <h2 className="!text-xl !font-black !text-slate-900 !flex !items-center !gap-2"><FiCreditCard className="!text-blue-600" /> Secure Payment</h2>
              <button className="close-btn !bg-gray-100 !p-2 !rounded-full" onClick={() => setShowPaymentModal(false)}>
                <FiX size={20} />
              </button>
            </div>
            <div className="modal-body !flex-1 !overflow-y-auto max-md:!p-8">
              <div className="payment-order-summary !bg-slate-900 !text-white !p-6 !rounded-3xl !mb-8 !flex !justify-between !items-center">
                <div>
                  <span className="!text-[10px] !font-bold !text-gray-400 !uppercase !tracking-widest !block !mb-1">Payment For Order</span>
                  <span className="!font-black !text-sm">#{order.orderNumber}</span>
                </div>
                <div className="!text-right">
                  <span className="!text-2xl !font-black !text-blue-400">₹{order.totalAmount?.toLocaleString()}</span>
                </div>
              </div>

              {creatingPaymentIntent ? (
                <div className="payment-loading !py-20 !text-center">
                  <FiLoader className="!inline-block !animate-spin !text-blue-600 !mb-4" size={40} />
                  <p className="!text-sm !font-bold !text-slate-600">Initializing secure gateway...</p>
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
                <div className="payment-error-state !text-center !py-10">
                  <FiXCircle className="!inline-block !text-red-500 !mb-4" size={48} />
                  <p className="!mb-6 !text-gray-500 !text-sm">Failed to initialize payment intent.</p>
                  <button
                    className="!w-full !py-4 !bg-slate-900 !text-white !rounded-2xl !font-bold"
                    onClick={openPaymentModal}
                  >
                    Tap to Retry
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
