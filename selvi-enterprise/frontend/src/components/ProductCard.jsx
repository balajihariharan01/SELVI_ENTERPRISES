import { Link } from 'react-router-dom';
import { FiShoppingCart, FiCheck } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { addToCart, isInCart } = useCart();
  const { isAuthenticated, isAdmin } = useAuth();

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return;
    }

    if (isAdmin) {
      toast.error('Admin cannot add items to cart');
      return;
    }

    addToCart(product, 1);
    toast.success(`${product.productName} added to cart`);
  };

  const inCart = isInCart(product._id);
  const inStock = product.stockQuantity > 0;

  return (
    <Link to={`/products/${product._id}`} className="product-card">
      <div className="product-image">
        <img 
          src={product.image !== 'default-product.jpg' 
            ? product.image 
            : `https://via.placeholder.com/300x200?text=${encodeURIComponent(product.productName)}`
          } 
          alt={product.productName}
        />
        {!inStock && <span className="out-of-stock-badge">Out of Stock</span>}
        {product.isLowStock && inStock && (
          <span className="low-stock-badge">Low Stock</span>
        )}
      </div>
      
      <div className="product-info">
        <span className="product-category">{product.category}</span>
        <h3 className="product-name">{product.productName}</h3>
        <p className="product-brand">{product.brand}</p>
        
        <div className="product-pricing">
          <span className="product-price">₹{product.price.toLocaleString()}</span>
          <span className="product-unit">per {product.unit}</span>
        </div>

        {!isAdmin && (
          <button 
            className={`add-to-cart-btn ${inCart ? 'in-cart' : ''}`}
            onClick={handleAddToCart}
            disabled={!inStock || inCart}
          >
            {inCart ? (
              <>
                <FiCheck /> In Cart
              </>
            ) : (
              <>
                <FiShoppingCart /> Add to Cart
              </>
            )}
          </button>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
