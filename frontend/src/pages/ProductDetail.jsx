import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiShoppingCart, FiMinus, FiPlus, FiArrowLeft, FiCheck } from 'react-icons/fi';
import productService from '../services/productService';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { PageTransition } from '../components/animations';
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
    <PageTransition className={`product-detail-page ${getCategoryClass()}`}>
      <div className="container">
        {/* Breadcrumb */}
        <div className="breadcrumb !mb-10">
          <Link to="/products" className="!inline-flex !items-center !gap-3 !bg-white !text-slate-600 !px-4 !py-3 !rounded-2xl !text-xs !font-black !uppercase !tracking-widest !border !border-slate-100 !shadow-sm hover:!bg-slate-50 !transition-all">
            <FiArrowLeft size={16} /> Material Registry
          </Link>
        </div>

        <div className="product-detail-layout !items-center">
          {/* Product Image */}
          <motion.div
            className="product-detail-image !flex-1 !relative !overflow-hidden !rounded-[2.5rem] !shadow-xl max-md:!mb-10 max-md:!rounded-3xl !aspect-square !bg-white"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <img
              src={product.image !== 'default-product.jpg'
                ? product.image
                : `https://via.placeholder.com/600x400?text=${encodeURIComponent(product.productName)}`
              }
              alt={product.productName}
              className="!w-full !h-full !object-cover !transition-transform !duration-700 hover:!scale-110"
            />
            {!inStock && <div className="stock-overlay !absolute !inset-0 !bg-slate-900/60 !backdrop-blur-sm !flex !items-center !justify-center !text-white !font-black !text-2xl !uppercase !tracking-[0.2em]">Out of Stock</div>}
          </motion.div>

          {/* Product Info */}
          <motion.div
            className="product-detail-info !flex-1 max-md:!px-4"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <span className="product-category-badge !bg-blue-50 !text-blue-600 !border !border-blue-100 !px-5 !py-2 !rounded-full !text-[9px] !font-black !uppercase !tracking-[0.2em] !mb-6 !inline-block">
              {product.category} Registry
            </span>
            <h1 className="!text-4xl !font-black !text-slate-900 !leading-tight !mb-2 max-md:!text-3xl !tracking-tight">{product.productName}</h1>
            <p className="product-brand !text-slate-400 !font-bold !uppercase !tracking-widest !mb-6 !text-xs">Manufactured by {product.brand}</p>

            {product.description && (
              <p className="product-description !text-slate-500 !text-base !leading-relaxed !mb-8 max-md:!text-sm !max-w-[450px]">
                {product.description}
              </p>
            )}

            <div className="product-price-section !bg-slate-50/50 !p-6 !rounded-2xl !mb-8 !flex !items-baseline !gap-2 !border !border-slate-100/50">
              <span className="price !text-3xl !font-black !text-blue-600">₹{product.price.toLocaleString()}</span>
              <span className="unit !text-slate-400 !font-black !text-[10px] !uppercase !tracking-widest">Pricing per {product.unit}</span>
            </div>

            {!isAdmin && inStock && (
              <div className="!bg-white !border !border-slate-100/80 !p-6 !rounded-[2rem] !shadow-sm !mb-10">
                {/* Quantity Selector */}
                <div className="quantity-section !mb-6">
                  <label className="!text-[9px] !font-black !text-slate-400 !uppercase !tracking-[0.2em] !mb-3 !block">Specify Requirement ({product.unit})</label>
                  <div className="quantity-selector !flex !items-center !gap-6">
                    <button
                      className="!w-14 !h-14 !bg-slate-50 !rounded-2xl !flex !items-center !justify-center !text-slate-900 active:!bg-slate-100 !transition-all"
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= (product.minOrderQuantity || 1)}
                    >
                      <FiMinus size={20} />
                    </button>
                    <input
                      type="number"
                      className="!w-24 !text-center !text-2xl !font-black !text-slate-900 !bg-transparent !outline-none"
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (val >= (product.minOrderQuantity || 1) && val <= product.stockQuantity) {
                          setQuantity(val);
                        }
                      }}
                    />
                    <button
                      className="!w-14 !h-14 !bg-slate-50 !rounded-2xl !flex !items-center !justify-center !text-slate-900 active:!bg-slate-100 !transition-all"
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= product.stockQuantity}
                    >
                      <FiPlus size={20} />
                    </button>
                  </div>
                </div>

                {/* Logistics CTA */}
                <div className="!flex !flex-col !gap-6">
                  <div className="!flex !justify-between !items-center !bg-slate-50 !p-4 !rounded-xl !border !border-slate-100 !mb-2">
                    <span className="!text-slate-400 !font-black !text-[9px] !uppercase !tracking-widest">Order Evaluation</span>
                    <span className="!text-xl !font-black !text-blue-600">₹{(product.price * quantity).toLocaleString()}</span>
                  </div>

                  <button
                    className={`!w-full !py-5 !rounded-xl !text-xs !font-black !uppercase !tracking-[0.2em] !flex !items-center !justify-center !gap-3 !shadow-2xl !transition-all active:!scale-[0.98] ${inCart
                        ? '!bg-emerald-500 !text-white !shadow-emerald-500/20'
                        : '!bg-slate-900 !text-white !shadow-slate-900/20'
                      }`}
                    onClick={handleAddToCart}
                  >
                    {inCart ? (
                      <>
                        <FiCheck size={18} /> Secured in Vault
                      </>
                    ) : (
                      <>
                        <FiShoppingCart size={18} /> Initiate Fulfillment
                      </>
                    )}
                  </button>
                </div>
              </div>
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
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default ProductDetail;
