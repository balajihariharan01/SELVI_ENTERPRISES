import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FiGrid, FiPackage, FiShoppingCart, FiCreditCard, FiUsers, FiLogOut, FiHome, FiMenu, FiX } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import Logo from '../common/Logo';
import './AdminLayout.css';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="admin-layout max-lg:!flex-col max-lg:!min-h-screen">

      {/* Mobile Top Header (Visible only on mobile) */}
      <div className="hidden max-lg:!flex max-lg:!items-center max-lg:!justify-between max-lg:!p-4 max-lg:!bg-[#0f2544] max-lg:!text-white max-lg:!sticky max-lg:!top-0 max-lg:!z-[110] max-lg:!shadow-lg">
        <div className="max-lg:!flex max-lg:!items-center max-lg:!gap-3">
          <Logo className="!w-8 !h-8 !rounded-lg" />
          <span className="!font-bold !text-lg !tracking-tight">Admin Console</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="!p-2 !rounded-lg hover:!bg-white/10 !transition-colors !flex !items-center !justify-center"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      {mobileMenuOpen && (
        <div
          className="max-lg:!fixed max-lg:!inset-0 max-lg:!bg-black/60 max-lg:!backdrop-blur-sm max-lg:!z-[100] !transition-opacity !duration-300"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar - Shared logic for Desktop (Fixed) and Mobile (Drawer) */}
      <aside className={`admin-sidebar max-lg:!fixed max-lg:!top-0 max-lg:!bottom-0 max-lg:!left-0 max-lg:!w-[280px] max-lg:!h-full max-lg:!z-[120] max-lg:!transform max-lg:!transition-transform max-lg:!duration-300 max-lg:!ease-in-out ${mobileMenuOpen ? 'max-lg:!translate-x-0' : 'max-lg:!-translate-x-full'}`}>
        <div className="sidebar-header max-lg:!p-6 max-lg:!flex max-lg:!items-center max-lg:!justify-between max-lg:!border-b max-lg:!border-white/10">
          <div className="admin-logo">
            <Logo className="logo-img" />
            <span className="logo-text">Admin Panel</span>
          </div>
          {/* Close button inside drawer for better UX on small screens */}
          <button className="hidden max-lg:!flex !text-white/60 hover:!text-white" onClick={closeMobileMenu}>
            <FiX size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/admin" end className="nav-item" onClick={closeMobileMenu}>
            <FiGrid />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/admin/products" className="nav-item" onClick={closeMobileMenu}>
            <FiPackage />
            <span>Products</span>
          </NavLink>
          <NavLink to="/admin/orders" className="nav-item" onClick={closeMobileMenu}>
            <FiShoppingCart />
            <span>Orders</span>
          </NavLink>
          <NavLink to="/admin/payments" className="nav-item" onClick={closeMobileMenu}>
            <FiCreditCard />
            <span>Payment Details</span>
          </NavLink>
          <NavLink to="/admin/customers" className="nav-item" onClick={closeMobileMenu}>
            <FiUsers />
            <span>Customers</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <NavLink to="/" className="nav-item" onClick={closeMobileMenu}>
            <FiHome />
            <span>View Store</span>
          </NavLink>
          <button onClick={handleLogout} className="nav-item logout-btn">
            <FiLogOut />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="admin-main max-lg:!ml-0 max-lg:!flex-1 max-lg:!w-full">
        <header className="admin-header max-lg:!hidden">
          <h2>Welcome, {user?.name}</h2>
          <div className="header-actions">
            <span className="admin-badge">Admin</span>
          </div>
        </header>

        <main className="admin-content max-lg:!p-4 max-sm:!p-3 max-lg:!bg-[#f8fafc]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
