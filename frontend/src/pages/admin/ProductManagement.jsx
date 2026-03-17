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
      <div className="page-title !flex !justify-between !items-center !mb-10 max-md:!flex-col max-md:!items-start max-md:!gap-6 max-md:!px-4">
        <div>
          <h1 className="!text-3xl !font-black !text-slate-900 max-md:!text-2xl">Inventory Console</h1>
          <p className="!text-sm !font-bold !text-gray-400 !uppercase !tracking-widest">Global Stock Control</p>
        </div>
        <button className="!px-8 !py-4 !bg-blue-600 !text-white !rounded-2xl !text-xs !font-black !uppercase !tracking-widest hover:!bg-blue-700 !shadow-xl !shadow-blue-500/20 max-md:!w-full !flex !items-center !justify-center !gap-3" onClick={openAddModal}>
          <FiPlus size={18} /> Deploy Product
        </button>
      </div>

      {/* Stats */}
      <div className="product-stats !grid !grid-cols-4 !gap-6 !mb-10 max-xl:!grid-cols-2 max-md:!gap-4 max-md:!px-4">
        {[
          { label: 'Total Registry', value: stats?.total || 0, color: 'blue' },
          { label: 'Operational', value: stats?.active || 0, color: 'emerald' },
          { label: 'Low Threshold', value: stats?.lowStock || 0, color: 'amber' },
          { label: 'Exhausted', value: stats?.outOfStock || 0, color: 'red' }
        ].map((item, idx) => (
          <div key={idx} className="stat-item !bg-white !p-6 !rounded-3xl !border !border-gray-50 !shadow-sm !flex !flex-col !items-center !text-center">
            <span className={`!text-3xl !font-black !text-${item.color}-600 !mb-1`}>{item.value}</span>
            <span className="!text-[10px] !font-bold !text-gray-400 !uppercase !tracking-widest">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filters-bar !flex !gap-6 !mb-10 max-md:!flex-col max-md:!px-4">
        <div className="search-box !flex-1 !relative">
          <FiSearch className="!absolute !left-6 !top-1/2 !-translate-y-1/2 !text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search Registry..."
            className="!w-full !bg-white !border !border-gray-50 !rounded-2xl !pl-14 !pr-6 !py-4 !text-sm !font-medium focus:!border-blue-500 !shadow-sm !transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="filter-select !min-w-[240px] !bg-white !border !border-gray-50 !rounded-2xl !px-6 !py-4 !text-sm !font-black !uppercase !tracking-widest !shadow-sm max-md:!w-full"
        >
          <option value="">Full Archive</option>
          {categories.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      {/* Products View */}
      <div className="table-container max-md:!hidden">
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
                  <span className={`category-badge ${product.category?.toLowerCase()}`}>{product.category}</span>
                </td>
                <td>₹{product.price.toLocaleString()}/{product.unit}</td>
                <td>
                  <span className={`stock-badge ${product.stockQuantity === 0 ? 'out' :
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
      </div>

      {/* Mobile Products View (Cards) */}
      <div className="hidden max-md:!flex max-md:!flex-col max-md:!gap-6 max-md:!p-4">
        {filteredProducts.map(product => (
          <div key={product._id} className="!bg-white !rounded-[2.5rem] !p-8 !shadow-sm !border !border-gray-50 !relative !overflow-hidden">
            <div className="!relative !z-10">
              <div className="!flex !justify-between !items-start !mb-3">
                <span className={`!px-3 !py-1 !rounded-full !text-[9px] !font-black !uppercase !tracking-widest ${product.category === 'cement' ? '!bg-blue-50 !text-blue-600' :
                  product.category === 'steel' ? '!bg-slate-900 !text-white' : '!bg-emerald-50 !text-emerald-600'
                  }`}>
                  {product.category}
                </span>
                <span className="!text-xl !font-black !text-slate-900">₹{product.price.toLocaleString()}</span>
              </div>

              <h3 className="!text-xl !font-black !text-slate-900 !mb-1">{product.productName}</h3>
              <p className="!text-xs !font-bold !text-gray-400 !uppercase !tracking-widest !mb-6">{product.brand}</p>

              <div className="!grid !grid-cols-2 !gap-3 !mb-6">
                <div className="!bg-slate-50 !p-4 !rounded-2xl !flex !flex-col !gap-1">
                  <span className="!text-[9px] !font-black !text-gray-400 !uppercase !tracking-widest">Inventory</span>
                  <span className={`!text-sm !font-black ${product.stockQuantity <= 10 ? '!text-red-600' : '!text-slate-900'}`}>
                    {product.stockQuantity} {product.unit}
                  </span>
                </div>
                <div className="!bg-slate-50 !p-4 !rounded-2xl !flex !flex-col !gap-1">
                  <span className="!text-[9px] !font-black !text-gray-400 !uppercase !tracking-widest">Visibility</span>
                  <span className={`!text-sm !font-black !uppercase ${product.status === 'active' ? '!text-emerald-600' : '!text-red-600'}`}>
                    {product.status}
                  </span>
                </div>
              </div>

              <div className="!flex !gap-2">
                <button
                  className="!flex-1 !flex !items-center !justify-center !gap-2 !bg-blue-600 !text-white !py-4 !rounded-2xl !text-xs !font-black !uppercase !tracking-widest hover:!bg-blue-700 !shadow-lg !shadow-blue-500/20"
                  onClick={() => handleEdit(product)}
                >
                  <FiEdit2 size={16} /> Update
                </button>
                <button
                  className="!flex-1 !flex !items-center !justify-center !gap-2 !bg-slate-900 !text-white !py-4 !rounded-2xl !text-xs !font-black !uppercase !tracking-widest"
                  onClick={() => handleDelete(product._id)}
                >
                  <FiTrash2 size={16} /> Purge
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="no-data !py-20">
          <p className="!text-gray-400 !font-medium">No results found for your search.</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay !p-0 max-md:!items-end">
          <div className="modal max-md:!w-full max-md:!max-w-none max-md:!h-[92vh] max-md:!rounded-t-3xl max-md:!rounded-b-none max-md:!m-0 max-md:!overflow-hidden !flex !flex-col">
            <div className="modal-header max-md:!px-5 max-md:!py-6 max-md:!border-b">
              <h2 className="max-md:!text-lg">{editingProduct ? 'Edit Product' : 'New Product'}</h2>
              <button className="close-btn !bg-gray-100 !p-2 !rounded-full" onClick={() => setShowModal(false)}>
                <FiX size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form !flex-1 !overflow-y-auto max-md:!p-5">
              <div className="form-row max-md:!grid-cols-1">
                <div className="form-group">
                  <label className="form-label !text-xs !font-bold !text-gray-400 !uppercase">Product Name *</label>
                  <input
                    type="text"
                    name="productName"
                    value={formData.productName}
                    onChange={handleInputChange}
                    className="form-input !h-[52px] !rounded-xl !border-gray-200"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label !text-xs !font-bold !text-gray-400 !uppercase">Brand / Manufacturer *</label>
                  <input
                    type="text"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    className="form-input !h-[52px] !rounded-xl !border-gray-200"
                    required
                  />
                </div>
              </div>

              <div className="form-row max-md:!grid-cols-1">
                <div className="form-group">
                  <label className="form-label !text-xs !font-bold !text-gray-400 !uppercase">Primary Category *</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="form-select !h-[52px] !rounded-xl !border-gray-200"
                    required
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label !text-xs !font-bold !text-gray-400 !uppercase">Unit of Measure *</label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleInputChange}
                    className="form-select !h-[52px] !rounded-xl !border-gray-200"
                    required
                  >
                    {units.map(unit => (
                      <option key={unit.value} value={unit.value}>{unit.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label !text-xs !font-bold !text-gray-400 !uppercase">Subcategory (Optional)</label>
                <input
                  type="text"
                  name="subcategory"
                  value={formData.subcategory}
                  onChange={handleInputChange}
                  className="form-input !h-[52px] !rounded-xl !border-gray-200"
                  placeholder="e.g., TMT Bars, OPC 53 Grade"
                />
              </div>

              <div className="form-row max-md:!grid-cols-1">
                <div className="form-group">
                  <label className="form-label !text-xs !font-bold !text-gray-400 !uppercase">Selling Price (₹) *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    className="form-input !h-[52px] !rounded-xl !border-gray-200"
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <div className="!grid !grid-cols-2 !gap-3">
                    <div>
                      <label className="form-label !text-xs !font-bold !text-gray-400 !uppercase">Stock *</label>
                      <input
                        type="number"
                        name="stockQuantity"
                        value={formData.stockQuantity}
                        onChange={handleInputChange}
                        className="form-input !h-[52px] !rounded-xl !border-gray-200"
                        min="0"
                        required
                      />
                    </div>
                    <div>
                      <label className="form-label !text-xs !font-bold !text-gray-400 !uppercase">Min Qty</label>
                      <input
                        type="number"
                        name="minOrderQuantity"
                        value={formData.minOrderQuantity}
                        onChange={handleInputChange}
                        className="form-input !h-[52px] !rounded-xl !border-gray-200"
                        min="1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label !text-xs !font-bold !text-gray-400 !uppercase">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="form-input !min-h-[100px] !p-4 !rounded-xl !border-gray-200"
                  rows="3"
                  placeholder="Tell customers more about this product..."
                />
              </div>

              <div className="form-group">
                <label className="form-label !text-xs !font-bold !text-gray-400 !uppercase">Product Image</label>
                <div className="!bg-gray-50 !p-4 !rounded-2xl !border-2 !border-dashed !border-gray-200">
                  <ImageUploader
                    value={formData.image}
                    onChange={(url) => setFormData({ ...formData, image: url })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label !text-xs !font-bold !text-gray-400 !uppercase">Inventory Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="form-select !h-[52px] !rounded-xl !border-gray-200"
                >
                  <option value="active">Active (Visible to users)</option>
                  <option value="inactive">Inactive (Hidden from users)</option>
                </select>
              </div>

              <div className="form-group !mb-10">
                <label className="form-label checkbox-label !flex !items-center !gap-3 !bg-blue-50 !p-4 !rounded-xl !border !border-blue-100">
                  <input
                    type="checkbox"
                    name="featured"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="!w-5 !h-5 !rounded"
                  />
                  <span className="!text-sm !font-bold !text-blue-700">Promote as Featured Product</span>
                </label>
              </div>

              <div className="modal-actions !sticky !bottom-0 !bg-white !pt-4 !pb-6 !border-t max-md:!flex-col max-md:!gap-3">
                <button type="button" className="btn btn-secondary !w-full !py-4 !rounded-xl" onClick={() => setShowModal(false)}>
                  Dismiss
                </button>
                <button type="submit" className="btn btn-primary !w-full !py-4 !rounded-xl !bg-blue-600 !shadow-lg">
                  {editingProduct ? 'Save Changes' : 'Create Product'}
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
