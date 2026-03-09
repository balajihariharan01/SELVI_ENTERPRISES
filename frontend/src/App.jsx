import { lazy, Suspense } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuth } from './context/AuthContext'
import { useIsMobile } from './hooks/useMediaQuery'

// Core Layouts (not lazy - needed immediately)
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import ScrollToTop from './components/common/ScrollToTop'

// Protected Route Components (not lazy - needed for routing)
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'

// Loading component for Suspense
const PageLoader = () => (
  <div className="page-loader">
    <div className="loader-spinner"></div>
  </div>
)

// Lazy load Public Pages
const Home = lazy(() => import('./pages/Home'))
const MobileHome = lazy(() => import('./pages/MobileHome'))
const Products = lazy(() => import('./pages/Products'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const About = lazy(() => import('./pages/About'))
const Contact = lazy(() => import('./pages/Contact'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'))

// Lazy load User Pages
const Cart = lazy(() => import('./pages/user/Cart'))
const Checkout = lazy(() => import('./pages/user/Checkout'))
const MyOrders = lazy(() => import('./pages/user/MyOrders'))
const OrderDetail = lazy(() => import('./pages/user/OrderDetail'))
const Profile = lazy(() => import('./pages/user/Profile'))
const PaymentSuccess = lazy(() => import('./pages/user/PaymentSuccess'))
const PaymentFailed = lazy(() => import('./pages/user/PaymentFailed'))

// Lazy load Admin Pages
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'))
const Dashboard = lazy(() => import('./pages/admin/Dashboard'))
const ProductManagement = lazy(() => import('./pages/admin/ProductManagement'))
const OrderManagement = lazy(() => import('./pages/admin/OrderManagement'))
const PaymentDetails = lazy(() => import('./pages/admin/PaymentDetails'))
const CustomerRecords = lazy(() => import('./pages/admin/CustomerRecords'))

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
        <Suspense fallback={<PageLoader />}>
          <MobileHome />
        </Suspense>
      ) : (
        <>
          {/* Show navbar only for non-admin pages and non-mobile home */}
          {(!user || user.role !== 'admin' || !location.pathname.startsWith('/admin')) && <Navbar />}
          
          <main className="main-content">
            <Suspense fallback={<PageLoader />}>
              <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
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
              </AnimatePresence>
            </Suspense>
          </main>

          {/* Show footer ONLY on Home page */}
          {showFooter && <Footer />}
        </>
      )}
    </div>
  )
}

export default App
