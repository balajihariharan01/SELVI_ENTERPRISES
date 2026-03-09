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
      <div className="page-header">
        <div className="container">
          <h1>Shopping Cart</h1>
          <p>Review your items before checkout</p>
        </div>
      </div>

      <div className="container">
        <div className="cart-layout">
          {/* Cart Items */}
          <div className="cart-items">
            <div className="cart-header">
              <span>{cart.length} item{cart.length !== 1 ? 's' : ''} in cart</span>
              <button onClick={clearCart} className="clear-cart-btn">
                Clear Cart
              </button>
            </div>

            {cart.map(item => (
              <div key={item.product._id} className="cart-item">
                <div className="item-image">
                  <img 
                    src={item.product.image !== 'default-product.jpg' 
                      ? item.product.image 
                      : `https://via.placeholder.com/100?text=${encodeURIComponent(item.product.productName.substring(0, 10))}`
                    } 
                    alt={item.product.productName}
                  />
                </div>
                
                <div className="item-details">
                  <Link to={`/products/${item.product._id}`} className="item-name">
                    {item.product.productName}
                  </Link>
                  <p className="item-brand">{item.product.brand}</p>
                  <p className="item-price">₹{item.product.price.toLocaleString()} per {item.product.unit}</p>
                </div>

                <div className="item-quantity">
                  <button 
                    onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    <FiMinus />
                  </button>
                  <span>{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                    disabled={item.quantity >= item.product.stockQuantity}
                  >
                    <FiPlus />
                  </button>
                </div>

                <div className="item-subtotal">
                  ₹{(item.product.price * item.quantity).toLocaleString()}
                </div>

                <button 
                  className="remove-btn"
                  onClick={() => removeFromCart(item.product._id)}
                >
                  <FiTrash2 />
                </button>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="cart-summary">
            <h3>Order Summary</h3>
            
            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{getCartTotal().toLocaleString()}</span>
            </div>
            
            <div className="summary-row">
              <span>Delivery</span>
              <span className="free-delivery">Free</span>
            </div>
            
            <div className="summary-divider"></div>
            
            <div className="summary-row total">
              <span>Total</span>
              <span>₹{getCartTotal().toLocaleString()}</span>
            </div>

            <button 
              className="btn btn-primary btn-lg checkout-btn"
              onClick={() => navigate('/checkout')}
            >
              Proceed to Checkout
              <FiArrowRight />
            </button>

            <Link to="/products" className="continue-shopping">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
