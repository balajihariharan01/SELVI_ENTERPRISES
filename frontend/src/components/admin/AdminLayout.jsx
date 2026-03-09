import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FiGrid, FiPackage, FiShoppingCart, FiCreditCard, FiUsers, FiLogOut, FiHome } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import Logo from '../common/Logo';
import './AdminLayout.css';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="admin-logo">
            <Logo className="logo-img" />
            <span className="logo-text">Admin Panel</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/admin" end className="nav-item">
            <FiGrid />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/admin/products" className="nav-item">
            <FiPackage />
            <span>Products</span>
          </NavLink>
          <NavLink to="/admin/orders" className="nav-item">
            <FiShoppingCart />
            <span>Orders</span>
          </NavLink>
          <NavLink to="/admin/payments" className="nav-item">
            <FiCreditCard />
            <span>Payment Details</span>
          </NavLink>
          <NavLink to="/admin/customers" className="nav-item">
            <FiUsers />
            <span>Customers</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <NavLink to="/" className="nav-item">
            <FiHome />
            <span>View Store</span>
          </NavLink>
          <button onClick={handleLogout} className="nav-item logout-btn">
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="admin-main">
        <header className="admin-header">
          <h2>Welcome, {user?.name}</h2>
          <div className="header-actions">
            <span className="admin-badge">Admin</span>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
