import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FiXCircle, FiRefreshCw, FiArrowLeft, FiAlertTriangle } from 'react-icons/fi';
import orderService from '../../services/orderService';
import './PaymentResult.css';

const PaymentFailed = () => {
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const orderId = searchParams.get('orderId');
  const errorMessage = searchParams.get('error') || 'Your payment could not be processed';

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setLoading(false);
        return;
      }

      try {
        const response = await orderService.getOrder(orderId);
        setOrder(response.order);
      } catch (err) {
        console.error('Error fetching order:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  return (
    <div className="payment-result-page">
      <div className="container">
        <div className="result-card failed">
          <div className="failed-icon">
            <FiXCircle />
          </div>

          <h1>Payment Failed</h1>
          <p className="subtitle">{errorMessage}</p>

          <div className="error-info">
            <FiAlertTriangle />
            <p>
              Don't worry! Your order has been saved and you can try the payment again.
              No amount has been deducted from your account.
            </p>
          </div>

          {order && (
            <div className="order-info">
              <div className="order-number">
                <span>Order #{order.orderNumber}</span>
              </div>
              <div className="order-details">
                <div className="detail-row">
                  <span>Amount</span>
                  <span className="amount">₹{order.totalAmount?.toLocaleString()}</span>
                </div>
                <div className="detail-row">
                  <span>Payment Status</span>
                  <span className="status pending">Pending</span>
                </div>
              </div>
            </div>
          )}

          <div className="action-buttons">
            {orderId && (
              <Link to={`/orders/${orderId}`} className="btn btn-primary">
                <FiRefreshCw />
                Try Payment Again
              </Link>
            )}
            <Link to="/my-orders" className="btn btn-outline">
              <FiArrowLeft />
              View My Orders
            </Link>
          </div>

          <div className="help-section">
            <h3>Common reasons for payment failure:</h3>
            <ul>
              <li>Insufficient funds in your account</li>
              <li>Card details entered incorrectly</li>
              <li>Bank declined the transaction</li>
              <li>Network connectivity issues</li>
            </ul>
            <p>
              If the problem persists, please contact your bank or try a different payment method.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;
