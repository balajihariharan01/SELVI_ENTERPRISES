import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FiShoppingCart, FiMinus, FiPlus, FiArrowLeft, FiCheck } from 'react-icons/fi';
import productService from '../services/productService';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './ProductDetail.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  
  const { addToCart, isInCart, getItemQuantity } = useCart();
  const { isAuthenticated, isAdmin } = useAuth();

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await productService.getProduct(id);
      setProduct(response.product);
      if (response.product.minOrderQuantity) {
        setQuantity(response.product.minOrderQuantity);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Product not found');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (delta) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= (product?.minOrderQuantity || 1) && newQuantity <= product?.stockQuantity) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      navigate('/login');
      return;
    }

    if (isAdmin) {
      toast.error('Admin cannot add items to cart');
      return;
    }

    addToCart(product, quantity);
    toast.success(`${product.productName} added to cart`);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!product) {
    return null;
  }

  const inCart = isInCart(product._id);
  const cartQuantity = getItemQuantity(product._id);
  const inStock = product.stockQuantity > 0;

  // Determine category class for dynamic background
  const getCategoryClass = () => {
    const category = product.category?.toLowerCase();
    if (category === 'cement') return 'category-cement';
    if (category === 'steel') return 'category-steel';
    return 'category-other';
  };

  return (
    <div className={`product-detail-page ${getCategoryClass()}`}>
      <div className="container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link to="/products">
            <FiArrowLeft /> Back to Products
          </Link>
        </div>

        <div className="product-detail-layout">
          {/* Product Image */}
          <div className="product-detail-image">
            <img 
              src={product.image !== 'default-product.jpg' 
                ? product.image 
                : `https://via.placeholder.com/600x400?text=${encodeURIComponent(product.productName)}`
              } 
              alt={product.productName}
            />
            {!inStock && <div className="stock-overlay">Out of Stock</div>}
          </div>

          {/* Product Info */}
          <div className="product-detail-info">
            <span className="product-category-badge">{product.category}</span>
            <h1>{product.productName}</h1>
            <p className="product-brand">By {product.brand}</p>

            {product.description && (
              <p className="product-description">{product.description}</p>
            )}

            <div className="product-price-section">
              <span className="price">₹{product.price.toLocaleString()}</span>
              <span className="unit">per {product.unit}</span>
            </div>

            <div className="product-stock-info">
              {inStock ? (
                <span className={`stock-status ${product.isLowStock ? 'low' : 'in-stock'}`}>
                  {product.isLowStock 
                    ? `Low Stock - Only ${product.stockQuantity} ${product.unit} left`
                    : `In Stock - ${product.stockQuantity} ${product.unit} available`
                  }
                </span>
              ) : (
                <span className="stock-status out">Out of Stock</span>
              )}
            </div>

            {!isAdmin && inStock && (
              <>
                {/* Quantity Selector */}
                <div className="quantity-section">
                  <label>Quantity ({product.unit})</label>
                  <div className="quantity-selector">
                    <button 
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= (product.minOrderQuantity || 1)}
                    >
                      <FiMinus />
                    </button>
                    <input 
                      type="number" 
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (val >= (product.minOrderQuantity || 1) && val <= product.stockQuantity) {
                          setQuantity(val);
                        }
                      }}
                      min={product.minOrderQuantity || 1}
                      max={product.stockQuantity}
                    />
                    <button 
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= product.stockQuantity}
                    >
                      <FiPlus />
                    </button>
                  </div>
                  <span className="min-order">
                    Min. order: {product.minOrderQuantity || 1} {product.unit}
                  </span>
                </div>

                {/* Total Price */}
                <div className="total-section">
                  <span>Total:</span>
                  <span className="total-price">₹{(product.price * quantity).toLocaleString()}</span>
                </div>

                {/* Add to Cart Button */}
                <button 
                  className={`btn btn-primary btn-lg add-to-cart ${inCart ? 'in-cart' : ''}`}
                  onClick={handleAddToCart}
                  disabled={!inStock}
                >
                  {inCart ? (
                    <>
                      <FiCheck /> In Cart ({cartQuantity} {product.unit})
                    </>
                  ) : (
                    <>
                      <FiShoppingCart /> Add to Cart
                    </>
                  )}
                </button>
              </>
            )}

            {/* Product Details */}
            <div className="product-details-table">
              <h3>Product Details</h3>
              <table>
                <tbody>
                  <tr>
                    <td>Category</td>
                    <td>{product.category.charAt(0).toUpperCase() + product.category.slice(1)}</td>
                  </tr>
                  <tr>
                    <td>Brand</td>
                    <td>{product.brand}</td>
                  </tr>
                  <tr>
                    <td>Unit</td>
                    <td>{product.unit}</td>
                  </tr>
                  <tr>
                    <td>Minimum Order</td>
                    <td>{product.minOrderQuantity || 1} {product.unit}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
