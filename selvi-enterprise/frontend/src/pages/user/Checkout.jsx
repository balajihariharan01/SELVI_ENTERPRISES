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
      <div className="page-header">
        <div className="container">
          <h1>Checkout</h1>
          <p>{orderCreated ? 'Complete your payment' : 'Enter your delivery details'}</p>
        </div>
      </div>

      <div className="container">
        <Link to={orderCreated ? `/orders/${orderId}` : '/cart'} className="back-link">
          <FiArrowLeft /> {orderCreated ? 'View Order' : 'Back to Cart'}
        </Link>

        <div className="checkout-layout">
          {/* Email Verification Gate */}
          {!isEmailVerified && (
            <div className="verification-gate">
              <div className="verification-gate-content">
                <div className="verification-gate-icon">
                  <FiAlertCircle />
                </div>
                <h3>Email Verification Required</h3>
                <p>
                  Please verify your email address before placing an order. 
                  This helps us send you order updates and important notifications.
                </p>
                <div className="verification-gate-email">
                  <FiMail />
                  <span>{user?.email}</span>
                </div>
                <div className="verification-gate-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSendVerification}
                    disabled={sendingVerification}
                  >
                    <FiSend />
                    {sendingVerification ? 'Sending...' : 'Send Verification Email'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={async () => {
                      await refreshUser();
                      toast.success('Status refreshed');
                    }}
                  >
                    I've Verified - Refresh
                  </button>
                </div>
                <p className="verification-gate-hint">
                  Already verified? Click "I've Verified - Refresh" to continue.
                </p>
              </div>
            </div>
          )}

          {/* Main Section - Only show if email is verified */}
          {isEmailVerified && (
          <div className="checkout-form-section">
            {!orderCreated ? (
              // Step 1: Shipping & Payment Method Selection
              <form onSubmit={handleSubmit} className="checkout-form">
                <h3>Delivery Address</h3>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <div className="input-icon">
                      <FiUser />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your name"
                        className="form-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <div className="input-icon">
                      <FiPhone />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="10-digit phone number"
                        className="form-input"
                        pattern="[0-9]{10}"
                        maxLength={10}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Street Address</label>
                  <div className="input-icon">
                    <FiMapPin />
                    <input
                      type="text"
                      name="street"
                      value={formData.street}
                      onChange={handleChange}
                      placeholder="Enter your street address"
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Enter city"
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">State</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="Enter state"
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Pincode</label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleChange}
                      placeholder="6-digit pincode"
                      className="form-input"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Order Notes (Optional)</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Any special instructions for delivery..."
                    className="form-input form-textarea"
                    rows={3}
                  />
                </div>

                <div className="payment-section">
                  <h3>Payment Method</h3>
                  
                  <div 
                    className={`payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod('cod')}
                  >
                    <input 
                      type="radio" 
                      name="paymentMethod"
                      checked={paymentMethod === 'cod'} 
                      onChange={() => setPaymentMethod('cod')}
                    />
                    <FiTruck className="payment-icon" />
                    <div>
                      <strong>Cash on Delivery (COD)</strong>
                      <p>Pay when your order is delivered</p>
                    </div>
                  </div>

                  <div 
                    className={`payment-option ${paymentMethod === 'online' ? 'selected' : ''}`}
                    onClick={() => setPaymentMethod('online')}
                  >
                    <input 
                      type="radio" 
                      name="paymentMethod"
                      checked={paymentMethod === 'online'} 
                      onChange={() => setPaymentMethod('online')}
                    />
                    <FiCreditCard className="payment-icon" />
                    <div>
                      <strong>Pay Online</strong>
                      <p>Credit/Debit Card, UPI, Net Banking</p>
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary btn-lg place-order-btn"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <FiLoader className="spinner" />
                      Processing...
                    </>
                  ) : paymentMethod === 'cod' ? (
                    `Place Order - ₹${getCartTotal().toLocaleString()}`
                  ) : (
                    `Proceed to Payment - ₹${getCartTotal().toLocaleString()}`
                  )}
                </button>
              </form>
            ) : (
              // Step 2: Stripe Payment Form
              <div className="stripe-payment-section">
                <h3>
                  <FiCreditCard />
                  Secure Payment
                </h3>
                
                {creatingPaymentIntent ? (
                  <div className="payment-loading">
                    <FiLoader className="spinner-large" />
                    <p>Initializing secure payment...</p>
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
                  <div className="payment-error-state">
                    <p>Failed to initialize payment. Please try again.</p>
                    <button 
                      className="btn btn-primary"
                      onClick={() => window.location.reload()}
                    >
                      Retry
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          )}

          {/* Order Summary - Only show if email is verified */}
          {isEmailVerified && (
          <div className="order-summary-section">
            <div className="order-summary">
              <h3>Order Summary</h3>
              
              <div className="summary-items">
                {(orderCreated ? orderItems : cart).map(item => (
                  <div key={item.product._id} className="summary-item">
                    <div className="summary-item-info">
                      <span className="summary-item-name">{item.product.productName}</span>
                      <span className="summary-item-qty">x {item.quantity} {item.product.unit}</span>
                    </div>
                    <span className="summary-item-price">
                      ₹{(item.product.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div className="summary-divider"></div>

              <div className="summary-row">
                <span>Subtotal</span>
                <span>₹{(orderCreated ? orderTotal : getCartTotal()).toLocaleString()}</span>
              </div>

              <div className="summary-row">
                <span>Delivery</span>
                <span className="free">Free</span>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-row total">
                <span>Total</span>
                <span>₹{(orderCreated ? orderTotal : getCartTotal()).toLocaleString()}</span>
              </div>

              {paymentMethod === 'online' && !orderCreated && (
                <div className="secure-payment-badge">
                  <FiCreditCard />
                  <span>Secure payment powered by Stripe</span>
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
