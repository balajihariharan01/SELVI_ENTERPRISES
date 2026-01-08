import { Routes, Route, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { useIsMobile } from './hooks/useMediaQuery'

// Layouts
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import ScrollToTop from './components/common/ScrollToTop'

// Public Pages
import Home from './pages/Home'
import MobileHome from './pages/MobileHome'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import About from './pages/About'
import Contact from './pages/Contact'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'

// User Pages
import Cart from './pages/user/Cart'
import Checkout from './pages/user/Checkout'
import MyOrders from './pages/user/MyOrders'
import OrderDetail from './pages/user/OrderDetail'
import Profile from './pages/user/Profile'
import PaymentSuccess from './pages/user/PaymentSuccess'
import PaymentFailed from './pages/user/PaymentFailed'

// Admin Pages
import AdminLayout from './components/admin/AdminLayout'
import Dashboard from './pages/admin/Dashboard'
import ProductManagement from './pages/admin/ProductManagement'
import OrderManagement from './pages/admin/OrderManagement'
import PaymentDetails from './pages/admin/PaymentDetails'
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
  
  // Show footer ONLY on the Home page (desktop view)
  const showFooter = isHomePage && !showMobileSPA

  return (
    <div className="app">
      {/* Global scroll to top on route change */}
      <ScrollToTop />
      
      {/* Mobile SPA View - Only on home page */}
      {showMobileSPA ? (
        <MobileHome />
      ) : (
        <>
          {/* Show navbar only for non-admin pages and non-mobile home */}
          {(!user || user.role !== 'admin' || !location.pathname.startsWith('/admin')) && <Navbar />}
          
          <main className="main-content">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />
              <Route path="/verify-email/:token" element={<VerifyEmail />} />

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
              <Route path="/payment-success" element={
                <ProtectedRoute>
                  <PaymentSuccess />
                </ProtectedRoute>
              } />
              <Route path="/payment-failed" element={
                <ProtectedRoute>
                  <PaymentFailed />
                </ProtectedRoute>
              } />

              {/* Admin Routes */}
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="products" element={<ProductManagement />} />
                <Route path="orders" element={<OrderManagement />} />
                <Route path="payments" element={<PaymentDetails />} />
                <Route path="customers" element={<CustomerRecords />} />
              </Route>
            </Routes>
          </main>

          {/* Show footer ONLY on Home page */}
          {showFooter && <Footer />}
        </>
      )}
    </div>
  )
}

export default App
