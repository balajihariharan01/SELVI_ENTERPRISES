import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSearch, FiFilter, FiRefreshCw } from 'react-icons/fi';
import productService from '../services/productService';
import ProductCard from '../components/ProductCard';
import { PageTransition } from '../components/animations';
import './Products.css';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    search: '',
    sort: 'createdAt',
    inStock: false
  });

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  useEffect(() => {
    const category = searchParams.get('category');
    if (category) {
      setFilters(prev => ({ ...prev, category }));
    }
  }, [searchParams]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.category) params.category = filters.category;
      if (filters.search) params.search = filters.search;
      if (filters.sort) params.sort = filters.sort;
      if (filters.inStock) params.inStock = 'true';

      const response = await productService.getProducts(params);
      setProducts(response.products);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    if (key === 'category') {
      if (value) {
        setSearchParams({ category: value });
      } else {
        setSearchParams({});
      }
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  return (
    <PageTransition className="products-page">
      {/* Centered Modern Header Section */}
      <header className="products-header-section">
        <div className="products-container">
          <motion.h1 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="header-title"
          >
            Material Registry
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="header-subtitle"
          >
            High-Performance Procurement Systems
          </motion.p>
        </div>
      </header>

      <div className="products-container">
        <div className="products-layout">
          {/* Marketplace Filter Panel */}
          <aside className="filters-sidebar">
            <h3 className="sidebar-title">
              <FiFilter /> Catalog Bridge
            </h3>

            {/* Realtime Search Interface */}
            <div className="filter-section">
              <label>Instant Search</label>
              <form onSubmit={handleSearch} className="search-form">
                <FiSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Material query..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="search-input"
                />
              </form>
            </div>

            {/* Strategic Category Selection */}
            <div className="filter-section">
              <label>Unit Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="filter-dropdown"
              >
                <option value="">All Registries</option>
                <option value="cement">🧱 Cement Products</option>
                <option value="steel">🔩 Steel Components</option>
                <option value="others">📦 Bulk Materials</option>
              </select>
            </div>

            {/* Matrix Sequence (Sorting) */}
            <div className="filter-section">
              <label>Sequence Matrix</label>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="filter-dropdown"
              >
                <option value="createdAt">Chronological: Newest</option>
                <option value="price_asc">Valuation: Low to High</option>
                <option value="price_desc">Valuation: High to Low</option>
                <option value="name">Alphanumeric: A-Z</option>
              </select>
            </div>

            {/* Operational Stock Filter */}
            <div className="filter-section">
              <label>Availability</label>
              <label className="stock-toggle">
                <input
                  type="checkbox"
                  checked={filters.inStock}
                  onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                />
                <span>Operational In-Stock</span>
              </label>
            </div>

            {/* Reset Command */}
            <button
              className="clear-btn"
              onClick={() => {
                setFilters({ category: '', search: '', sort: 'createdAt', inStock: false });
                setSearchParams({});
              }}
            >
              <FiRefreshCw /> Reset Matrices
            </button>
          </aside>

          {/* Product Execution Grid */}
          <main className="products-grid-hub">
            <div className="results-meta">
              <p className="results-count">
                ACTIVE RECORDS: {products.length} OBJECTS
              </p>
            </div>

            {loading ? (
              <div className="page-loader">
                <div className="spinner"></div>
              </div>
            ) : products.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🛰️</span>
                <h3 className="empty-title">Zero Matches found</h3>
                <p className="empty-text">
                  Synchronize your search protocols or re-evaluate the filter matrix.
                </p>
              </div>
            ) : (
              <div className="product-grid">
                {products.map((product, index) => (
                  <ProductCard 
                    key={product._id} 
                    product={product} 
                    index={index} 
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </PageTransition>
  );
};

export default Products;
