import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiAlertTriangle, FiX } from 'react-icons/fi';
import productService from '../../services/productService';
import ImageUploader from '../../components/admin/ImageUploader';
import toast from 'react-hot-toast';
import './ProductManagement.css';

// SIMPLE CATEGORIES - Only 3 options
const DEFAULT_CATEGORIES = [
  { value: 'cement', label: 'Cement' },
  { value: 'steel', label: 'Steel' },
  { value: 'others', label: 'Others' }
];

const DEFAULT_UNITS = [
  { value: 'bags', label: 'Bags' },
  { value: 'kg', label: 'KG' },
  { value: 'tons', label: 'Tons' },
  { value: 'pieces', label: 'Pieces' },
  { value: 'rods', label: 'Rods' },
  { value: 'bundles', label: 'Bundles' },
  { value: 'loads', label: 'Loads' },
  { value: 'cft', label: 'CFT (Cubic Feet)' },
  { value: 'sqft', label: 'Sq.Ft' },
  { value: 'meters', label: 'Meters' },
  { value: 'feet', label: 'Feet' },
  { value: 'liters', label: 'Liters' },
  { value: 'boxes', label: 'Boxes' },
  { value: 'sets', label: 'Sets' },
  { value: 'numbers', label: 'Numbers' }
];

const ProductManagement = () => {
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [units, setUnits] = useState(DEFAULT_UNITS);
  const [customCategory, setCustomCategory] = useState('');
  const [customUnit, setCustomUnit] = useState('');
  const [formData, setFormData] = useState({
    productName: '',
    category: 'cement',
    subcategory: '',
    brand: '',
    description: '',
    specifications: '',
    price: '',
    stockQuantity: '',
    unit: 'bags',
    minOrderQuantity: 1,
    status: 'active',
    image: '',
    featured: false
  });

  useEffect(() => {
    fetchProducts();
    fetchProductOptions();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productService.getAllProductsAdmin();
      setProducts(response.products);
      setStats(response.stats);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductOptions = async () => {
    // Use only the default simple categories - Cement, Steel, Others
    // No need to fetch from server - admin controls are fixed
    setCategories(DEFAULT_CATEGORIES);
    setUnits(DEFAULT_UNITS);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingProduct) {
        await productService.updateProduct(editingProduct._id, formData);
        toast.success('Product updated successfully');
      } else {
        await productService.createProduct(formData);
        toast.success('Product created successfully');
      }
      
      setShowModal(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      productName: product.productName,
      category: product.category,
      subcategory: product.subcategory || '',
      brand: product.brand,
      description: product.description || '',
      specifications: product.specifications || '',
      price: product.price,
      stockQuantity: product.stockQuantity,
      unit: product.unit,
      minOrderQuantity: product.minOrderQuantity,
      status: product.status,
      image: product.image || '',
      featured: product.featured || false
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await productService.deleteProduct(id);
      toast.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setCustomCategory('');
    setCustomUnit('');
    setFormData({
      productName: '',
      category: 'cement',
      subcategory: '',
      brand: '',
      description: '',
      specifications: '',
      price: '',
      stockQuantity: '',
      unit: 'bags',
      minOrderQuantity: 1,
      status: 'active',
      image: '',
      featured: false
    });
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || product.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="product-management">
      <div className="page-title">
        <div>
          <h1>Product Management</h1>
          <p>Manage your inventory and products</p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <FiPlus /> Add Product
        </button>
      </div>

      {/* Stats */}
      <div className="product-stats">
        <div className="stat-item">
          <span className="stat-number">{stats?.total || 0}</span>
          <span className="stat-text">Total Products</span>
        </div>
        <div className="stat-item">
          <span className="stat-number active">{stats?.active || 0}</span>
          <span className="stat-text">Active</span>
        </div>
        <div className="stat-item">
          <span className="stat-number warning">{stats?.lowStock || 0}</span>
          <span className="stat-text">Low Stock</span>
        </div>
        <div className="stat-item">
          <span className="stat-number danger">{stats?.outOfStock || 0}</span>
          <span className="stat-text">Out of Stock</span>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="filter-select"
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(product => (
              <tr key={product._id}>
                <td>
                  <div className="product-cell">
                    <strong>{product.productName}</strong>
                    <span>{product.brand}</span>
                  </div>
                </td>
                <td>
                  <span className="category-badge">{product.category}</span>
                </td>
                <td>₹{product.price.toLocaleString()}/{product.unit}</td>
                <td>
                  <span className={`stock-badge ${
                    product.stockQuantity === 0 ? 'out' : 
                    product.stockQuantity <= product.lowStockThreshold ? 'low' : 'ok'
                  }`}>
                    {product.stockQuantity === 0 && <FiAlertTriangle />}
                    {product.stockQuantity} {product.unit}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${product.status}`}>
                    {product.status}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button 
                      className="action-btn edit"
                      onClick={() => handleEdit(product)}
                    >
                      <FiEdit2 />
                    </button>
                    <button 
                      className="action-btn delete"
                      onClick={() => handleDelete(product._id)}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredProducts.length === 0 && (
          <div className="no-data">
            <p>No products found</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input
                    type="text"
                    name="productName"
                    value={formData.productName}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Brand *</label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="form-select"
                    required
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Unit *</label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    className="form-select"
                    required
                  >
                    {units.map(unit => (
                      <option key={unit.value} value={unit.value}>{unit.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Subcategory</label>
                  <input
                    type="text"
                    name="subcategory"
                    value={formData.subcategory}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="e.g., TMT Bars, OPC 53 Grade"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Price (₹) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="form-input"
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Stock Quantity *</label>
                  <input
                    type="number"
                    name="stockQuantity"
                    value={formData.stockQuantity}
                    onChange={handleInputChange}
                    className="form-input"
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Min Order Qty</label>
                  <input
                    type="number"
                    name="minOrderQuantity"
                    value={formData.minOrderQuantity}
                    onChange={handleInputChange}
                    className="form-input"
                    min="1"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="form-input"
                  rows="2"
                  placeholder="Brief product description"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Specifications</label>
                <textarea
                  name="specifications"
                  value={formData.specifications}
                  onChange={handleInputChange}
                  className="form-input"
                  rows="2"
                  placeholder="Technical specifications (size, grade, etc.)"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Product Image</label>
                <ImageUploader
                  value={formData.image}
                  onChange={(url) => setFormData({ ...formData, image: url })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label checkbox-label">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="form-checkbox"
                  />
                  <span>Featured Product</span>
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
