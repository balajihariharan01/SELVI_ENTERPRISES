import { Link, useNavigate } from 'react-router-dom';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag, FiArrowRight } from 'react-icons/fi';
import { useCart } from '../../context/CartContext';
import './Cart.css';

const Cart = () => {
  const { cart, updateQuantity, removeFromCart, getCartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  if (cart.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="empty-cart">
            <FiShoppingBag size={80} />
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added any products to your cart yet.</p>
            <Link to="/products" className="btn btn-primary btn-lg">
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="page-header !bg-gradient-to-br !from-slate-900 !to-blue-900 !text-white !py-12 max-md:!py-10 max-md:!px-4">
        <div className="container !max-w-7xl !mx-auto">
          <h1 className="!text-3xl !font-black !mb-2 max-md:!text-2xl">Shopping Cart</h1>
          <p className="!text-slate-400 !text-sm">Review your selected items before checkout</p>
        </div>
      </div>

      <div className="container !max-w-7xl !mx-auto !py-10 max-md:!px-4">
        <div className="cart-layout !flex !gap-8 max-md:!flex-col">
          {/* Cart Items */}
          <div className="cart-items !flex-1 !flex !flex-col !gap-6">
            <div className="cart-header !flex !justify-between !items-center !pb-4 !border-b !border-gray-100">
              <span className="!text-sm !font-black !text-slate-900">{cart.length} item{cart.length !== 1 ? 's' : ''} in cart</span>
              <button onClick={clearCart} className="!text-xs !font-bold !text-red-500 hover:!text-red-700">
                Clear All
              </button>
            </div>

            {cart.map(item => (
              <div key={item.product._id} className="cart-item !bg-white !rounded-3xl !p-6 !shadow-sm !border !border-gray-50 !flex !gap-6 max-md:!p-4 max-md:!gap-4">
                <div className="item-image !w-24 !h-24 !bg-gray-50 !rounded-2xl !overflow-hidden !flex-shrink-0">
                  <img
                    className="!w-full !h-full !object-cover"
                    src={item.product.image !== 'default-product.jpg'
                      ? item.product.image
                      : `https://via.placeholder.com/100?text=${encodeURIComponent(item.product.productName.substring(0, 10))}`
                    }
                    alt={item.product.productName}
                  />
                </div>

                <div className="item-details !flex-1 !min-w-0">
                  <div className="!flex !justify-between !items-start !mb-2">
                    <Link to={`/products/${item.product._id}`} className="item-name !text-base !font-black !text-slate-900 !block !truncate group-hover:!text-blue-600">
                      {item.product.productName}
                    </Link>
                    <button
                      className="!p-2 !text-gray-300 hover:!text-red-500 !transition-colors"
                      onClick={() => removeFromCart(item.product._id)}
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>

                  <div className="!flex !justify-between !items-center !mt-4 max-md:!flex-col max-md:!items-start max-md:!gap-4">
                    <div className="item-quantity !flex !items-center !bg-slate-50 !p-1 !rounded-xl !border !border-gray-100">
                      <button
                        className="!w-10 !h-10 !flex !items-center !justify-center !text-blue-600 disabled:!opacity-30"
                        onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        <FiMinus />
                      </button>
                      <span className="!w-10 !text-center !font-black !text-slate-900 !text-sm">{item.quantity}</span>
                      <button
                        className="!w-10 !h-10 !flex !items-center !justify-center !text-blue-600"
                        onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stockQuantity}
                      >
                        <FiPlus />
                      </button>
                    </div>

                    <div className="!text-right max-md:!text-left max-md:!w-full max-md:!flex max-md:!justify-between max-md:!items-center">
                      <span className="!text-xs !text-gray-400 !font-bold !block max-md:!inline">Subtotal</span>
                      <span className="item-subtotal !text-lg !font-black !text-blue-600">₹{(item.product.price * item.quantity).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="cart-summary !w-96 !bg-white !rounded-3xl !p-8 !shadow-sm !border !border-gray-100 !h-fit max-md:!w-full max-md:!p-6">
            <h3 className="!text-lg !font-black !text-slate-900 !mb-8">Order Summary</h3>

            <div className="summary-row !flex !justify-between !items-center !mb-4">
              <span className="!text-sm !text-gray-400 !font-bold">Items Total</span>
              <span className="!text-sm !font-black !text-slate-900">₹{getCartTotal().toLocaleString()}</span>
            </div>

            <div className="summary-row !flex !justify-between !items-center !mb-8">
              <span className="!text-sm !text-gray-400 !font-bold">Shipping</span>
              <span className="!text-xs !font-black !text-green-600 !uppercase !tracking-widest">Free Delivery</span>
            </div>

            <div className="summary-divider !h-px !bg-dashed !bg-gray-100 !mb-8"></div>

            <div className="summary-row total !flex !justify-between !items-end !mb-10">
              <span className="!text-xs !font-bold !text-gray-400 !uppercase">Grand Total</span>
              <span className="!text-3xl !font-black !text-blue-600">₹{getCartTotal().toLocaleString()}</span>
            </div>

            <button
              className="!w-full !flex !items-center !justify-center !gap-3 !py-5 !bg-blue-600 !text-white !rounded-2xl !font-black !text-base !shadow-xl !shadow-blue-100 hover:!bg-blue-700 !transition-all"
              onClick={() => navigate('/checkout')}
            >
              Checkout Now
              <FiArrowRight size={20} />
            </button>

            <Link to="/products" className="!block !text-center !mt-6 !text-xs !font-bold !text-gray-400 hover:!text-blue-600">
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
