import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPackage, FiEye } from 'react-icons/fi';
import orderService from '../../services/orderService';
import './MyOrders.css';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await orderService.getMyOrders();
      setOrders(response.orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
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

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
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
    <div className="my-orders-page">
      <div className="page-header">
        <div className="container">
          <h1>My Orders</h1>
          <p>Track and manage your orders</p>
        </div>
      </div>

      <div className="container">
        {orders.length === 0 ? (
          <div className="empty-state">
            <FiPackage size={80} />
            <h2>No orders yet</h2>
            <p>You haven't placed any orders yet. Start shopping now!</p>
            <Link to="/products" className="btn btn-primary btn-lg">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map(order => (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    <span className="order-number">Order #{order.orderNumber}</span>
                    <span className="order-date">{formatDate(order.createdAt)}</span>
                  </div>
                  <span className={`badge badge-${getStatusColor(order.orderStatus)}`}>
                    {order.orderStatus}
                  </span>
                </div>

                <div className="order-items">
                  {order.items.slice(0, 2).map((item, index) => (
                    <div key={index} className="order-item">
                      <span className="item-name">{item.productName}</span>
                      <span className="item-qty">x {item.quantity} {item.unit}</span>
                      <span className="item-price">₹{item.subtotal.toLocaleString()}</span>
                    </div>
                  ))}
                  {order.items.length > 2 && (
                    <div className="more-items">
                      +{order.items.length - 2} more item(s)
                    </div>
                  )}
                </div>

                <div className="order-footer">
                  <div className="order-total">
                    <span>Total:</span>
                    <span className="total-amount">₹{order.totalAmount.toLocaleString()}</span>
                  </div>
                  <Link to={`/orders/${order._id}`} className="btn btn-outline btn-sm">
                    <FiEye /> View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
