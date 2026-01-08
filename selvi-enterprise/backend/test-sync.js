require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/selvi-enterprise').then(async () => {
  console.log('Connected to MongoDB');
  
  const Order = require('./models/Order');
  const Payment = require('./models/Payment');
  
  // Get paid online orders
  const paidOrders = await Order.find({ 
    paymentStatus: 'paid',
    paymentMethod: 'online',
    orderStatus: { $nin: ['cancelled'] }
  }).populate('user', 'name email phone');
  
  console.log('Found', paidOrders.length, 'paid online orders');
  
  for (const order of paidOrders) {
    const existing = await Payment.findOne({
      $or: [
        { order: order._id },
        { stripePaymentIntentId: order.paymentIntentId }
      ]
    });
    
    if (existing) {
      console.log('Order', order.orderNumber, '- Payment exists, skipping');
      continue;
    }
    
    console.log('Order', order.orderNumber, '- No payment, trying to create...');
    console.log('  totalAmount:', order.totalAmount);
    console.log('  paymentIntentId:', order.paymentIntentId);
    console.log('  user:', order.user?._id || order.user);
    
    try {
      const paymentId = Payment.generatePaymentId();
      console.log('  Generated paymentId:', paymentId);
      
      const paymentData = {
        paymentId,
        order: order._id,
        orderNumber: order.orderNumber,
        user: order.user?._id || order.user,
        customerName: order.shippingAddress?.name || order.user?.name || 'N/A',
        customerEmail: order.user?.email || 'N/A',
        customerPhone: order.shippingAddress?.phone || order.user?.phone || 'N/A',
        paymentMethod: 'stripe',
        transactionId: order.paymentIntentId || `SYNC_${order.orderNumber}_${Date.now()}`,
        stripePaymentIntentId: order.paymentIntentId || null,
        amount: order.totalAmount,
        status: 'success',
        paymentDate: order.updatedAt || order.createdAt
      };
      
      console.log('  Payment data:', JSON.stringify(paymentData, null, 2));
      
      const newPayment = await Payment.create(paymentData);
      console.log('  SUCCESS! Created payment:', newPayment.paymentId);
    } catch (err) {
      console.log('  FAILED:', err.message);
      if (err.errors) {
        Object.keys(err.errors).forEach(field => {
          console.log('    Field error -', field + ':', err.errors[field].message);
        });
      }
    }
  }
  
  // Also check COD orders
  const codOrders = await Order.find({ 
    paymentMethod: 'cod',
    orderStatus: 'delivered'
  }).populate('user', 'name email phone');
  
  console.log('\nFound', codOrders.length, 'delivered COD orders');
  
  for (const order of codOrders) {
    const existing = await Payment.findOne({ order: order._id });
    
    if (existing) {
      console.log('COD Order', order.orderNumber, '- Payment exists, skipping');
      continue;
    }
    
    console.log('COD Order', order.orderNumber, '- No payment, trying to create...');
    
    try {
      const paymentId = Payment.generatePaymentId();
      const newPayment = await Payment.create({
        paymentId,
        order: order._id,
        orderNumber: order.orderNumber,
        user: order.user?._id || order.user,
        customerName: order.shippingAddress?.name || order.user?.name || 'N/A',
        customerEmail: order.user?.email || 'N/A',
        customerPhone: order.shippingAddress?.phone || order.user?.phone || 'N/A',
        paymentMethod: 'cod',
        transactionId: `COD_${order.orderNumber}_${Date.now()}`,
        amount: order.totalAmount,
        status: 'success',
        paymentDate: order.updatedAt || order.createdAt
      });
      console.log('  SUCCESS! Created payment:', newPayment.paymentId);
    } catch (err) {
      console.log('  FAILED:', err.message);
      if (err.errors) {
        Object.keys(err.errors).forEach(field => {
          console.log('    Field error -', field + ':', err.errors[field].message);
        });
      }
    }
  }
  
  console.log('\n=== Summary ===');
  const totalPayments = await Payment.countDocuments();
  console.log('Total payments in database:', totalPayments);
  
  mongoose.disconnect();
}).catch(e => console.error('Connection error:', e));
