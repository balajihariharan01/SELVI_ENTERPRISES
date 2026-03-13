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
        className="page-header max-md:!py-8 max-md:!px-4 !bg-gradient-to-r !from-blue-600 !to-indigo-700 !text-white"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="container !max-w-7xl !mx-auto">
          <h1 className="max-md:!text-3xl !font-black !mb-2">My Orders</h1>
          <p className="max-md:!text-sm !opacity-90">Track and manage your orders</p>
        </div>
      </motion.div>

      <div className="container !max-w-7xl !mx-auto !py-8 max-md:!px-4">
        {orders.length === 0 ? (
          <motion.div
            className="empty-state !py-20 !text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <FiPackage size={80} className="!mx-auto !text-gray-200 !mb-6" />
            <h2 className="!text-2xl !font-bold !text-slate-900 !mb-3">No orders yet</h2>
            <p className="!text-gray-500 !mb-8">You haven't placed any orders yet. Start shopping now!</p>
            <Link to="/products" className="!inline-flex !items-center !justify-center !px-8 !py-4 !bg-blue-600 !text-white !rounded-2xl !font-bold !shadow-lg !shadow-blue-200">
              Browse Products
            </Link>
          </motion.div>
        ) : (
          <div className="orders-list !grid !grid-cols-1 !gap-6">
            {orders.map((order, index) => (
              <motion.div
                key={order._id}
                className="order-card !bg-white !rounded-3xl !p-6 !shadow-sm !border !border-gray-100 max-md:!p-5"
                variants={cardVariants}
                initial="initial"
                animate="animate"
                whileHover="hover"
                custom={index}
              >
                <div className="order-header !flex !justify-between !items-start !mb-6 max-md:!flex-col max-md:!gap-4">
                  <div className="order-info !flex !flex-col !gap-1">
                    <span className="order-number !text-lg !font-black !text-slate-900">#{order.orderNumber}</span>
                    <span className="order-date !text-xs !text-gray-400 !font-medium">{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="order-status-badges !flex !items-center !gap-2">
                    <span className={`!px-4 !py-1.5 !rounded-full !text-[11px] !font-bold !uppercase !tracking-wider badge-${getStatusColor(order.orderStatus)}`}>
                      {order.orderStatus}
                    </span>
                    {order.orderStatus === 'pending' && order.isModifiable && (
                      <span className="!px-3 !py-1.5 !bg-amber-100 !text-amber-600 !rounded-full !text-[11px] !font-bold !flex !items-center !gap-1">
                        ✏️ Editable
                      </span>
                    )}
                  </div>
                </div>

                <div className="order-items !py-6 !border-y !border-dashed !border-gray-100 !flex !flex-col !gap-4">
                  {order.items.slice(0, 2).map((item, index) => (
                    <div key={index} className="order-item !flex !justify-between !items-center !gap-4">
                      <div className="!flex-1">
                        <span className="item-name !text-sm !font-bold !text-slate-700 !block !mb-0.5">{item.productName}</span>
                        <span className="item-qty !text-[11px] !text-gray-400 !font-semibold">Quantity: {item.quantity} {item.unit}</span>
                      </div>
                      <span className="item-price !text-sm !font-black !text-slate-900">₹{item.subtotal.toLocaleString()}</span>
                    </div>
                  ))}
                  {order.items.length > 2 && (
                    <div className="more-items !text-[11px] !font-bold !text-blue-600 !bg-blue-50 !py-1 !px-3 !rounded-full !w-fit">
                      + {order.items.length - 2} more item(s)
                    </div>
                  )}
                </div>

                <div className="order-footer !mt-6 !flex !justify-between !items-center max-md:!flex-col max-md:!gap-5">
                  <div className="order-total !flex !flex-col max-md:!text-center">
                    <span className="!text-[10px] !text-gray-400 !font-bold !uppercase !tracking-widest !mb-0.5">Total Amount</span>
                    <span className="total-amount !text-2xl !font-black !text-blue-600">₹{order.totalAmount.toLocaleString()}</span>
                  </div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="max-md:!w-full"
                  >
                    <Link to={`/orders/${order._id}`} className="!flex !items-center !justify-center !gap-2 !px-8 !py-4 !bg-slate-900 !text-white !rounded-2xl !font-bold !text-sm !transition-all hover:!bg-blue-600 max-md:!w-full">
                      <FiEye /> View Order Details
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
