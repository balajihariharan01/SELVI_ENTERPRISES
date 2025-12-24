import { Routes, Route, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useIsMobile } from './hooks/useMediaQuery'

// Layouts
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'

// Public Pages
import Home from './pages/Home'
import MobileHome from './pages/MobileHome'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Login from './pages/Login'
import Register from './pages/Register'

// User Pages
import Cart from './pages/user/Cart'
import Checkout from './pages/user/Checkout'
import MyOrders from './pages/user/MyOrders'
import OrderDetail from './pages/user/OrderDetail'
import Profile from './pages/user/Profile'

// Admin Pages
import AdminLayout from './components/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import ProductManagement from './pages/admin/ProductManagement'
import OrderManagement from './pages/admin/OrderManagement'
import CustomerRecords from './pages/admin/CustomerRecords'

// Protected Route Components
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'

function App() {
  const { user } = useAuth()
  const isMobile = useIsMobile()
  const location = useLocation()
  
  // Check if we're on a page that should show mobile SPA
  const isHomePage = location.pathname === '/'
  const showMobileSPA = isMobile && isHomePage

  return (
    <div className="app">
      {/* Mobile SPA View - Only on home page */}
      {showMobileSPA ? (
        <MobileHome />
      ) : (
        <>
          {/* Show navbar only for non-admin pages and non-mobile home */}
          {(!user || user.role !== 'admin' || !window.location.pathname.startsWith('/admin')) && <Navbar />}
          
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected User Routes */}
              <Route path="/cart" element={
                <ProtectedRoute>
                  <Cart />
                </ProtectedRoute>
              } />
              <Route path="/checkout" element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              } />
              <Route path="/my-orders" element={
                <ProtectedRoute>
                  <MyOrders />
                </ProtectedRoute>
              } />
              <Route path="/orders/:id" element={
                <ProtectedRoute>
                  <OrderDetail />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />

              {/* Admin Routes */}
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="products" element={<ProductManagement />} />
                <Route path="orders" element={<OrderManagement />} />
                <Route path="customers" element={<CustomerRecords />} />
              </Route>
            </Routes>
          </main>

          {/* Show footer only for non-admin pages */}
          {(!user || user.role !== 'admin' || !window.location.pathname.startsWith('/admin')) && <Footer />}
        </>
      )}
    </div>
  )
}

export default App
