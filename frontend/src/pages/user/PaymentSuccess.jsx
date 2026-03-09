import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { FiCheckCircle, FiLoader, FiPackage, FiArrowRight } from 'react-icons/fi';
import paymentService from '../../services/paymentService';
import orderService from '../../services/orderService';
import toast from 'react-hot-toast';
import './PaymentResult.css';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);

  const orderId = searchParams.get('orderId');
  const paymentIntentId = searchParams.get('payment_intent');

  useEffect(() => {
    const confirmAndFetchOrder = async () => {
      if (!orderId) {
        setError('Order information not found');
        setLoading(false);
        return;
      }

      try {
        // Confirm payment with backend if payment_intent is available
        if (paymentIntentId) {
          await paymentService.confirmPayment(paymentIntentId, orderId);
        }

        // Fetch order details
        const response = await orderService.getOrder(orderId);
        setOrder(response.order);
        toast.success('Payment successful!');
      } catch (err) {
        console.error('Error confirming payment:', err);
        // Even if confirmation fails, try to fetch order
        try {
          const response = await orderService.getOrder(orderId);
          setOrder(response.order);
        } catch (orderErr) {
          setError('Could not retrieve order details');
        }
      } finally {
        setLoading(false);
      }
    };

    confirmAndFetchOrder();
  }, [orderId, paymentIntentId]);

  if (loading) {
    return (
      <div className="payment-result-page">
        <div className="container">
          <div className="result-card loading">
            <FiLoader className="spinner-large" />
            <h2>Confirming your payment...</h2>
            <p>Please wait while we process your order</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-result-page">
        <div className="container">
          <div className="result-card error">
            <h2>Something went wrong</h2>
            <p>{error}</p>
            <Link to="/my-orders" className="btn btn-primary">
              View My Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-result-page">
      <div className="container">
        <div className="result-card success">
          <div className="success-icon">
            <FiCheckCircle />
          </div>
          
          <h1>Payment Successful!</h1>
          <p className="subtitle">Thank you for your order</p>

          {order && (
            <div className="order-info">
              <div className="order-number">
                <FiPackage />
                <span>Order #{order.orderNumber}</span>
              </div>

              <div className="order-details">
                <div className="detail-row">
                  <span>Amount Paid</span>
                  <span className="amount">₹{order.totalAmount?.toLocaleString()}</span>
                </div>
                <div className="detail-row">
                  <span>Payment Status</span>
                  <span className="status paid">Paid</span>
                </div>
                <div className="detail-row">
                  <span>Order Status</span>
                  <span className="status">{order.orderStatus}</span>
                </div>
              </div>
            </div>
          )}

          <div className="action-buttons">
            <Link to={`/orders/${orderId}`} className="btn btn-primary">
              View Order Details
              <FiArrowRight />
            </Link>
            <Link to="/products" className="btn btn-outline">
              Continue Shopping
            </Link>
          </div>

          <p className="confirmation-note">
            A confirmation email has been sent to your registered email address.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
