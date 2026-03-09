import { useState, useEffect } from 'react';
import { FiX, FiCheck, FiMinus, FiPackage, FiDollarSign, FiLayers, FiTruck, FiAlertCircle } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import './ProductComparison.css';

/**
 * Product Comparison Component
 * Compare up to 4 similar products side by side
 */
const ProductComparison = ({ 
  products = [], 
  category,
  onClose,
  onRemoveProduct 
}) => {
  const { addToCart, isInCart } = useCart();
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    setTimeout(() => setAnimateIn(true), 50);
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const getStockStatus = (stock) => {
    if (stock <= 0) return { label: 'Out of Stock', class: 'out-of-stock' };
    if (stock <= 10) return { label: 'Low Stock', class: 'low-stock' };
    return { label: 'In Stock', class: 'in-stock' };
  };

  const getCheapestPrice = () => {
    if (products.length === 0) return null;
    return Math.min(...products.map(p => p.price));
  };

  const cheapestPrice = getCheapestPrice();

  // Comparison attributes
  const comparisonFields = [
    { 
      key: 'price', 
      label: 'Price', 
      icon: <FiDollarSign />,
      render: (product) => (
        <div className={`price-cell ${product.price === cheapestPrice ? 'best-value' : ''}`}>
          <span className="price-value">{formatPrice(product.price)}</span>
          <span className="price-unit">/{product.unit}</span>
          {product.price === cheapestPrice && products.length > 1 && (
            <span className="best-badge">Best Price</span>
          )}
        </div>
      )
    },
    { 
      key: 'brand', 
      label: 'Brand', 
      icon: <FiPackage />,
      render: (product) => (
        <span className="brand-name">{product.brand || 'N/A'}</span>
      )
    },
    { 
      key: 'unit', 
      label: 'Unit Type', 
      icon: <FiLayers />,
      render: (product) => (
        <span className="unit-type">{product.unit}</span>
      )
    },
    { 
      key: 'minOrder', 
      label: 'Min. Order', 
      icon: <FiTruck />,
      render: (product) => (
        <span>{product.minOrder || 1} {product.unit}</span>
      )
    },
    { 
      key: 'stock', 
      label: 'Availability', 
      icon: <FiAlertCircle />,
      render: (product) => {
        const status = getStockStatus(product.stock);
        return (
          <div className={`stock-cell ${status.class}`}>
            {status.class === 'in-stock' ? <FiCheck /> : 
             status.class === 'low-stock' ? <FiAlertCircle /> : <FiX />}
            <span>{status.label}</span>
            {product.stock > 0 && (
              <span className="stock-count">({product.stock} available)</span>
            )}
          </div>
        );
      }
    },
    { 
      key: 'category', 
      label: 'Category', 
      icon: <FiLayers />,
      render: (product) => (
        <span className="category-tag">{product.category}</span>
      )
    }
  ];

  if (products.length === 0) {
    return (
      <div className="comparison-empty">
        <FiPackage className="empty-icon" />
        <h3>No Products to Compare</h3>
        <p>Add products to compare their features side by side</p>
      </div>
    );
  }

  return (
    <div className={`product-comparison ${animateIn ? 'animate-in' : ''}`}>
      {/* Header */}
      <div className="comparison-header">
        <div className="header-content">
          <h2>Compare {category ? `${category} Products` : 'Products'}</h2>
          <p>Comparing {products.length} product{products.length > 1 ? 's' : ''}</p>
        </div>
        {onClose && (
          <button className="close-btn" onClick={onClose}>
            <FiX />
          </button>
        )}
      </div>

      {/* Comparison Table */}
      <div className="comparison-table-wrapper">
        <table className="comparison-table">
          {/* Product Headers */}
          <thead>
            <tr>
              <th className="attribute-header">Feature</th>
              {products.map((product, index) => (
                <th key={product._id} className="product-header" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="product-header-content">
                    <div className="product-image-wrapper">
                      <img 
                        src={product.image || '/placeholder.png'} 
                        alt={product.name}
                        onError={(e) => e.target.src = '/placeholder.png'}
                      />
                    </div>
                    <h4 className="product-name">{product.name}</h4>
                    {onRemoveProduct && (
                      <button 
                        className="remove-product-btn"
                        onClick={() => onRemoveProduct(product._id)}
                      >
                        <FiX />
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Comparison Rows */}
          <tbody>
            {comparisonFields.map((field, fieldIndex) => (
              <tr key={field.key} style={{ animationDelay: `${fieldIndex * 0.05}s` }}>
                <td className="attribute-cell">
                  <span className="attribute-icon">{field.icon}</span>
                  <span className="attribute-label">{field.label}</span>
                </td>
                {products.map((product) => (
                  <td key={`${product._id}-${field.key}`} className="value-cell">
                    {field.render(product)}
                  </td>
                ))}
              </tr>
            ))}

            {/* Add to Cart Row */}
            <tr className="action-row">
              <td className="attribute-cell">
                <span className="attribute-label">Action</span>
              </td>
              {products.map((product) => (
                <td key={`${product._id}-action`} className="value-cell action-cell">
                  {isInCart(product._id) ? (
                    <button className="action-btn in-cart" disabled>
                      <FiCheck /> In Cart
                    </button>
                  ) : (
                    <button 
                      className="action-btn add-to-cart"
                      onClick={() => addToCart(product, product.minOrder || 1)}
                      disabled={product.stock <= 0}
                    >
                      {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Summary */}
      {products.length > 1 && (
        <div className="comparison-summary">
          <div className="summary-item">
            <span className="summary-label">Price Range:</span>
            <span className="summary-value">
              {formatPrice(Math.min(...products.map(p => p.price)))} - {formatPrice(Math.max(...products.map(p => p.price)))}
            </span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Brands:</span>
            <span className="summary-value">
              {[...new Set(products.map(p => p.brand).filter(Boolean))].join(', ') || 'N/A'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductComparison;
