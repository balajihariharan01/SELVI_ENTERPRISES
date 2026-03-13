import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { FiMapPin, FiPhone, FiUser, FiArrowLeft, FiCreditCard, FiTruck, FiLoader, FiAlertCircle, FiMail, FiSend } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import orderService from '../../services/orderService';
import paymentService from '../../services/paymentService';
import authService from '../../services/authService';
import CheckoutForm from '../../components/CheckoutForm';
import toast from 'react-hot-toast';
import './Checkout.css';

// Initialize Stripe with publishable key from environment
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const Checkout = () => {
  const { cart, getCartTotal, clearCart } = useCart();
  const { user, refreshUser, isEmailVerified } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [clientSecret, setClientSecret] = useState('');
  const [orderId, setOrderId] = useState(null);
  const [orderCreated, setOrderCreated] = useState(false);
  const [creatingPaymentIntent, setCreatingPaymentIntent] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);

  // Store order details after creation to persist across payment flow
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderItems, setOrderItems] = useState([]);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    pincode: user?.address?.pincode || '',
    notes: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle sending verification email
  const handleSendVerification = async () => {
    setSendingVerification(true);
    try {
      await authService.sendVerificationEmail();
      toast.success('Verification email sent! Check your inbox.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send verification email');
    } finally {
      setSendingVerification(false);
    }
  };

  // Create order first, then create payment intent for online payments
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cart.length === 0) {
      toast.error('Your cart is empty');
      navigate('/cart');
      return;
    }

    setLoading(true);

    try {
      const orderData = {
        items: cart.map(item => ({
          productId: item.product._id,
          quantity: item.quantity
        })),
        shippingAddress: {
          name: formData.name,
          phone: formData.phone,
          street: formData.street,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode
        },
        paymentMethod: paymentMethod,
        notes: formData.notes
      };

      const response = await orderService.createOrder(orderData);
      const createdOrder = response.order;

      if (paymentMethod === 'cod') {
        // COD: Clear cart and navigate to order detail
        clearCart();
        toast.success('Order placed successfully!');
        navigate(`/orders/${createdOrder._id}`);
      } else {
        // Online payment: Store order details BEFORE clearing cart
        const currentTotal = getCartTotal();
        const currentItems = [...cart]; // Clone cart items

        // Debug logs (temporary)
        console.log('=== CHECKOUT DEBUG ===');
        console.log('Cart items:', currentItems);
        console.log('Calculated total:', currentTotal);
        console.log('Order totalAmount:', createdOrder.totalAmount);

        setOrderTotal(createdOrder.totalAmount); // Use server-calculated total for security
        setOrderItems(currentItems);
        setOrderId(createdOrder._id);
        setOrderCreated(true);
        setCreatingPaymentIntent(true);

        try {
          const paymentResponse = await paymentService.createPaymentIntent(
            createdOrder._id,
            createdOrder.totalAmount,
            user?.email
          );

          console.log('Payment Intent created, clientSecret received');
          console.log('Amount sent to Stripe:', createdOrder.totalAmount);

          setClientSecret(paymentResponse.clientSecret);
          clearCart(); // Clear cart AFTER storing order details
        } catch (paymentError) {
          toast.error('Failed to initialize payment. Please try again.');
          console.error('Payment intent error:', paymentError);
        } finally {
          setCreatingPaymentIntent(false);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  // Handle successful Stripe payment
  const handlePaymentSuccess = async (paymentIntent) => {
    try {
      await paymentService.confirmPayment(paymentIntent.id, orderId);
      toast.success('Payment successful!');
      navigate(`/payment-success?orderId=${orderId}`);
    } catch (error) {
      // Even if confirmation fails, the webhook will handle it
      toast.success('Payment processed! Redirecting...');
      navigate(`/payment-success?orderId=${orderId}`);
    }
  };

  // Handle payment error
  const handlePaymentError = (error) => {
    toast.error(error.message || 'Payment failed');
  };

  if (cart.length === 0 && !orderCreated) {
    navigate('/cart');
    return null;
  }

  // Stripe Elements appearance
  const stripeAppearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#2563eb',
      colorBackground: '#ffffff',
      colorText: '#1f2937',
      colorDanger: '#dc2626',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      borderRadius: '8px',
      spacingUnit: '4px'
    }
  };

  const stripeOptions = {
    clientSecret,
    appearance: stripeAppearance,
  };

  return (
    <div className="checkout-page">
      <div className="page-header !bg-slate-900 !text-white !py-12 max-md:!py-10 max-md:!px-4">
        <div className="container !max-w-7xl !mx-auto">
          <h1 className="!text-3xl !font-black !mb-2 max-md:!text-2xl">Checkout</h1>
          <p className="!text-slate-400 !text-sm">{orderCreated ? 'Secure Payment Processing' : 'Finalize Your Order Details'}</p>
        </div>
      </div>

      <div className="container !max-w-7xl !mx-auto !py-10 max-md:!px-4">
        <Link to={orderCreated ? `/orders/${orderId}` : '/cart'} className="!inline-flex !items-center !gap-2 !text-blue-600 !text-sm !font-bold !mb-8 hover:!text-blue-700">
          <FiArrowLeft /> {orderCreated ? 'Back to Order Ref' : 'Returns to Cart'}
        </Link>

        <div className="checkout-layout !flex !gap-10 max-md:!flex-col">
          {/* Email Verification Gate */}
          {!isEmailVerified && (
            <div className="verification-gate !w-full !bg-white !rounded-3xl !p-12 !shadow-2xl !shadow-blue-50 !border !border-blue-100 !text-center max-md:!p-8">
              <div className="verification-gate-content !max-w-lg !mx-auto">
                <div className="verification-gate-icon !w-20 !h-20 !bg-blue-50 !text-blue-600 !rounded-full !flex !items-center !justify-center !text-4xl !mx-auto !mb-8 !animate-pulse">
                  <FiAlertCircle />
                </div>
                <h3 className="!text-2xl !font-black !text-slate-900 !mb-4">Verification Required</h3>
                <p className="!text-slate-500 !text-sm !leading-relaxed !mb-10">
                  To ensure secure transactions and order updates, please verify your email address before finalizing your purchase.
                </p>
                <div className="verification-gate-email !bg-slate-50 !p-4 !rounded-2xl !inline-flex !items-center !gap-3 !mb-10 !border !border-gray-100">
                  <FiMail className="!text-blue-600" />
                  <span className="!text-sm !font-black !text-slate-700">{user?.email}</span>
                </div>
                <div className="verification-gate-actions !flex !flex-col !gap-4">
                  <button
                    type="button"
                    className="!w-full !py-5 !bg-blue-600 !text-white !rounded-2xl !font-black !text-base !shadow-xl !shadow-blue-100 hover:!bg-blue-700"
                    onClick={handleSendVerification}
                    disabled={sendingVerification}
                  >
                    {sendingVerification ? 'Sending Link...' : 'Send Verification Email'}
                  </button>
                  <button
                    type="button"
                    className="!w-full !py-4 !bg-slate-50 !text-slate-600 !rounded-2xl !font-bold !text-sm"
                    onClick={async () => {
                      await refreshUser();
                      toast.success('Account status re-synced');
                    }}
                  >
                    I Have Verified - Refresh Now
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Section - Only show if email is verified */}
          {isEmailVerified && (
            <div className="checkout-form-section !flex-1">
              {!orderCreated ? (
                // Step 1: Shipping & Payment Method Selection
                <form onSubmit={handleSubmit} className="checkout-form !bg-white !rounded-3xl !p-10 !shadow-sm !border !border-gray-100 max-md:!p-6">
                  <h3 className="!text-xl !font-black !text-slate-900 !mb-8 !flex !items-center !gap-3"><FiTruck className="!text-blue-600" /> Delivery Logistics</h3>

                  <div className="!grid !grid-cols-2 !gap-6 !mb-8 max-md:!grid-cols-1">
                    <div className="form-group !flex !flex-col !gap-2">
                      <label className="!text-[10px] !font-bold !text-gray-400 !uppercase !tracking-widest">Consignee Name</label>
                      <div className="!relative">
                        <FiUser className="!absolute !left-5 !top-1/2 !-translate-y-1/2 !text-gray-400" />
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="!w-full !pl-12 !pr-5 !py-4 !bg-slate-50 !border-0 !rounded-2xl !text-sm !font-bold focus:!ring-2 focus:!ring-blue-600"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group !flex !flex-col !gap-2">
                      <label className="!text-[10px] !font-bold !text-gray-400 !uppercase !tracking-widest">Phone Number</label>
                      <div className="!relative">
                        <FiPhone className="!absolute !left-5 !top-1/2 !-translate-y-1/2 !text-gray-400" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          pattern="[0-9]{10}"
                          maxLength={10}
                          className="!w-full !pl-12 !pr-5 !py-4 !bg-slate-50 !border-0 !rounded-2xl !text-sm !font-bold focus:!ring-2 focus:!ring-blue-600"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="form-group !mb-8 !flex !flex-col !gap-2">
                    <label className="!text-[10px] !font-bold !text-gray-400 !uppercase !tracking-widest">Complete Address</label>
                    <div className="!relative">
                      <FiMapPin className="!absolute !left-5 !top-5 !text-gray-400" />
                      <textarea
                        name="street"
                        value={formData.street}
                        onChange={handleChange}
                        rows={2}
                        className="!w-full !pl-12 !pr-5 !py-4 !bg-slate-50 !border-0 !rounded-2xl !text-sm !font-bold focus:!ring-2 focus:!ring-blue-600"
                        required
                      ></textarea>
                    </div>
                  </div>

                  <div className="!grid !grid-cols-3 !gap-4 !mb-10 max-md:!grid-cols-1">
                    <div className="form-group !flex !flex-col !gap-2">
                      <label className="!text-[10px] !font-bold !text-gray-400 !uppercase">City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="!w-full !px-5 !py-4 !bg-slate-50 !border-0 !rounded-2xl !text-sm !font-bold focus:!ring-2 focus:!ring-blue-600"
                        required
                      />
                    </div>
                    <div className="form-group !flex !flex-col !gap-2">
                      <label className="!text-[10px] !font-bold !text-gray-400 !uppercase">State</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className="!w-full !px-5 !py-4 !bg-slate-50 !border-0 !rounded-2xl !text-sm !font-bold focus:!ring-2 focus:!ring-blue-600"
                        required
                      />
                    </div>
                    <div className="form-group !flex !flex-col !gap-2">
                      <label className="!text-[10px] !font-bold !text-gray-400 !uppercase">Pincode</label>
                      <input
                        type="text"
                        name="pincode"
                        value={formData.pincode}
                        onChange={handleChange}
                        pattern="[0-9]{6}"
                        maxLength={6}
                        className="!w-full !px-5 !py-4 !bg-slate-50 !border-0 !rounded-2xl !text-sm !font-bold focus:!ring-2 focus:!ring-blue-600"
                        required
                      />
                    </div>
                  </div>

                  <div className="payment-section !mb-10">
                    <h3 className="!text-xl !font-black !text-slate-900 !mb-8 !flex !items-center !gap-3"><FiCreditCard className="!text-blue-600" /> Payment Gateway</h3>

                    <div className="!grid !grid-cols-2 !gap-4 max-md:!grid-cols-1">
                      <div
                        className={`!cursor-pointer !p-6 !rounded-3xl !border-2 !transition-all ${paymentMethod === 'cod' ? '!border-blue-600 !bg-blue-50' : '!border-gray-50 !bg-white'}`}
                        onClick={() => setPaymentMethod('cod')}
                      >
                        <div className="!flex !items-center !gap-4">
                          <div className={`!w-10 !h-10 !rounded-2xl !flex !items-center !justify-center ${paymentMethod === 'cod' ? '!bg-blue-600 !text-white' : '!bg-gray-100 !text-gray-400'}`}>
                            <FiTruck />
                          </div>
                          <div>
                            <strong className="!text-sm !block !mb-0.5">Pay on Delivery</strong>
                            <span className="!text-[10px] !text-gray-400 !uppercase !font-bold">Cash/COD</span>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`!cursor-pointer !p-6 !rounded-3xl !border-2 !transition-all ${paymentMethod === 'online' ? '!border-blue-600 !bg-blue-50' : '!border-gray-50 !bg-white'}`}
                        onClick={() => setPaymentMethod('online')}
                      >
                        <div className="!flex !items-center !gap-4">
                          <div className={`!w-10 !h-10 !rounded-2xl !flex !items-center !justify-center ${paymentMethod === 'online' ? '!bg-blue-600 !text-white' : '!bg-gray-100 !text-gray-400'}`}>
                            <FiCreditCard />
                          </div>
                          <div>
                            <strong className="!text-sm !block !mb-0.5">Digital Payment</strong>
                            <span className="!text-[10px] !text-gray-400 !uppercase !font-bold">Card/UPI/Net</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="!w-full !flex !items-center !justify-center !gap-3 !py-5 !bg-blue-600 !text-white !rounded-2xl !font-black !text-base !shadow-xl !shadow-blue-100 hover:!bg-blue-700 disabled:!opacity-50"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <FiLoader className="!animate-spin" />
                        Syncing with server...
                      </>
                    ) : paymentMethod === 'cod' ? (
                      `Place Order - ₹${getCartTotal().toLocaleString()}`
                    ) : (
                      `Checkout Securely - ₹${getCartTotal().toLocaleString()}`
                    )}
                  </button>
                </form>
              ) : (
                // Step 2: Stripe Payment Form
                <div className="stripe-payment-section !bg-white !rounded-3xl !p-10 !shadow-sm !border !border-gray-100 max-md:!p-6">
                  <h3 className="!text-xl !font-black !text-slate-900 !mb-8 !flex !items-center !gap-3">
                    <FiCreditCard className="!text-blue-600" />
                    Card Authentication
                  </h3>

                  {creatingPaymentIntent ? (
                    <div className="payment-loading !py-20 !text-center">
                      <FiLoader className="!inline-block !animate-spin !text-blue-600 !mb-4" size={40} />
                      <p className="!text-sm !font-bold !text-slate-600">Initializing Stripe Gateway...</p>
                    </div>
                  ) : clientSecret ? (
                    <Elements stripe={stripePromise} options={stripeOptions}>
                      <CheckoutForm
                        orderId={orderId}
                        amount={orderTotal}
                        onSuccess={handlePaymentSuccess}
                        onError={handlePaymentError}
                      />
                    </Elements>
                  ) : (
                    <div className="payment-error-state !text-center !py-10">
                      <FiAlertCircle className="!inline-block !text-red-500 !mb-4" size={48} />
                      <p className="!mb-6 !text-gray-500 !text-sm">Session initialization failed.</p>
                      <button
                        className="!w-full !py-4 !bg-slate-900 !text-white !rounded-2xl !font-bold"
                        onClick={() => window.location.reload()}
                      >
                        Tap to Reload
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Order Summary - Only show if email is verified */}
          {isEmailVerified && (
            <div className="order-summary-section !w-96 max-md:!w-full">
              <div className="order-summary !bg-slate-900 !text-white !rounded-3xl !p-8 !shadow-sm !sticky !top-8 max-md:!relative max-md:!top-0">
                <h3 className="!text-lg !font-black !mb-8">Order Overview</h3>

                <div className="summary-items !flex !flex-col !gap-6 !mb-8">
                  {(orderCreated ? orderItems : cart).map(item => (
                    <div key={item.product._id} className="summary-item !flex !justify-between !items-start !gap-4">
                      <div className="summary-item-info !flex-1">
                        <span className="summary-item-name !text-xs !font-bold !block !mb-1 !text-gray-100">{item.product.productName}</span>
                        <span className="summary-item-qty !text-[10px] !text-gray-500 !font-bold !uppercase">Qty: {item.quantity} {item.product.unit}</span>
                      </div>
                      <span className="summary-item-price !text-sm !font-black !text-blue-400">
                        ₹{(item.product.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="summary-divider !h-px !bg-slate-800 !mb-8"></div>

                <div className="!space-y-4 !mb-8">
                  <div className="summary-row !flex !justify-between !items-center !text-sm">
                    <span className="!text-gray-400 !font-bold">Subtotal</span>
                    <span className="!font-bold">₹{(orderCreated ? orderTotal : getCartTotal()).toLocaleString()}</span>
                  </div>

                  <div className="summary-row !flex !justify-between !items-center !text-sm">
                    <span className="!text-gray-400 !font-bold">Delivery Fee</span>
                    <span className="!text-green-400 !font-black !text-[10px] !uppercase">Free</span>
                  </div>
                </div>

                <div className="summary-divider !h-px !bg-slate-800 !mb-8"></div>

                <div className="summary-row total !flex !justify-between !items-end">
                  <span className="!text-[10px] !font-bold !text-gray-400 !uppercase">Total Payable</span>
                  <span className="!text-3xl !font-black !text-blue-400">₹{(orderCreated ? orderTotal : getCartTotal()).toLocaleString()}</span>
                </div>

                {paymentMethod === 'online' && !orderCreated && (
                  <div className="secure-payment-badge !mt-10 !pt-8 !border-t !border-slate-800 !flex !items-center !gap-3 !text-[10px] !text-slate-500 !font-bold !uppercase !tracking-widest">
                    <FiCreditCard className="!text-blue-600" />
                    <span>Verified Secure Checkout</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;
