import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiPackage, FiEye } from 'react-icons/fi';
import orderService from '../../services/orderService';
import { PageTransition } from '../../components/animations';
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

  // Card animation variants
  const cardVariants = {
    initial: { opacity: 0, y: 20, scale: 0.98 },
    animate: (index) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.3,
        delay: index * 0.08,
        ease: [0.4, 0, 0.2, 1]
      }
    }),
    hover: {
      y: -4,
      boxShadow: "0 12px 24px -8px rgba(15, 6, 137, 0.12)",
      transition: { duration: 0.2 }
    },
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <PageTransition className="my-orders-page">
      <motion.div 
        className="page-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="container">
          <h1>My Orders</h1>
          <p>Track and manage your orders</p>
        </div>
      </motion.div>

      <div className="container">
        {orders.length === 0 ? (
          <motion.div 
            className="empty-state"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <FiPackage size={80} />
            <h2>No orders yet</h2>
            <p>You haven't placed any orders yet. Start shopping now!</p>
            <Link to="/products" className="btn btn-primary btn-lg">
              Browse Products
            </Link>
          </motion.div>
        ) : (
          <div className="orders-list">
            {orders.map((order, index) => (
              <motion.div 
                key={order._id} 
                className="order-card"
                variants={cardVariants}
                initial="initial"
                animate="animate"
                whileHover="hover"
                custom={index}
              >
                <div className="order-header">
                  <div className="order-info">
                    <span className="order-number">Order #{order.orderNumber}</span>
                    <span className="order-date">{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="order-status-badges">
                    <span className={`badge badge-${getStatusColor(order.orderStatus)}`}>
                      {order.orderStatus}
                    </span>
                    {order.orderStatus === 'pending' && order.isModifiable && (
                      <span className="badge badge-editable" title={`${order.modificationTimeRemaining || 0} hours remaining to modify`}>
                        ✏️ Editable
                      </span>
                    )}
                  </div>
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
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Link to={`/orders/${order._id}`} className="btn btn-outline btn-sm">
                      <FiEye /> View Details
                    </Link>
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default MyOrders;
