import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSearch, FiFilter } from 'react-icons/fi';
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
      {/* Page Header */}
      <motion.div
        className="page-header !py-16 !bg-[#0f172a] !text-center max-md:!py-10 max-md:!px-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="container">
          <h1 className="!text-5xl !font-black !text-white !mb-4 max-md:!text-3xl">Material Registry</h1>
          <p className="!text-slate-400 !text-lg !font-medium max-md:!text-sm">High-Performance Construction Logistics</p>
        </div>
      </motion.div>

      <div className="container">
        <div className="products-layout">
          {/* Filters Sidebar */}
          <aside className="filters-sidebar max-md:!hidden">
            <div className="filter-section">
              <h3><FiFilter /> Filters</h3>
            </div>

            {/* Search */}
            <div className="filter-section">
              <label>Search</label>
              <form onSubmit={handleSearch} className="search-form">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="form-input"
                />
                <button type="submit" className="search-btn">
                  <FiSearch />
                </button>
              </form>
            </div>

            {/* Category Filter */}
            <div className="filter-section">
              <label>Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="form-select"
              >
                <option value="">All Categories</option>
                <option value="cement">Cement</option>
                <option value="steel">Steel</option>
                <option value="others">Others</option>
              </select>
            </div>

            {/* Sort */}
            <div className="filter-section">
              <label>Sort By</label>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="form-select"
              >
                <option value="createdAt">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </div>

            {/* In Stock */}
            <div className="filter-section">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.inStock}
                  onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                />
                <span>In Stock Only</span>
              </label>
            </div>

            {/* Clear Filters */}
            <button
              className="btn btn-outline btn-sm"
              onClick={() => {
                setFilters({ category: '', search: '', sort: 'createdAt', inStock: false });
                setSearchParams({});
              }}
            >
              Clear Filters
            </button>
          </aside>

          {/* Mobile Filters Hub */}
          <div className="hidden max-md:!flex max-md:!flex-col max-md:!gap-4 max-md:!px-4 max-md:!mb-8">
            <div className="!relative">
              <FiSearch className="!absolute !left-5 !top-1/2 !-translate-y-1/2 !text-blue-500" size={18} />
              <input
                type="text"
                placeholder="Quick Query catalog..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="!w-full !bg-white !border !border-slate-200 !rounded-2xl !pl-14 !pr-6 !py-4 !text-sm !font-medium"
              />
            </div>
            <div className="!grid !grid-cols-2 !gap-3">
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="!bg-white !border !border-slate-300 !rounded-xl !px-4 !py-3 !text-xs !font-black !uppercase !tracking-widest !text-slate-900"
              >
                <option value="">Categories</option>
                <option value="cement">Cement</option>
                <option value="steel">Steel</option>
                <option value="others">Others</option>
              </select>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="!bg-white !border !border-slate-300 !rounded-xl !px-4 !py-3 !text-xs !font-black !uppercase !tracking-widest !text-slate-900"
              >
                <option value="createdAt">Sorting: New</option>
                <option value="price_asc">Price: Asc</option>
                <option value="price_desc">Price: Desc</option>
                <option value="name">Name: A-Z</option>
              </select>
            </div>
          </div>

          {/* Products Grid */}
          <div className="products-content">
            <div className="products-header">
              <p className="products-count">
                Showing {products.length} product{products.length !== 1 ? 's' : ''}
              </p>
            </div>

            {loading ? (
              <div className="loading">
                <div className="spinner"></div>
              </div>
            ) : products.length === 0 ? (
              <motion.div
                className="empty-state"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="empty-state-icon">📦</div>
                <h3 className="empty-state-title">No products found</h3>
                <p className="empty-state-text">
                  Try adjusting your filters or search criteria
                </p>
              </motion.div>
            ) : (
              <div className="products-grid">
                {products.map((product, index) => (
                  <ProductCard key={product._id} product={product} index={index} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Products;
