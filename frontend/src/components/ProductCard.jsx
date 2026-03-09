import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiShoppingCart, FiCheck } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './ProductCard.css';

const ProductCard = ({ product, index = 0 }) => {
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

  // Animation variants for the card
  const cardVariants = {
    initial: { 
      opacity: 0, 
      y: 30, 
      scale: 0.96 
    },
    animate: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        duration: 0.35, 
        delay: index * 0.08,
        ease: [0.4, 0, 0.2, 1] 
      }
    },
    hover: {
      y: -8,
      transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
    },
  };

  // Animation for the add to cart button
  const buttonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.02 },
    tap: { scale: 0.97 },
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="initial"
      animate="animate"
      whileHover="hover"
    >
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
          <motion.button 
            className={`add-to-cart-btn ${inCart ? 'in-cart' : ''}`}
            onClick={handleAddToCart}
            disabled={!inStock || inCart}
            variants={buttonVariants}
            whileHover={!inCart && inStock ? "hover" : undefined}
            whileTap={!inCart && inStock ? "tap" : undefined}
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
          </motion.button>
        )}
      </div>
    </Link>
    </motion.div>
  );
};

export default ProductCard;
