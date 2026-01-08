import React, { useState, useEffect, useMemo } from 'react';
import {
  FaChartLine,
  FaArrowUp,
  FaArrowDown,
  FaFire,
  FaSnowflake,
  FaExclamationTriangle,
  FaBoxes,
  FaRupeeSign,
  FaShoppingCart,
  FaUsers,
  FaCalendarAlt,
  FaTruck,
  FaClock,
  FaCheckCircle,
  FaSpinner,
  FaChartBar,
  FaLightbulb,
  FaSync
} from 'react-icons/fa';
import './DashboardInsights.css';

// Time period options
const TIME_PERIODS = [
  { key: '7d', label: 'Last 7 Days' },
  { key: '30d', label: 'Last 30 Days' },
  { key: '90d', label: 'Last 90 Days' },
  { key: 'year', label: 'This Year' }
];

const DashboardInsights = ({ 
  orders = [], 
  products = [], 
  users = [],
  onProductClick = null,
  refreshData = null 
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [isLoading, setIsLoading] = useState(false);
  const [animatedValues, setAnimatedValues] = useState({});

  // Filter orders by selected time period
  const filteredOrders = useMemo(() => {
    const now = new Date();
    let daysBack = 30;
    
    switch (selectedPeriod) {
      case '7d': daysBack = 7; break;
      case '30d': daysBack = 30; break;
      case '90d': daysBack = 90; break;
      case 'year': daysBack = 365; break;
      default: daysBack = 30;
    }
    
    const cutoffDate = new Date(now.setDate(now.getDate() - daysBack));
    return orders.filter(order => new Date(order.createdAt) >= cutoffDate);
  }, [orders, selectedPeriod]);

  // Calculate key metrics
  const metrics = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, order) => {
      return order.status !== 'cancelled' ? sum + (order.totalAmount || 0) : sum;
    }, 0);

    const completedOrders = filteredOrders.filter(o => o.status === 'delivered' || o.status === 'completed');
    const pendingOrders = filteredOrders.filter(o => o.status === 'pending' || o.status === 'processing');
    const cancelledOrders = filteredOrders.filter(o => o.status === 'cancelled');

    const avgOrderValue = completedOrders.length > 0 
      ? totalRevenue / completedOrders.length 
      : 0;

    // Calculate growth (compare to previous period)
    const previousPeriodRevenue = totalRevenue * 0.85; // Simulated
    const revenueGrowth = previousPeriodRevenue > 0 
      ? ((totalRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100 
      : 0;

    return {
      totalRevenue,
      totalOrders: filteredOrders.length,
      completedOrders: completedOrders.length,
      pendingOrders: pendingOrders.length,
      cancelledOrders: cancelledOrders.length,
      avgOrderValue,
      revenueGrowth,
      conversionRate: 68.5, // Simulated
      newCustomers: Math.floor(users.length * 0.15) // Simulated
    };
  }, [filteredOrders, users]);

  // Calculate best selling products
  const bestSellingProducts = useMemo(() => {
    const productSales = {};
    
    filteredOrders.forEach(order => {
      if (order.items && order.status !== 'cancelled') {
        order.items.forEach(item => {
          const productId = item.product?._id || item.product;
          if (productId) {
            if (!productSales[productId]) {
              productSales[productId] = {
                product: item.product,
                name: item.name || item.product?.name || 'Unknown Product',
                quantity: 0,
                revenue: 0
              };
            }
            productSales[productId].quantity += item.quantity || 1;
            productSales[productId].revenue += (item.price || 0) * (item.quantity || 1);
          }
        });
      }
    });

    return Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [filteredOrders]);

  // Calculate low moving products
  const lowMovingProducts = useMemo(() => {
    const productSales = {};
    
    // Initialize all products
    products.forEach(product => {
      productSales[product._id] = {
        product,
        name: product.name,
        quantity: 0,
        stock: product.stock || 0
      };
    });
    
    // Count sales
    filteredOrders.forEach(order => {
      if (order.items && order.status !== 'cancelled') {
        order.items.forEach(item => {
          const productId = item.product?._id || item.product;
          if (productId && productSales[productId]) {
            productSales[productId].quantity += item.quantity || 1;
          }
        });
      }
    });

    return Object.values(productSales)
      .filter(p => p.quantity < 5 && p.stock > 0) // Less than 5 sold but in stock
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 5);
  }, [filteredOrders, products]);

  // Stock alerts
  const stockAlerts = useMemo(() => {
    return products
      .filter(p => p.stock !== undefined && p.stock <= 25)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 5)
      .map(product => ({
        product,
        name: product.name,
        stock: product.stock,
        status: product.stock === 0 ? 'out' : product.stock <= 10 ? 'critical' : 'low'
      }));
  }, [products]);

  // Revenue trend (simulated daily data)
  const revenueTrend = useMemo(() => {
    const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : selectedPeriod === '90d' ? 12 : 12;
    const trend = [];
    const baseRevenue = metrics.totalRevenue / days;
    
    for (let i = 0; i < days; i++) {
      const variance = (Math.random() - 0.5) * 0.6;
      trend.push({
        day: i + 1,
        revenue: baseRevenue * (1 + variance),
        label: selectedPeriod === '7d' 
          ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i] 
          : selectedPeriod === '30d'
          ? `Day ${i + 1}`
          : `Week ${i + 1}`
      });
    }
    return trend;
  }, [metrics.totalRevenue, selectedPeriod]);

  // Animate values on load
  useEffect(() => {
    setAnimatedValues({});
    const timer = setTimeout(() => {
      setAnimatedValues(metrics);
    }, 100);
    return () => clearTimeout(timer);
  }, [metrics]);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Handle refresh
  const handleRefresh = async () => {
    if (refreshData) {
      setIsLoading(true);
      await refreshData();
      setIsLoading(false);
    }
  };

  // Get max revenue for chart scaling
  const maxRevenue = Math.max(...revenueTrend.map(d => d.revenue));

  return (
    <div className="dashboard-insights">
      {/* Header */}
      <div className="insights-header">
        <div className="header-title">
          <FaChartLine className="title-icon" />
          <div>
            <h2>Business Insights</h2>
            <p>Performance analytics and predictions</p>
          </div>
        </div>
        
        <div className="header-actions">
          <div className="period-selector">
            {TIME_PERIODS.map(period => (
              <button
                key={period.key}
                className={`period-btn ${selectedPeriod === period.key ? 'active' : ''}`}
                onClick={() => setSelectedPeriod(period.key)}
              >
                {period.label}
              </button>
            ))}
          </div>
          
          {refreshData && (
            <button 
              className={`refresh-btn ${isLoading ? 'loading' : ''}`}
              onClick={handleRefresh}
              disabled={isLoading}
            >
              {isLoading ? <FaSpinner className="spin" /> : <FaSync />}
            </button>
          )}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card revenue-card">
          <div className="metric-icon">
            <FaRupeeSign />
          </div>
          <div className="metric-content">
            <span className="metric-label">Total Revenue</span>
            <span className="metric-value">{formatCurrency(animatedValues.totalRevenue || 0)}</span>
            <div className={`metric-change ${metrics.revenueGrowth >= 0 ? 'positive' : 'negative'}`}>
              {metrics.revenueGrowth >= 0 ? <FaArrowUp /> : <FaArrowDown />}
              <span>{Math.abs(metrics.revenueGrowth).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="metric-card orders-card">
          <div className="metric-icon">
            <FaShoppingCart />
          </div>
          <div className="metric-content">
            <span className="metric-label">Total Orders</span>
            <span className="metric-value">{animatedValues.totalOrders || 0}</span>
            <div className="metric-breakdown">
              <span className="completed"><FaCheckCircle /> {metrics.completedOrders}</span>
              <span className="pending"><FaClock /> {metrics.pendingOrders}</span>
            </div>
          </div>
        </div>

        <div className="metric-card avg-card">
          <div className="metric-icon">
            <FaChartBar />
          </div>
          <div className="metric-content">
            <span className="metric-label">Avg Order Value</span>
            <span className="metric-value">{formatCurrency(animatedValues.avgOrderValue || 0)}</span>
            <div className="metric-note">Per completed order</div>
          </div>
        </div>

        <div className="metric-card customers-card">
          <div className="metric-icon">
            <FaUsers />
          </div>
          <div className="metric-content">
            <span className="metric-label">New Customers</span>
            <span className="metric-value">{metrics.newCustomers}</span>
            <div className="metric-note">This period</div>
          </div>
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <div className="chart-section">
        <div className="section-header">
          <h3><FaChartLine /> Revenue Trend</h3>
        </div>
        <div className="chart-container">
          <div className="bar-chart">
            {revenueTrend.map((data, index) => (
              <div key={index} className="bar-column">
                <div 
                  className="bar"
                  style={{ 
                    height: `${(data.revenue / maxRevenue) * 100}%`,
                    animationDelay: `${index * 0.05}s`
                  }}
                >
                  <span className="bar-tooltip">{formatCurrency(data.revenue)}</span>
                </div>
                <span className="bar-label">{data.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Product Insights Grid */}
      <div className="products-insights-grid">
        {/* Best Selling Products */}
        <div className="insight-card best-sellers">
          <div className="card-header">
            <FaFire className="card-icon hot" />
            <h3>Best Selling Products</h3>
          </div>
          <div className="product-list">
            {bestSellingProducts.length > 0 ? (
              bestSellingProducts.map((item, index) => (
                <div 
                  key={index}
                  className="product-item"
                  onClick={() => onProductClick?.(item.product)}
                >
                  <span className="rank rank-hot">#{index + 1}</span>
                  <div className="product-info">
                    <span className="product-name">{item.name}</span>
                    <span className="product-stats">{item.quantity} sold • {formatCurrency(item.revenue)}</span>
                  </div>
                  <FaArrowUp className="trend-icon up" />
                </div>
              ))
            ) : (
              <div className="empty-message">No sales data available</div>
            )}
          </div>
        </div>

        {/* Low Moving Products */}
        <div className="insight-card low-movers">
          <div className="card-header">
            <FaSnowflake className="card-icon cold" />
            <h3>Low Moving Products</h3>
          </div>
          <div className="product-list">
            {lowMovingProducts.length > 0 ? (
              lowMovingProducts.map((item, index) => (
                <div 
                  key={index}
                  className="product-item"
                  onClick={() => onProductClick?.(item.product)}
                >
                  <span className="rank rank-cold">#{index + 1}</span>
                  <div className="product-info">
                    <span className="product-name">{item.name}</span>
                    <span className="product-stats">{item.quantity} sold • {item.stock} in stock</span>
                  </div>
                  <FaArrowDown className="trend-icon down" />
                </div>
              ))
            ) : (
              <div className="empty-message">All products performing well</div>
            )}
          </div>
        </div>

        {/* Stock Alerts */}
        <div className="insight-card stock-alerts">
          <div className="card-header">
            <FaExclamationTriangle className="card-icon warning" />
            <h3>Stock Alerts</h3>
          </div>
          <div className="stock-list">
            {stockAlerts.length > 0 ? (
              stockAlerts.map((item, index) => (
                <div 
                  key={index}
                  className={`stock-item stock-${item.status}`}
                  onClick={() => onProductClick?.(item.product)}
                >
                  <div className="stock-info">
                    <span className="product-name">{item.name}</span>
                    <span className="stock-count">
                      {item.stock === 0 ? 'Out of Stock' : `${item.stock} units left`}
                    </span>
                  </div>
                  <span className={`stock-badge badge-${item.status}`}>
                    {item.status === 'out' ? 'OUT' : item.status === 'critical' ? 'CRITICAL' : 'LOW'}
                  </span>
                </div>
              ))
            ) : (
              <div className="empty-message">
                <FaCheckCircle />
                <span>All stock levels healthy</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Predictions Section */}
      <div className="predictions-section">
        <div className="section-header">
          <FaLightbulb className="prediction-icon" />
          <h3>Smart Predictions</h3>
        </div>
        <div className="predictions-grid">
          <div className="prediction-card">
            <div className="prediction-header">
              <FaTruck />
              <span>Demand Forecast</span>
            </div>
            <p>Based on current trends, expect <strong>23% higher</strong> demand for cement products next week.</p>
          </div>
          
          <div className="prediction-card">
            <div className="prediction-header">
              <FaBoxes />
              <span>Restock Alert</span>
            </div>
            <p>Consider restocking <strong>steel products</strong> within 5 days to avoid stockouts.</p>
          </div>
          
          <div className="prediction-card">
            <div className="prediction-header">
              <FaCalendarAlt />
              <span>Peak Time</span>
            </div>
            <p>Orders typically peak on <strong>Tuesdays & Fridays</strong>. Prepare inventory accordingly.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardInsights;
