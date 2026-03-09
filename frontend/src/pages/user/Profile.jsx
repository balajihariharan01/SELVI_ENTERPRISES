import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  FiUser, FiMail, FiPhone, FiMapPin, FiSave, FiCamera, FiUpload, 
  FiCheckCircle, FiAlertCircle, FiSend, FiShield, FiLock, FiEye, 
  FiEyeOff, FiPackage, FiCreditCard, FiTrendingUp, FiCalendar,
  FiEdit3, FiCheck, FiX, FiChevronRight, FiAward, FiStar,
  FiBell, FiSettings, FiLogOut, FiClock, FiGift, FiHeart
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import orderService from '../../services/orderService';
import uploadService from '../../services/uploadService';
import toast from 'react-hot-toast';
import './Profile.css';

const Profile = () => {
  const { user, updateUser, refreshUser, logout, isGoogleUser } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Verification states
  const [emailVerifying, setEmailVerifying] = useState(false);
  const [phoneOtpSending, setPhoneOtpSending] = useState(false);
  const [phoneOtpVerifying, setPhoneOtpVerifying] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);
  
  // Password change states
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // Order stats
  const [orderStats, setOrderStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    totalSpent: 0,
    lastOrder: null
  });
  const [ordersLoading, setOrdersLoading] = useState(true);
  
  // Notification preferences
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    promotions: false,
    newsletter: true
  });
  
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  // Calculate profile completion
  const profileCompletion = useMemo(() => {
    if (!user) return { percentage: 0, items: [] };
    
    const items = [
      { label: 'Profile Photo', completed: !!user.profileImage, points: 15 },
      { label: 'Full Name', completed: !!user.name, points: 15 },
      { label: 'Email Verified', completed: user.emailVerified || isGoogleUser, points: 20 },
      { label: 'Phone Number', completed: !!user.phone, points: 15 },
      { label: 'Phone Verified', completed: !!user.phoneVerified, points: 15 },
      { label: 'Address', completed: !!(user.address?.street && user.address?.city), points: 20 }
    ];
    
    const completed = items.filter(item => item.completed);
    const percentage = completed.reduce((sum, item) => sum + item.points, 0);
    
    return { percentage, items, completedCount: completed.length, totalCount: items.length };
  }, [user, isGoogleUser]);

  // Member since calculation
  const memberSince = useMemo(() => {
    if (!user?.createdAt) return 'Recently joined';
    const date = new Date(user.createdAt);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  }, [user]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        street: user.address?.street || '',
        city: user.address?.city || '',
        state: user.address?.state || '',
        pincode: user.address?.pincode || ''
      });
    }
  }, [user]);

  // Fetch order statistics
  useEffect(() => {
    const fetchOrderStats = async () => {
      try {
        const response = await orderService.getMyOrders();
        const orders = response.orders || [];
        
        const completed = orders.filter(o => o.orderStatus === 'delivered').length;
        const pending = orders.filter(o => ['pending', 'confirmed', 'processing', 'shipped'].includes(o.orderStatus)).length;
        const totalSpent = orders
          .filter(o => o.orderStatus !== 'cancelled')
          .reduce((sum, o) => sum + o.totalAmount, 0);
        
        setOrderStats({
          total: orders.length,
          completed,
          pending,
          totalSpent,
          lastOrder: orders[0] || null
        });
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setOrdersLoading(false);
      }
    };
    
    fetchOrderStats();
  }, []);

  // OTP Cooldown timer
  useEffect(() => {
    let interval;
    if (otpCooldown > 0) {
      interval = setInterval(() => {
        setOtpCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpCooldown]);

  const handleSendVerificationEmail = async () => {
    setEmailVerifying(true);
    try {
      await authService.sendVerificationEmail();
      toast.success('Verification email sent! Please check your inbox.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send verification email');
    } finally {
      setEmailVerifying(false);
    }
  };

  const handleSendPhoneOtp = async () => {
    if (!user?.phone || user.phone.length !== 10) {
      toast.error('Please add a valid 10-digit phone number first');
      return;
    }

    setPhoneOtpSending(true);
    try {
      await authService.sendPhoneOTP();
      setShowOtpInput(true);
      setOtpCooldown(60);
      toast.success('OTP sent to your phone number');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setPhoneOtpSending(false);
    }
  };

  const handleVerifyPhoneOtp = async () => {
    if (otpValue.length !== 6) {
      toast.error('Please enter a 6-digit OTP');
      return;
    }

    setPhoneOtpVerifying(true);
    try {
      await authService.verifyPhoneOTP(otpValue);
      await refreshUser();
      setShowOtpInput(false);
      setOtpValue('');
      toast.success('Phone number verified successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setPhoneOtpVerifying(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setImageLoading(true);
    try {
      const uploadResponse = await uploadService.uploadImage(file);
      const response = await authService.updateProfile({
        profileImage: uploadResponse.url
      });

      updateUser(response.user);
      toast.success('Profile picture updated!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setImageLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authService.updateProfile({
        name: formData.name,
        phone: formData.phone,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode
        }
      });

      updateUser(response.user);
      setSaveSuccess(true);
      setIsEditing(false);
      toast.success('Profile updated successfully!');
      
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setPasswordLoading(true);
    try {
      await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordSection(false);
      toast.success('Password changed successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="profile-dashboard">
      {/* Hero Header */}
      <div className="profile-hero">
        <div className="hero-pattern"></div>
        <div className="container">
          <div className="hero-content">
            <div className="hero-avatar-section">
              <div 
                className={`hero-avatar ${imageLoading ? 'loading' : ''}`}
                onClick={handleImageClick}
              >
                {user?.profileImage ? (
                  <img src={user.profileImage} alt={user.name} className="avatar-image" />
                ) : (
                  <span className="avatar-initials">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
                <div className="avatar-overlay">
                  {imageLoading ? (
                    <div className="avatar-spinner"></div>
                  ) : (
                    <FiCamera size={24} />
                  )}
                </div>
                {profileCompletion.percentage === 100 && (
                  <div className="avatar-badge">
                    <FiAward size={12} />
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden-input"
              />
            </div>
            
            <div className="hero-info">
              <div className="hero-name-row">
                <h1>{user?.name || 'Welcome!'}</h1>
                {(user?.emailVerified || isGoogleUser) && (
                  <span className="verified-badge" title="Verified Account">
                    <FiCheckCircle /> Verified
                  </span>
                )}
              </div>
              <p className="hero-email">{user?.email}</p>
              <div className="hero-meta">
                <span className="meta-item">
                  <FiCalendar /> Member since {memberSince}
                </span>
                <span className="meta-item">
                  <FiPackage /> {orderStats.total} Orders
                </span>
                {orderStats.totalSpent > 0 && (
                  <span className="meta-item premium">
                    <FiStar /> {formatCurrency(orderStats.totalSpent)} Lifetime Value
                  </span>
                )}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="hero-quick-stats">
              <div className="quick-stat">
                <span className="stat-value">{profileCompletion.percentage}%</span>
                <span className="stat-label">Profile Complete</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="dashboard-layout">
          {/* Sidebar Navigation */}
          <aside className="dashboard-sidebar">
            <nav className="sidebar-nav">
              <button 
                className={`nav-item ${activeSection === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveSection('overview')}
              >
                <FiUser /> Overview
              </button>
              <button 
                className={`nav-item ${activeSection === 'personal' ? 'active' : ''}`}
                onClick={() => setActiveSection('personal')}
              >
                <FiEdit3 /> Personal Info
              </button>
              <button 
                className={`nav-item ${activeSection === 'security' ? 'active' : ''}`}
                onClick={() => setActiveSection('security')}
              >
                <FiShield /> Security
              </button>
              <button 
                className={`nav-item ${activeSection === 'orders' ? 'active' : ''}`}
                onClick={() => setActiveSection('orders')}
              >
                <FiPackage /> Order Summary
              </button>
              <button 
                className={`nav-item ${activeSection === 'preferences' ? 'active' : ''}`}
                onClick={() => setActiveSection('preferences')}
              >
                <FiSettings /> Preferences
              </button>
            </nav>

            {/* Profile Completion Widget */}
            <div className="completion-widget">
              <div className="completion-header">
                <h4>Profile Strength</h4>
                <span className={`completion-percentage ${profileCompletion.percentage === 100 ? 'complete' : ''}`}>
                  {profileCompletion.percentage}%
                </span>
              </div>
              <div className="completion-bar">
                <div 
                  className="completion-fill" 
                  style={{ width: `${profileCompletion.percentage}%` }}
                ></div>
              </div>
              <ul className="completion-checklist">
                {profileCompletion.items.map((item, index) => (
                  <li key={index} className={item.completed ? 'completed' : ''}>
                    {item.completed ? <FiCheck /> : <FiX />}
                    <span>{item.label}</span>
                    <span className="points">+{item.points}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Main Content */}
          <main className="dashboard-main">
            {/* Overview Section */}
            {activeSection === 'overview' && (
              <div className="dashboard-section animate-in">
                {/* Stats Cards */}
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon orders">
                      <FiPackage />
                    </div>
                    <div className="stat-content">
                      <span className="stat-number">{orderStats.total}</span>
                      <span className="stat-title">Total Orders</span>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon completed">
                      <FiCheckCircle />
                    </div>
                    <div className="stat-content">
                      <span className="stat-number">{orderStats.completed}</span>
                      <span className="stat-title">Delivered</span>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon pending">
                      <FiClock />
                    </div>
                    <div className="stat-content">
                      <span className="stat-number">{orderStats.pending}</span>
                      <span className="stat-title">In Progress</span>
                    </div>
                  </div>
                  <div className="stat-card highlight">
                    <div className="stat-icon spending">
                      <FiTrendingUp />
                    </div>
                    <div className="stat-content">
                      <span className="stat-number">{formatCurrency(orderStats.totalSpent)}</span>
                      <span className="stat-title">Total Spent</span>
                    </div>
                  </div>
                </div>

                {/* Quick Info Cards */}
                <div className="info-cards-grid">
                  {/* Account Status Card */}
                  <div className="info-card">
                    <div className="info-card-header">
                      <h3><FiShield /> Account Status</h3>
                    </div>
                    <div className="info-card-body">
                      <div className="status-row">
                        <span className="status-label">Account Type</span>
                        <span className="status-value">{isGoogleUser ? 'Google Account' : 'Email Account'}</span>
                      </div>
                      <div className="status-row">
                        <span className="status-label">Email Status</span>
                        <span className={`status-badge ${user?.emailVerified || isGoogleUser ? 'verified' : 'pending'}`}>
                          {user?.emailVerified || isGoogleUser ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                      <div className="status-row">
                        <span className="status-label">Phone Status</span>
                        <span className={`status-badge ${user?.phoneVerified ? 'verified' : 'pending'}`}>
                          {user?.phoneVerified ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Last Order Card */}
                  <div className="info-card">
                    <div className="info-card-header">
                      <h3><FiPackage /> Recent Order</h3>
                      <a href="/my-orders" className="view-all">View All <FiChevronRight /></a>
                    </div>
                    <div className="info-card-body">
                      {orderStats.lastOrder ? (
                        <>
                          <div className="last-order-number">
                            #{orderStats.lastOrder.orderNumber}
                          </div>
                          <div className="status-row">
                            <span className="status-label">Date</span>
                            <span className="status-value">{formatDate(orderStats.lastOrder.createdAt)}</span>
                          </div>
                          <div className="status-row">
                            <span className="status-label">Amount</span>
                            <span className="status-value">{formatCurrency(orderStats.lastOrder.totalAmount)}</span>
                          </div>
                          <div className="status-row">
                            <span className="status-label">Status</span>
                            <span className={`order-status ${orderStats.lastOrder.orderStatus}`}>
                              {orderStats.lastOrder.orderStatus.charAt(0).toUpperCase() + orderStats.lastOrder.orderStatus.slice(1)}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="no-orders">
                          <FiPackage size={32} />
                          <p>No orders yet</p>
                          <a href="/products" className="btn btn-sm">Start Shopping</a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions Card */}
                  <div className="info-card quick-actions-card">
                    <div className="info-card-header">
                      <h3><FiStar /> Quick Actions</h3>
                    </div>
                    <div className="info-card-body">
                      <div className="quick-actions">
                        <button onClick={() => setActiveSection('personal')} className="quick-action-btn">
                          <FiEdit3 /> Edit Profile
                        </button>
                        <button onClick={() => setActiveSection('security')} className="quick-action-btn">
                          <FiLock /> Change Password
                        </button>
                        <a href="/my-orders" className="quick-action-btn">
                          <FiPackage /> My Orders
                        </a>
                        <a href="/products" className="quick-action-btn">
                          <FiHeart /> Browse Products
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Personal Info Section */}
            {activeSection === 'personal' && (
              <div className="dashboard-section animate-in">
                <div className="section-header">
                  <div>
                    <h2>Personal Information</h2>
                    <p>Update your personal details and address</p>
                  </div>
                  {!isEditing && (
                    <button className="btn btn-outline" onClick={() => setIsEditing(true)}>
                      <FiEdit3 /> Edit
                    </button>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="profile-form">
                  <div className="form-section">
                    <h3>Basic Information</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">Full Name</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="form-input"
                          disabled={!isEditing}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <div className="input-with-badge">
                          <input
                            type="email"
                            value={user?.email}
                            className="form-input"
                            disabled
                          />
                          {(user?.emailVerified || isGoogleUser) && (
                            <span className="input-badge verified"><FiCheckCircle /> Verified</span>
                          )}
                        </div>
                        <span className="form-hint">Email cannot be changed</span>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Phone Number</label>
                        <div className="input-with-badge">
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="form-input"
                            pattern="[0-9]{10}"
                            maxLength={10}
                            disabled={!isEditing}
                            placeholder="10-digit phone number"
                          />
                          {user?.phoneVerified && (
                            <span className="input-badge verified"><FiCheckCircle /> Verified</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <h3><FiMapPin /> Delivery Address</h3>
                    <div className="form-grid">
                      <div className="form-group full-width">
                        <label className="form-label">Street Address</label>
                        <input
                          type="text"
                          name="street"
                          value={formData.street}
                          onChange={handleChange}
                          placeholder="House/Building number, Street name"
                          className="form-input"
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">City</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          placeholder="Enter city"
                          className="form-input"
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">State</label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleChange}
                          placeholder="Enter state"
                          className="form-input"
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Pincode</label>
                        <input
                          type="text"
                          name="pincode"
                          value={formData.pincode}
                          onChange={handleChange}
                          placeholder="6-digit pincode"
                          className="form-input"
                          pattern="[0-9]{6}"
                          maxLength={6}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="form-actions">
                      <button 
                        type="button" 
                        className="btn btn-outline"
                        onClick={() => {
                          setIsEditing(false);
                          setFormData({
                            name: user.name || '',
                            phone: user.phone || '',
                            street: user.address?.street || '',
                            city: user.address?.city || '',
                            state: user.address?.state || '',
                            pincode: user.address?.pincode || ''
                          });
                        }}
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        className={`btn btn-primary ${saveSuccess ? 'success' : ''}`}
                        disabled={loading}
                      >
                        {loading ? (
                          <>Saving...</>
                        ) : saveSuccess ? (
                          <><FiCheck /> Saved!</>
                        ) : (
                          <><FiSave /> Save Changes</>
                        )}
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* Security Section */}
            {activeSection === 'security' && (
              <div className="dashboard-section animate-in">
                <div className="section-header">
                  <div>
                    <h2>Security & Verification</h2>
                    <p>Manage your account security and verification settings</p>
                  </div>
                </div>

                {/* Verification Center */}
                <div className="security-card">
                  <h3><FiShield /> Verification Center</h3>
                  <p className="section-desc">Verify your contact information to secure your account and enable all features.</p>
                  
                  <div className="verification-grid">
                    {/* Email Verification */}
                    <div className={`verification-card ${user?.emailVerified || isGoogleUser ? 'verified' : ''}`}>
                      <div className="verification-icon">
                        <FiMail />
                      </div>
                      <div className="verification-content">
                        <h4>Email Address</h4>
                        <p>{user?.email}</p>
                        {user?.emailVerified || isGoogleUser ? (
                          <span className="verification-status verified">
                            <FiCheckCircle /> Verified
                          </span>
                        ) : (
                          <>
                            <span className="verification-status pending">
                              <FiAlertCircle /> Not Verified
                            </span>
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={handleSendVerificationEmail}
                              disabled={emailVerifying}
                            >
                              <FiSend /> {emailVerifying ? 'Sending...' : 'Send Verification Email'}
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Phone Verification */}
                    <div className={`verification-card ${user?.phoneVerified ? 'verified' : ''}`}>
                      <div className="verification-icon">
                        <FiPhone />
                      </div>
                      <div className="verification-content">
                        <h4>Phone Number</h4>
                        <p>{user?.phone || 'Not added'}</p>
                        {user?.phoneVerified ? (
                          <span className="verification-status verified">
                            <FiCheckCircle /> Verified
                          </span>
                        ) : user?.phone ? (
                          <>
                            <span className="verification-status pending">
                              <FiAlertCircle /> Not Verified
                            </span>
                            {!showOtpInput ? (
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={handleSendPhoneOtp}
                                disabled={phoneOtpSending || otpCooldown > 0}
                              >
                                <FiSend /> {phoneOtpSending ? 'Sending...' : otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Send OTP'}
                              </button>
                            ) : (
                              <div className="otp-section">
                                <input
                                  type="text"
                                  value={otpValue}
                                  onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                  placeholder="Enter 6-digit OTP"
                                  className="otp-input"
                                  maxLength={6}
                                />
                                <div className="otp-actions">
                                  <button
                                    className="btn btn-sm btn-primary"
                                    onClick={handleVerifyPhoneOtp}
                                    disabled={phoneOtpVerifying || otpValue.length !== 6}
                                  >
                                    {phoneOtpVerifying ? 'Verifying...' : 'Verify'}
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline"
                                    onClick={handleSendPhoneOtp}
                                    disabled={phoneOtpSending || otpCooldown > 0}
                                  >
                                    {otpCooldown > 0 ? `${otpCooldown}s` : 'Resend'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="hint">Add phone number in Personal Info</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Password Change */}
                {!isGoogleUser && (
                  <div className="security-card">
                    <h3><FiLock /> Password</h3>
                    <p className="section-desc">Change your password regularly to keep your account secure.</p>
                    
                    {!showPasswordSection ? (
                      <button 
                        className="btn btn-outline"
                        onClick={() => setShowPasswordSection(true)}
                      >
                        <FiLock /> Change Password
                      </button>
                    ) : (
                      <form onSubmit={handlePasswordChange} className="password-form">
                        <div className="form-group">
                          <label className="form-label">Current Password</label>
                          <div className="password-input-wrapper">
                            <input
                              type={showPasswords.current ? 'text' : 'password'}
                              value={passwordData.currentPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                              className="form-input"
                              required
                            />
                            <button
                              type="button"
                              className="password-toggle"
                              onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                            >
                              {showPasswords.current ? <FiEyeOff /> : <FiEye />}
                            </button>
                          </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">New Password</label>
                          <div className="password-input-wrapper">
                            <input
                              type={showPasswords.new ? 'text' : 'password'}
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                              className="form-input"
                              minLength={8}
                              required
                            />
                            <button
                              type="button"
                              className="password-toggle"
                              onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                            >
                              {showPasswords.new ? <FiEyeOff /> : <FiEye />}
                            </button>
                          </div>
                          <span className="form-hint">Minimum 8 characters</span>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Confirm New Password</label>
                          <div className="password-input-wrapper">
                            <input
                              type={showPasswords.confirm ? 'text' : 'password'}
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                              className="form-input"
                              required
                            />
                            <button
                              type="button"
                              className="password-toggle"
                              onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                            >
                              {showPasswords.confirm ? <FiEyeOff /> : <FiEye />}
                            </button>
                          </div>
                        </div>

                        <div className="form-actions">
                          <button 
                            type="button" 
                            className="btn btn-outline"
                            onClick={() => {
                              setShowPasswordSection(false);
                              setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                            }}
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit" 
                            className="btn btn-primary"
                            disabled={passwordLoading}
                          >
                            {passwordLoading ? 'Updating...' : 'Update Password'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* Account Actions */}
                <div className="security-card danger-zone">
                  <h3><FiLogOut /> Session</h3>
                  <p className="section-desc">Sign out from your account on this device.</p>
                  <button className="btn btn-danger-outline" onClick={logout}>
                    <FiLogOut /> Sign Out
                  </button>
                </div>
              </div>
            )}

            {/* Order Summary Section */}
            {activeSection === 'orders' && (
              <div className="dashboard-section animate-in">
                <div className="section-header">
                  <div>
                    <h2>Order Summary</h2>
                    <p>Overview of your order history and spending</p>
                  </div>
                  <a href="/my-orders" className="btn btn-outline">
                    View All Orders <FiChevronRight />
                  </a>
                </div>

                <div className="order-stats-grid">
                  <div className="order-stat-card">
                    <div className="order-stat-icon total">
                      <FiPackage />
                    </div>
                    <div className="order-stat-info">
                      <span className="order-stat-value">{orderStats.total}</span>
                      <span className="order-stat-label">Total Orders</span>
                    </div>
                  </div>

                  <div className="order-stat-card">
                    <div className="order-stat-icon delivered">
                      <FiCheckCircle />
                    </div>
                    <div className="order-stat-info">
                      <span className="order-stat-value">{orderStats.completed}</span>
                      <span className="order-stat-label">Delivered</span>
                    </div>
                  </div>

                  <div className="order-stat-card">
                    <div className="order-stat-icon processing">
                      <FiClock />
                    </div>
                    <div className="order-stat-info">
                      <span className="order-stat-value">{orderStats.pending}</span>
                      <span className="order-stat-label">In Progress</span>
                    </div>
                  </div>

                  <div className="order-stat-card highlight">
                    <div className="order-stat-icon spending">
                      <FiCreditCard />
                    </div>
                    <div className="order-stat-info">
                      <span className="order-stat-value">{formatCurrency(orderStats.totalSpent)}</span>
                      <span className="order-stat-label">Total Spent</span>
                    </div>
                  </div>
                </div>

                {/* Recent Order */}
                {orderStats.lastOrder && (
                  <div className="recent-order-card">
                    <div className="recent-order-header">
                      <h3>Most Recent Order</h3>
                      <span className={`order-status-badge ${orderStats.lastOrder.orderStatus}`}>
                        {orderStats.lastOrder.orderStatus}
                      </span>
                    </div>
                    <div className="recent-order-body">
                      <div className="recent-order-detail">
                        <span className="detail-label">Order Number</span>
                        <span className="detail-value">#{orderStats.lastOrder.orderNumber}</span>
                      </div>
                      <div className="recent-order-detail">
                        <span className="detail-label">Date Placed</span>
                        <span className="detail-value">{formatDate(orderStats.lastOrder.createdAt)}</span>
                      </div>
                      <div className="recent-order-detail">
                        <span className="detail-label">Items</span>
                        <span className="detail-value">{orderStats.lastOrder.items?.length || 0} items</span>
                      </div>
                      <div className="recent-order-detail">
                        <span className="detail-label">Total Amount</span>
                        <span className="detail-value highlight">{formatCurrency(orderStats.lastOrder.totalAmount)}</span>
                      </div>
                    </div>
                    <a href={`/order/${orderStats.lastOrder._id}`} className="btn btn-primary btn-block">
                      View Order Details
                    </a>
                  </div>
                )}

                {orderStats.total === 0 && (
                  <div className="empty-orders">
                    <div className="empty-icon">
                      <FiPackage />
                    </div>
                    <h3>No Orders Yet</h3>
                    <p>Start shopping to see your order history here</p>
                    <a href="/products" className="btn btn-primary">
                      Browse Products
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Preferences Section */}
            {activeSection === 'preferences' && (
              <div className="dashboard-section animate-in">
                <div className="section-header">
                  <div>
                    <h2>Preferences</h2>
                    <p>Customize your account settings and notifications</p>
                  </div>
                </div>

                <div className="preferences-card">
                  <h3><FiBell /> Notification Preferences</h3>
                  <p className="section-desc">Choose what updates you want to receive</p>
                  
                  <div className="preference-list">
                    <div className="preference-item">
                      <div className="preference-info">
                        <h4>Order Updates</h4>
                        <p>Get notified about order status changes</p>
                      </div>
                      <label className="toggle">
                        <input 
                          type="checkbox" 
                          checked={notifications.orderUpdates}
                          onChange={(e) => setNotifications({ ...notifications, orderUpdates: e.target.checked })}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    <div className="preference-item">
                      <div className="preference-info">
                        <h4>Promotional Offers</h4>
                        <p>Receive exclusive deals and discounts</p>
                      </div>
                      <label className="toggle">
                        <input 
                          type="checkbox" 
                          checked={notifications.promotions}
                          onChange={(e) => setNotifications({ ...notifications, promotions: e.target.checked })}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>

                    <div className="preference-item">
                      <div className="preference-info">
                        <h4>Newsletter</h4>
                        <p>Monthly updates about new products</p>
                      </div>
                      <label className="toggle">
                        <input 
                          type="checkbox" 
                          checked={notifications.newsletter}
                          onChange={(e) => setNotifications({ ...notifications, newsletter: e.target.checked })}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="preferences-card">
                  <h3><FiGift /> Loyalty Status</h3>
                  <p className="section-desc">Your rewards and membership tier</p>
                  
                  <div className="loyalty-status">
                    <div className="loyalty-tier">
                      <div className="tier-icon">
                        {orderStats.totalSpent >= 100000 ? <FiAward /> : orderStats.totalSpent >= 50000 ? <FiStar /> : <FiHeart />}
                      </div>
                      <div className="tier-info">
                        <span className="tier-name">
                          {orderStats.totalSpent >= 100000 ? 'Gold Member' : orderStats.totalSpent >= 50000 ? 'Silver Member' : 'Member'}
                        </span>
                        <span className="tier-desc">
                          {orderStats.totalSpent >= 100000 
                            ? 'Enjoy premium benefits!' 
                            : orderStats.totalSpent >= 50000 
                              ? `${formatCurrency(100000 - orderStats.totalSpent)} away from Gold`
                              : `${formatCurrency(50000 - orderStats.totalSpent)} away from Silver`
                          }
                        </span>
                      </div>
                    </div>
                    <div className="tier-progress">
                      <div 
                        className="tier-progress-fill" 
                        style={{ 
                          width: `${Math.min(100, (orderStats.totalSpent / 100000) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Profile;
