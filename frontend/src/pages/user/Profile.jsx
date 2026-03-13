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
      <div className="profile-hero !bg-slate-900 !text-white !py-16 !relative !overflow-hidden max-md:!py-10 max-md:!px-6">
        <div className="hero-pattern !absolute !inset-0 !opacity-10 !bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] !from-blue-500 !via-transparent !to-transparent"></div>
        <div className="container !max-w-7xl !mx-auto !relative !z-10">
          <div className="hero-content !flex !items-center !gap-10 max-md:!flex-col max-md:!text-center max-md:!gap-6">
            <div className="hero-avatar-section !relative">
              <div
                className={`hero-avatar !w-40 !h-40 !rounded-[2.5rem] !border-4 !border-slate-800 !shadow-2xl !cursor-pointer !relative !overflow-hidden max-md:!w-32 max-md:!h-32 ${imageLoading ? 'loading' : ''}`}
                onClick={handleImageClick}
              >
                {user?.profileImage ? (
                  <img src={user.profileImage} alt={user.name} className="!w-full !h-full !object-cover" />
                ) : (
                  <div className="!w-full !h-full !bg-blue-600 !flex !items-center !justify-center !text-5xl !font-black !text-white">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                <div className="avatar-overlay !absolute !inset-0 !bg-slate-900/60 !opacity-0 hover:!opacity-100 !flex !items-center !justify-center !transition-all">
                  {imageLoading ? (
                    <FiLoader className="!animate-spin !text-white" size={32} />
                  ) : (
                    <FiCamera className="!text-white" size={32} />
                  )}
                </div>
              </div>
              {profileCompletion.percentage === 100 && (
                <div className="!absolute !-bottom-2 !-right-2 !bg-yellow-400 !text-slate-900 !w-10 !h-10 !rounded-2xl !flex !items-center !justify-center !shadow-lg !border-4 !border-slate-900">
                  <FiAward size={18} />
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="!hidden"
              />
            </div>

            <div className="hero-info !flex-1">
              <div className="hero-name-row !flex !items-center !gap-4 !mb-2 max-md:!justify-center max-md:!flex-col max-md:!gap-2">
                <h1 className="!text-4xl !font-black !tracking-tight max-md:!text-3xl">{user?.name || 'Selvi Patron'}</h1>
                {(user?.emailVerified || isGoogleUser) && (
                  <span className="!px-3 !py-1 !bg-blue-500/20 !text-blue-400 !rounded-full !text-[10px] !font-black !uppercase !tracking-widest !flex !items-center !gap-1.5 !border !border-blue-500/30">
                    <FiCheckCircle /> Verified Patron
                  </span>
                )}
              </div>
              <p className="!text-slate-400 !text-lg !font-medium !mb-6 max-md:!text-sm">{user?.email}</p>
              <div className="hero-meta !flex !flex-wrap !gap-6 max-md:!justify-center max-md:!gap-4">
                <span className="!flex !items-center !gap-2 !text-xs !font-bold !text-slate-500 !uppercase !tracking-wider">
                  <FiCalendar className="!text-blue-600" /> Joined {memberSince}
                </span>
                <span className="!flex !items-center !gap-2 !text-xs !font-bold !text-slate-500 !uppercase !tracking-wider">
                  <FiPackage className="!text-blue-600" /> {orderStats.total} Orders
                </span>
                {orderStats.totalSpent > 0 && (
                  <span className="!flex !items-center !gap-2 !text-xs !font-bold !text-yellow-500 !uppercase !tracking-widest">
                    <FiStar /> ₹{orderStats.totalSpent.toLocaleString()} Spent
                  </span>
                )}
              </div>
            </div>

            <div className="hero-quick-stats max-md:!w-full">
              <div className="!bg-slate-800 !p-6 !rounded-[2rem] !border !border-slate-700 !text-center">
                <div className="!text-3xl !font-black !text-blue-400 !mb-1">{profileCompletion.percentage}%</div>
                <div className="!text-[10px] !font-bold !text-slate-500 !uppercase !tracking-widest">Profile Power</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-md:px-4">
        <div className="dashboard-layout max-md:flex max-md:flex-col max-md:mt-6 max-md:gap-4">
          {/* Sidebar Navigation */}
          <aside className="dashboard-sidebar !w-72 max-md:!w-full max-md:!bg-white max-md:!sticky max-md:!top-0 max-md:!z-20 max-md:!border-b">
            <nav className="sidebar-nav !flex !flex-col !gap-2 !p-4 max-md:!flex-row max-md:!overflow-x-auto max-md:!whitespace-nowrap max-md:!p-2 max-md:!hide-scrollbar">
              <button
                className={`!flex !items-center !gap-3 !px-6 !py-4 !rounded-2xl !text-sm !font-bold !transition-all ${activeSection === 'overview' ? '!bg-blue-600 !text-white !shadow-lg !shadow-blue-100' : '!text-slate-500 hover:!bg-slate-50'}`}
                onClick={() => setActiveSection('overview')}
              >
                <FiUser size={18} /> Overview
              </button>
              <button
                className={`!flex !items-center !gap-3 !px-6 !py-4 !rounded-2xl !text-sm !font-bold !transition-all ${activeSection === 'personal' ? '!bg-blue-600 !text-white !shadow-lg !shadow-blue-100' : '!text-slate-500 hover:!bg-slate-50'}`}
                onClick={() => setActiveSection('personal')}
              >
                <FiEdit3 size={18} /> Profile
              </button>
              <button
                className={`!flex !items-center !gap-3 !px-6 !py-4 !rounded-2xl !text-sm !font-bold !transition-all ${activeSection === 'security' ? '!bg-blue-600 !text-white !shadow-lg !shadow-blue-100' : '!text-slate-500 hover:!bg-slate-50'}`}
                onClick={() => setActiveSection('security')}
              >
                <FiShield size={18} /> Security
              </button>
              <button
                className={`!flex !items-center !gap-3 !px-6 !py-4 !rounded-2xl !text-sm !font-bold !transition-all ${activeSection === 'orders' ? '!bg-blue-600 !text-white !shadow-lg !shadow-blue-100' : '!text-slate-500 hover:!bg-slate-50'}`}
                onClick={() => setActiveSection('orders')}
              >
                <FiPackage size={18} /> Analytics
              </button>
              <button
                className={`!flex !items-center !gap-3 !px-6 !py-4 !rounded-2xl !text-sm !font-bold !transition-all ${activeSection === 'preferences' ? '!bg-blue-600 !text-white !shadow-lg !shadow-blue-100' : '!text-slate-500 hover:!bg-slate-50'}`}
                onClick={() => setActiveSection('preferences')}
              >
                <FiSettings size={18} /> Settings
              </button>
            </nav>

            {/* Profile Completion Widget */}
            <div className="completion-widget max-md:hidden">
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
          <main className="dashboard-main max-md:w-full">
            {/* Overview Section */}
            {activeSection === 'overview' && (
              <div className="dashboard-section animate-in">
                {/* Stats Cards */}
                <div className="stats-grid !grid !grid-cols-4 !gap-6 max-md:!grid-cols-2 max-sm:!grid-cols-1 max-md:!p-4">
                  <div className="stat-card !bg-white !p-8 !rounded-3xl !shadow-sm !border !border-gray-50 !flex !flex-col !gap-4">
                    <div className="stat-icon !w-12 !h-12 !bg-blue-50 !text-blue-600 !rounded-2xl !flex !items-center !justify-center !text-xl">
                      <FiPackage />
                    </div>
                    <div className="stat-content">
                      <span className="stat-number !text-2xl !font-black !text-slate-900 !block">{orderStats.total}</span>
                      <span className="stat-title !text-[10px] !font-bold !text-gray-400 !uppercase !tracking-widest">Total Orders</span>
                    </div>
                  </div>
                  <div className="stat-card !bg-white !p-8 !rounded-3xl !shadow-sm !border !border-gray-50 !flex !flex-col !gap-4">
                    <div className="stat-icon !w-12 !h-12 !bg-green-50 !text-green-600 !rounded-2xl !flex !items-center !justify-center !text-xl">
                      <FiCheckCircle />
                    </div>
                    <div className="stat-content">
                      <span className="stat-number !text-2xl !font-black !text-slate-900 !block">{orderStats.completed}</span>
                      <span className="stat-title !text-[10px] !font-bold !text-gray-400 !uppercase !tracking-widest">Successful</span>
                    </div>
                  </div>
                  <div className="stat-card !bg-white !p-8 !rounded-3xl !shadow-sm !border !border-gray-50 !flex !flex-col !gap-4">
                    <div className="stat-icon !w-12 !h-12 !bg-amber-50 !text-amber-600 !rounded-2xl !flex !items-center !justify-center !text-xl">
                      <FiClock />
                    </div>
                    <div className="stat-content">
                      <span className="stat-number !text-2xl !font-black !text-slate-900 !block">{orderStats.pending}</span>
                      <span className="stat-title !text-[10px] !font-bold !text-gray-400 !uppercase !tracking-widest">Active</span>
                    </div>
                  </div>
                  <div className="stat-card highlight !bg-blue-600 !p-8 !rounded-3xl !shadow-xl !shadow-blue-100 !flex !flex-col !gap-4">
                    <div className="stat-icon !w-12 !h-12 !bg-white/20 !text-white !rounded-2xl !flex !items-center !justify-center !text-xl">
                      <FiTrendingUp />
                    </div>
                    <div className="stat-content">
                      <span className="stat-number !text-2xl !font-black !text-white !block">₹{orderStats.totalSpent.toLocaleString()}</span>
                      <span className="stat-title !text-[10px] !font-bold !text-white/60 !uppercase !tracking-widest">Investment</span>
                    </div>
                  </div>
                </div>

                {/* Quick Info Cards */}
                <div className="info-cards-grid !grid !grid-cols-2 !gap-8 max-md:!grid-cols-1 max-md:!p-4">
                  {/* Account Status Card */}
                  <div className="info-card !bg-white !rounded-3xl !p-8 !shadow-sm !border !border-gray-50">
                    <div className="info-card-header !flex !items-center !gap-3 !mb-8">
                      <div className="!w-10 !h-10 !bg-blue-50 !text-blue-600 !rounded-xl !flex !items-center !justify-center">
                        <FiShield />
                      </div>
                      <h3 className="!text-lg !font-black !text-slate-900">Security Check</h3>
                    </div>
                    <div className="info-card-body !space-y-6">
                      <div className="status-row !flex !justify-between !items-center">
                        <span className="!text-xs !font-bold !text-gray-400 !uppercase">Gateway</span>
                        <span className="!text-xs !font-black !text-slate-700">{isGoogleUser ? '⚡ Google Auth' : '📧 Direct Email'}</span>
                      </div>
                      <div className="status-row !flex !justify-between !items-center">
                        <span className="!text-xs !font-bold !text-gray-400 !uppercase">Email Status</span>
                        <span className={`!px-3 !py-1 !rounded-full !text-[10px] !font-black !uppercase !tracking-widest ${user?.emailVerified || isGoogleUser ? '!bg-green-100 !text-green-600' : '!bg-amber-100 !text-amber-600'}`}>
                          {user?.emailVerified || isGoogleUser ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                      <div className="status-row !flex !justify-between !items-center">
                        <span className="!text-xs !font-bold !text-gray-400 !uppercase">Phone Access</span>
                        <span className={`!px-3 !py-1 !rounded-full !text-[10px] !font-black !uppercase !tracking-widest ${user?.phoneVerified ? '!bg-green-100 !text-green-600' : '!bg-amber-100 !text-amber-600'}`}>
                          {user?.phoneVerified ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Last Order Card */}
                  <div className="info-card !bg-white !rounded-3xl !p-8 !shadow-sm !border !border-gray-50">
                    <div className="info-card-header !flex !justify-between !items-center !mb-8">
                      <div className="!flex !items-center !gap-3">
                        <div className="!w-10 !h-10 !bg-indigo-50 !text-indigo-600 !rounded-xl !flex !items-center !justify-center">
                          <FiPackage />
                        </div>
                        <h3 className="!text-lg !font-black !text-slate-900">Recent Pulse</h3>
                      </div>
                      <a href="/my-orders" className="!text-xs !font-bold !text-blue-600 hover:!underline">Full History</a>
                    </div>
                    <div className="info-card-body">
                      {orderStats.lastOrder ? (
                        <div className="!space-y-4">
                          <div className="!text-2xl !font-black !text-slate-900 !mb-4">
                            #{orderStats.lastOrder.orderNumber}
                          </div>
                          <div className="status-row !flex !justify-between !items-center">
                            <span className="!text-xs !font-bold !text-gray-400 !uppercase">Placed On</span>
                            <span className="!text-xs !font-bold !text-slate-700">{formatDate(orderStats.lastOrder.createdAt)}</span>
                          </div>
                          <div className="status-row !flex !justify-between !items-center">
                            <span className="!text-xs !font-bold !text-gray-400 !uppercase">Investment</span>
                            <span className="!text-xs !font-black !text-blue-600">₹{orderStats.lastOrder.totalAmount.toLocaleString()}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="!text-center !py-6">
                          <p className="!text-sm !text-gray-400 !font-bold !mb-6">No purchase data yet.</p>
                          <a href="/products" className="!inline-block !px-6 !py-3 !bg-slate-900 !text-white !rounded-xl !text-xs !font-black hover:!bg-blue-600">Begin Shopping</a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions Card */}
                  <div className="info-card !bg-slate-900 !rounded-[2.5rem] !p-8 !shadow-2xl !shadow-slate-200 !col-span-2 max-md:!col-span-1">
                    <h3 className="!text-xl !font-black !text-white !mb-8 !flex !items-center !gap-3"><FiStar className="!text-blue-400" /> Operational Hub</h3>
                    <div className="quick-actions !grid !grid-cols-4 !gap-4 max-md:!grid-cols-2">
                      <button onClick={() => setActiveSection('personal')} className="!flex !flex-col !items-center !gap-3 !p-6 !bg-slate-800 !rounded-3xl !transition-all hover:!bg-blue-600 group">
                        <FiEdit3 className="!text-blue-400 group-hover:!text-white" size={20} />
                        <span className="!text-[10px] !font-black !text-white !uppercase !tracking-widest">Update Bio</span>
                      </button>
                      <button onClick={() => setActiveSection('security')} className="!flex !flex-col !items-center !gap-3 !p-6 !bg-slate-800 !rounded-3xl !transition-all hover:!bg-blue-600 group">
                        <FiLock className="!text-blue-400 group-hover:!text-white" size={20} />
                        <span className="!text-[10px] !font-black !text-white !uppercase !tracking-widest">Access Key</span>
                      </button>
                      <a href="/my-orders" className="!flex !flex-col !items-center !gap-3 !p-6 !bg-slate-800 !rounded-3xl !transition-all hover:!bg-blue-600 group">
                        <FiPackage className="!text-blue-400 group-hover:!text-white" size={20} />
                        <span className="!text-[10px] !font-black !text-white !uppercase !tracking-widest">Orders</span>
                      </a>
                      <a href="/products" className="!flex !flex-col !items-center !gap-3 !p-6 !bg-slate-800 !rounded-3xl !transition-all hover:!bg-blue-600 group">
                        <FiHeart className="!text-blue-400 group-hover:!text-white" size={20} />
                        <span className="!text-[10px] !font-black !text-white !uppercase !tracking-widest">Discover</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Personal Info Section */}
            {activeSection === 'personal' && (
              <div className="dashboard-section !animate-in !p-4">
                <div className="section-header !flex !justify-between !items-center !mb-10 max-md:!flex-col max-md:!items-start max-md:!gap-4">
                  <div className="max-md:!w-full">
                    <h2 className="!text-2xl !font-black !text-slate-900 !mb-1 max-md:!text-xl">Biographic Narrative</h2>
                    <p className="!text-sm !text-gray-400">Manage your identity and logistical identifiers</p>
                  </div>
                  {!isEditing && (
                    <button className="!px-6 !py-3 !bg-blue-600 !text-white !rounded-2xl !text-sm !font-black !flex !items-center !gap-2 !shadow-lg !shadow-blue-100 max-md:!w-full max-md:!justify-center" onClick={() => setIsEditing(true)}>
                      <FiEdit3 /> Edit Bio
                    </button>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="profile-form !space-y-10">
                  <div className="form-section !bg-white !rounded-3xl !p-10 !shadow-sm !border !border-gray-50 max-md:!p-6">
                    <h3 className="!text-sm !font-black !text-slate-900 !uppercase !tracking-widest !mb-8 !flex !items-center !gap-3"><FiUser className="!text-blue-600" /> Identity Core</h3>
                    <div className="form-grid !grid !grid-cols-2 !gap-6 max-md:!grid-cols-1">
                      <div className="form-group !flex !flex-col !gap-2">
                        <label className="!text-[10px] !font-bold !text-gray-400 !uppercase">Legal Name</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="!w-full !px-5 !py-4 !bg-slate-50 !border-0 !rounded-2xl !text-sm !font-bold focus:!ring-2 focus:!ring-blue-600 disabled:!opacity-50"
                          disabled={!isEditing}
                          required
                        />
                      </div>

                      <div className="form-group !flex !flex-col !gap-2">
                        <label className="!text-[10px] !font-bold !text-gray-400 !uppercase">Electronic Mail</label>
                        <div className="!relative">
                          <input
                            type="email"
                            value={user?.email}
                            className="!w-full !px-5 !py-4 !bg-slate-50 !border-0 !rounded-2xl !text-sm !font-bold !opacity-50 !cursor-not-allowed"
                            disabled
                          />
                          {(user?.emailVerified || isGoogleUser) && (
                            <span className="!absolute !right-4 !top-1/2 !-translate-y-1/2 !text-[10px] !font-black !text-green-600 !uppercase"><FiCheckCircle className="!inline !mr-1" /> Verified</span>
                          )}
                        </div>
                      </div>

                      <div className="form-group !flex !flex-col !gap-2">
                        <label className="!text-[10px] !font-bold !text-gray-400 !uppercase">Mobile Access</label>
                        <div className="!relative">
                          <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className={`!w-full !px-5 !py-4 !bg-slate-50 !border-0 !rounded-2xl !text-sm !font-bold focus:!ring-2 focus:!ring-blue-600 ${!isEditing ? '!opacity-50' : ''}`}
                            pattern="[0-9]{10}"
                            maxLength={10}
                            disabled={!isEditing}
                            placeholder="Primary contact"
                          />
                          {user?.phoneVerified && (
                            <span className="!absolute !right-4 !top-1/2 !-translate-y-1/2 !text-[10px] !font-black !text-green-600 !uppercase"><FiCheckCircle className="!inline !mr-1" /> Verified</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="form-section !bg-white !rounded-3xl !p-10 !shadow-sm !border !border-gray-50 max-md:!p-6">
                    <h3 className="!text-sm !font-black !text-slate-900 !uppercase !tracking-widest !mb-8 !flex !items-center !gap-3"><FiMapPin className="!text-blue-600" /> Logistical Anchor</h3>
                    <div className="form-grid !grid !grid-cols-1 !gap-6">
                      <div className="form-group !flex !flex-col !gap-2">
                        <label className="!text-[10px] !font-bold !text-gray-400 !uppercase">Street Logistics</label>
                        <input
                          type="text"
                          name="street"
                          value={formData.street}
                          onChange={handleChange}
                          placeholder="Premises details"
                          className="!w-full !px-5 !py-4 !bg-slate-50 !border-0 !rounded-2xl !text-sm !font-bold focus:!ring-2 focus:!ring-blue-600 disabled:!opacity-50"
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="!grid !grid-cols-3 !gap-4 max-md:!grid-cols-1">
                        <div className="form-group !flex !flex-col !gap-2">
                          <label className="!text-[10px] !font-bold !text-gray-400 !uppercase">City</label>
                          <input
                            type="text"
                            name="city"
                            value={formData.city}
                            onChange={handleChange}
                            className="!w-full !px-5 !py-4 !bg-slate-50 !border-0 !rounded-2xl !text-sm !font-bold focus:!ring-2 focus:!ring-blue-600 disabled:!opacity-50"
                            disabled={!isEditing}
                          />
                        </div>

                        <div className="form-group !flex !flex-col !gap-2">
                          <label className="!text-[10px] !font-bold !text-gray-400 !uppercase">Province</label>
                          <input
                            type="text"
                            name="state"
                            value={formData.state}
                            onChange={handleChange}
                            className="!w-full !px-5 !py-4 !bg-slate-50 !border-0 !rounded-2xl !text-sm !font-bold focus:!ring-2 focus:!ring-blue-600 disabled:!opacity-50"
                            disabled={!isEditing}
                          />
                        </div>

                        <div className="form-group !flex !flex-col !gap-2">
                          <label className="!text-[10px] !font-bold !text-gray-400 !uppercase">Postal Code</label>
                          <input
                            type="text"
                            name="pincode"
                            value={formData.pincode}
                            onChange={handleChange}
                            pattern="[0-9]{6}"
                            maxLength={6}
                            className="!w-full !px-5 !py-4 !bg-slate-50 !border-0 !rounded-2xl !text-sm !font-bold focus:!ring-2 focus:!ring-blue-600 disabled:!opacity-50"
                            disabled={!isEditing}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="form-actions !flex !items-center !gap-4 max-md:!flex-col">
                      <button
                        type="button"
                        className="!flex-1 !py-4 !bg-slate-100 !text-slate-600 !rounded-2xl !text-sm !font-black hover:!bg-slate-200 max-md:!w-full"
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
                        Abort Changes
                      </button>
                      <button
                        type="submit"
                        className={`!flex-[2] !py-4 !bg-blue-600 !text-white !rounded-2xl !text-sm !font-black !shadow-xl !shadow-blue-100 hover:!bg-blue-700 max-md:!w-full ${saveSuccess ? '!bg-green-600' : ''}`}
                        disabled={loading}
                      >
                        {loading ? 'Processing...' : saveSuccess ? 'Bio Synced!' : 'Finalize Profile Update'}
                      </button>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* Security Section */}
            {activeSection === 'security' && (
              <div className="dashboard-section !animate-in !p-4">
                <div className="section-header !mb-10 max-md:!flex-col max-md:!items-start max-md:!gap-4">
                  <div className="max-md:!w-full">
                    <h2 className="!text-2xl !font-black !text-slate-900 !mb-1 max-md:!text-xl">Authentication Vault</h2>
                    <p className="!text-sm !text-gray-400">Secure your account with multi-factor protocols</p>
                  </div>
                </div>

                {/* Verification Center */}
                <div className="security-card !bg-white !rounded-3xl !p-10 !shadow-sm !border !border-gray-50 !mb-10 max-md:!p-6">
                  <h3 className="!text-sm !font-black !text-slate-900 !uppercase !tracking-widest !mb-8 !flex !items-center !gap-3"><FiShield className="!text-blue-600" /> Verification Protocol</h3>

                  <div className="verification-grid !grid !grid-cols-2 !gap-6 max-md:!grid-cols-1">
                    {/* Email Verification */}
                    <div className={`!p-6 !rounded-3xl !border-2 !transition-all ${user?.emailVerified || isGoogleUser ? '!border-green-50 !bg-green-50/30' : '!border-slate-50 !bg-slate-50/30'}`}>
                      <div className="!flex !items-center !gap-4 !mb-6">
                        <div className={`!w-12 !h-12 !rounded-2xl !flex !items-center !justify-center !text-xl ${user?.emailVerified || isGoogleUser ? '!bg-green-600 !text-white' : '!bg-slate-200 !text-slate-500'}`}>
                          <FiMail />
                        </div>
                        <div className="!min-w-0">
                          <h4 className="!text-sm !font-black !text-slate-900 !truncate">{user?.email}</h4>
                          <span className={`!text-[10px] !font-black !uppercase !tracking-widest ${user?.emailVerified || isGoogleUser ? '!text-green-600' : '!text-amber-600'}`}>
                            {user?.emailVerified || isGoogleUser ? 'Active Protocol' : 'Requires Action'}
                          </span>
                        </div>
                      </div>
                      {!user?.emailVerified && !isGoogleUser && (
                        <button
                          className="!w-full !py-3 !bg-blue-600 !text-white !rounded-xl !text-xs !font-black !shadow-lg !shadow-blue-100 hover:!bg-blue-700"
                          onClick={handleSendVerificationEmail}
                          disabled={emailVerifying}
                        >
                          {emailVerifying ? 'Relaying link...' : 'Dispatch Verification Link'}
                        </button>
                      )}
                    </div>

                    {/* Phone Verification */}
                    <div className={`!p-6 !rounded-3xl !border-2 !transition-all ${user?.phoneVerified ? '!border-green-50 !bg-green-50/30' : '!border-slate-50 !bg-slate-50/30'}`}>
                      <div className="!flex !items-center !gap-4 !mb-6">
                        <div className={`!w-12 !h-12 !rounded-2xl !flex !items-center !justify-center !text-xl ${user?.phoneVerified ? '!bg-green-600 !text-white' : '!bg-slate-200 !text-slate-500'}`}>
                          <FiPhone />
                        </div>
                        <div className="!min-w-0">
                          <h4 className="!text-sm !font-black !text-slate-900 !truncate">{user?.phone || 'Not Registered'}</h4>
                          <span className={`!text-[10px] !font-black !uppercase !tracking-widest ${user?.phoneVerified ? '!text-green-600' : '!text-amber-600'}`}>
                            {user?.phoneVerified ? 'Secure Access' : 'Unverified Access'}
                          </span>
                        </div>
                      </div>
                      {!user?.phoneVerified && user?.phone && (
                        <>
                          {!showOtpInput ? (
                            <button
                              className="!w-full !py-3 !bg-blue-600 !text-white !rounded-xl !text-xs !font-black !shadow-lg !shadow-blue-100 hover:!bg-blue-700"
                              onClick={handleSendPhoneOtp}
                              disabled={phoneOtpSending || otpCooldown > 0}
                            >
                              {phoneOtpSending ? 'Disseminating OTP...' : otpCooldown > 0 ? `Retry in ${otpCooldown}s` : 'Request SMS Token'}
                            </button>
                          ) : (
                            <div className="!space-y-3">
                              <input
                                type="text"
                                value={otpValue}
                                onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="******"
                                className="!w-full !px-4 !py-3 !bg-white !border !border-gray-100 !rounded-xl !text-center !text-lg !font-black focus:!ring-2 focus:!ring-blue-600"
                                maxLength={6}
                              />
                              <div className="!grid !grid-cols-2 !gap-2">
                                <button
                                  className="!py-3 !bg-blue-600 !text-white !rounded-xl !text-[10px] !font-black !uppercase !tracking-widest"
                                  onClick={handleVerifyPhoneOtp}
                                  disabled={phoneOtpVerifying || otpValue.length !== 6}
                                >
                                  {phoneOtpVerifying ? 'Verifying...' : 'Validate'}
                                </button>
                                <button
                                  className="!py-3 !bg-slate-100 !text-slate-500 !rounded-xl !text-[10px] !font-black !uppercase !tracking-widest"
                                  onClick={handleSendPhoneOtp}
                                  disabled={phoneOtpSending || otpCooldown > 0}
                                >
                                  Resend
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Password Change */}
                {!isGoogleUser && (
                  <div className="security-card !bg-white !rounded-3xl !p-10 !shadow-sm !border !border-gray-50 !mb-10 max-md:!p-6">
                    <h3 className="!text-sm !font-black !text-slate-900 !uppercase !tracking-widest !mb-8 !flex !items-center !gap-3"><FiLock className="!text-blue-600" /> Key Rotation</h3>
                    {!showPasswordSection ? (
                      <button
                        className="!px-8 !py-4 !bg-slate-900 !text-white !rounded-2xl !text-xs !font-black !uppercase !tracking-widest !shadow-xl !shadow-slate-100"
                        onClick={() => setShowPasswordSection(true)}
                      >
                        Rotate Security Key
                      </button>
                    ) : (
                      <form onSubmit={handlePasswordChange} className="!max-w-md !space-y-6">
                        <div className="form-group !flex !flex-col !gap-2">
                          <label className="!text-[10px] !font-bold !text-gray-400 !uppercase">Current Key</label>
                          <div className="!relative">
                            <input
                              type={showPasswords.current ? 'text' : 'password'}
                              value={passwordData.currentPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                              className="!w-full !px-5 !py-4 !bg-slate-50 !border-0 !rounded-2xl !text-sm !font-bold focus:!ring-2 focus:!ring-blue-600"
                              required
                            />
                            <button type="button" className="!absolute !right-4 !top-1/2 !-translate-y-1/2 !text-gray-400" onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}>
                              {showPasswords.current ? <FiEyeOff /> : <FiEye />}
                            </button>
                          </div>
                        </div>

                        <div className="form-group !flex !flex-col !gap-2">
                          <label className="!text-[10px] !font-bold !text-gray-400 !uppercase">New Secret Key</label>
                          <div className="!relative">
                            <input
                              type={showPasswords.new ? 'text' : 'password'}
                              value={passwordData.newPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                              className="!w-full !px-5 !py-4 !bg-slate-50 !border-0 !rounded-2xl !text-sm !font-bold focus:!ring-2 focus:!ring-blue-600"
                              minLength={8}
                              required
                            />
                            <button type="button" className="!absolute !right-4 !top-1/2 !-translate-y-1/2 !text-gray-400" onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}>
                              {showPasswords.new ? <FiEyeOff /> : <FiEye />}
                            </button>
                          </div>
                        </div>

                        <div className="form-group !flex !flex-col !gap-2">
                          <label className="!text-[10px] !font-bold !text-gray-400 !uppercase">Confirm Key</label>
                          <div className="!relative">
                            <input
                              type={showPasswords.confirm ? 'text' : 'password'}
                              value={passwordData.confirmPassword}
                              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                              className="!w-full !px-5 !py-4 !bg-slate-50 !border-0 !rounded-2xl !text-sm !font-bold focus:!ring-2 focus:!ring-blue-600"
                              required
                            />
                            <button type="button" className="!absolute !right-4 !top-1/2 !-translate-y-1/2 !text-gray-400" onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}>
                              {showPasswords.confirm ? <FiEyeOff /> : <FiEye />}
                            </button>
                          </div>
                        </div>

                        <div className="!flex !gap-3 max-md:!flex-col">
                          <button type="button" className="!flex-1 !py-4 !bg-slate-100 !text-slate-600 !rounded-2xl !text-xs !font-black !uppercase" onClick={() => setShowPasswordSection(false)}>Cancel</button>
                          <button type="submit" className="!flex-[2] !py-4 !bg-blue-600 !text-white !rounded-2xl !text-xs !font-black !uppercase !shadow-xl !shadow-blue-100" disabled={passwordLoading}>
                            {passwordLoading ? 'Encrypting...' : 'Seal New Key'}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                )}

                {/* Account Actions */}
                <div className="security-card !bg-red-50 !rounded-[2.5rem] !p-8 !border !border-red-100">
                  <h3 className="!text-sm !font-black !text-red-900 !uppercase !tracking-widest !mb-4 !flex !items-center !gap-3"><FiLogOut /> Session Termination</h3>
                  <button className="!px-8 !py-4 !bg-red-600 !text-white !rounded-2xl !text-xs !font-black !uppercase !tracking-widest !shadow-xl !shadow-red-100" onClick={logout}>
                    Terminate Session
                  </button>
                </div>
              </div>
            )}

            {/* Order Summary Section */}
            {activeSection === 'orders' && (
              <div className="dashboard-section !animate-in !p-4">
                <div className="section-header !flex !justify-between !items-center !mb-10 max-md:!flex-col max-md:!items-start max-md:!gap-4">
                  <div className="max-md:!w-full">
                    <h2 className="!text-2xl !font-black !text-slate-900 !mb-1 max-md:!text-xl">Spending Analytics</h2>
                    <p className="!text-sm !text-gray-400">Deep-dive into your acquisition patterns</p>
                  </div>
                  <a href="/my-orders" className="!px-6 !py-3 !bg-slate-900 !text-white !rounded-2xl !text-sm !font-black !flex !items-center !gap-2 !shadow-xl !shadow-slate-100 max-md:!w-full max-md:!justify-center">
                    Full Ledger <FiChevronRight />
                  </a>
                </div>

                <div className="order-stats-grid !grid !grid-cols-4 !gap-6 !mb-12 max-md:!grid-cols-2 max-sm:!grid-cols-1">
                  <div className="order-stat-card !bg-white !p-8 !rounded-3xl !shadow-sm !border !border-gray-50">
                    <div className="order-stat-icon !w-12 !h-12 !bg-blue-50 !text-blue-600 !rounded-2xl !flex !items-center !justify-center !text-xl !mb-6">
                      <FiPackage />
                    </div>
                    <div className="order-stat-info">
                      <span className="order-stat-value !text-3xl !font-black !text-slate-900 !block">{orderStats.total}</span>
                      <span className="order-stat-label !text-[10px] !font-bold !text-gray-400 !uppercase !tracking-widest">Dispatches</span>
                    </div>
                  </div>

                  <div className="order-stat-card !bg-white !p-8 !rounded-3xl !shadow-sm !border !border-gray-50">
                    <div className="order-stat-icon !w-12 !h-12 !bg-green-50 !text-green-600 !rounded-2xl !flex !items-center !justify-center !text-xl !mb-6">
                      <FiCheckCircle />
                    </div>
                    <div className="order-stat-info">
                      <span className="order-stat-value !text-3xl !font-black !text-slate-900 !block">{orderStats.completed}</span>
                      <span className="order-stat-label !text-[10px] !font-bold !text-gray-400 !uppercase !tracking-widest">Delivered</span>
                    </div>
                  </div>

                  <div className="order-stat-card !bg-white !p-8 !rounded-3xl !shadow-sm !border !border-gray-50">
                    <div className="order-stat-icon !w-12 !h-12 !bg-amber-50 !text-amber-600 !rounded-2xl !flex !items-center !justify-center !text-xl !mb-6">
                      <FiClock />
                    </div>
                    <div className="order-stat-info">
                      <span className="order-stat-value !text-3xl !font-black !text-slate-900 !block">{orderStats.pending}</span>
                      <span className="order-stat-label !text-[10px] !font-bold !text-gray-400 !uppercase !tracking-widest">Processing</span>
                    </div>
                  </div>

                  <div className="order-stat-card highlight !bg-blue-600 !p-8 !rounded-3xl !shadow-xl !shadow-blue-100">
                    <div className="order-stat-icon !w-12 !h-12 !bg-white/20 !text-white !rounded-2xl !flex !items-center !justify-center !text-xl !mb-6">
                      <FiCreditCard />
                    </div>
                    <div className="order-stat-info">
                      <span className="order-stat-value !text-3xl !font-black !text-white !block">₹{orderStats.totalSpent.toLocaleString()}</span>
                      <span className="order-stat-label !text-[10px] !font-bold !text-white/60 !uppercase !tracking-widest">Gross Volume</span>
                    </div>
                  </div>
                </div>

                {/* Recent Order */}
                {orderStats.lastOrder && (
                  <div className="recent-order-card !bg-slate-900 !rounded-[2.5rem] !p-10 !shadow-2xl !shadow-slate-100 max-md:!p-6">
                    <div className="recent-order-header !flex !justify-between !items-center !mb-10">
                      <h3 className="!text-xl !font-black !text-white">Active Milestone</h3>
                      <span className={`!px-4 !py-1 !rounded-full !text-[10px] !font-black !uppercase !tracking-widest ${orderStats.lastOrder.orderStatus === 'delivered' ? '!bg-green-500 !text-white' : '!bg-blue-500 !text-white'}`}>
                        {orderStats.lastOrder.orderStatus}
                      </span>
                    </div>
                    <div className="recent-order-body !grid !grid-cols-2 !gap-8 !mb-10 max-md:!grid-cols-1 max-md:!gap-4">
                      <div className="recent-order-detail">
                        <span className="detail-label !text-[10px] !font-bold !text-slate-500 !uppercase !block !mb-1">Order Ref</span>
                        <span className="detail-value !text-lg !font-black !text-white">#{orderStats.lastOrder.orderNumber}</span>
                      </div>
                      <div className="recent-order-detail">
                        <span className="detail-label !text-[10px] !font-bold !text-slate-500 !uppercase !block !mb-1">Dispatched On</span>
                        <span className="detail-value !text-lg !font-black !text-white">{formatDate(orderStats.lastOrder.createdAt)}</span>
                      </div>
                      <div className="recent-order-detail">
                        <span className="detail-label !text-[10px] !font-bold !text-slate-500 !uppercase !block !mb-1">Entity Count</span>
                        <span className="detail-value !text-lg !font-black !text-white">{orderStats.lastOrder.items?.length || 0} Products</span>
                      </div>
                      <div className="recent-order-detail">
                        <span className="detail-label !text-[10px] !font-bold !text-slate-500 !uppercase !block !mb-1">Capital Value</span>
                        <span className="detail-value highlight !text-2xl !font-black !text-blue-400">₹{orderStats.lastOrder.totalAmount.toLocaleString()}</span>
                      </div>
                    </div>
                    <a href={`/orders/${orderStats.lastOrder._id}`} className="!w-full !flex !items-center !justify-center !py-5 !bg-white !text-slate-900 !rounded-2xl !font-black !text-sm !shadow-lg">
                      Explore Technical Metadata
                    </a>
                  </div>
                )}

                {orderStats.total === 0 && (
                  <div className="empty-orders !text-center !py-20 !bg-slate-50 !rounded-[3rem] !border !border-dashed !border-slate-200">
                    <div className="empty-icon !w-20 !h-20 !bg-white !rounded-full !flex !items-center !justify-center !text-3xl !text-slate-300 !mx-auto !mb-6">
                      <FiPackage />
                    </div>
                    <h3 className="!text-xl !font-black !text-slate-900 !mb-2">No Historical Data</h3>
                    <p className="!text-sm !text-slate-400 !mb-10">Your operational history is currently unpopulated</p>
                    <a href="/products" className="!px-10 !py-4 !bg-blue-600 !text-white !rounded-2xl !font-black !text-sm !shadow-xl !shadow-blue-100">
                      Initiate Transaction
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Preferences Section */}
            {activeSection === 'preferences' && (
              <div className="dashboard-section !animate-in !p-4">
                <div className="section-header !mb-10 max-md:!flex-col max-md:!items-start max-md:!gap-4">
                  <div className="max-md:!w-full">
                    <h2 className="!text-2xl !font-black !text-slate-900 !mb-1 max-md:!text-xl">Configuration Nexus</h2>
                    <p className="!text-sm !text-gray-400">Tailor your interface and communication stack</p>
                  </div>
                </div>

                <div className="preferences-card !bg-white !rounded-3xl !p-10 !shadow-sm !border !border-gray-50 !mb-10 max-md:!p-6">
                  <h3 className="!text-sm !font-black !text-slate-900 !uppercase !tracking-widest !mb-8 !flex !items-center !gap-3"><FiBell className="!text-blue-600" /> Dispatch Notifications</h3>

                  <div className="preference-list !space-y-6">
                    <div className="preference-item !flex !justify-between !items-center !p-6 !bg-slate-50 !rounded-2xl">
                      <div className="preference-info !min-w-0">
                        <h4 className="!text-sm !font-black !text-slate-900 !mb-1">Operational Pulse</h4>
                        <p className="!text-[10px] !text-gray-400 !font-bold !uppercase">Real-time order status updates</p>
                      </div>
                      <label className="!relative !inline-block !w-12 !h-6">
                        <input
                          type="checkbox"
                          className="!sr-only peer"
                          checked={notifications.orderUpdates}
                          onChange={(e) => setNotifications({ ...notifications, orderUpdates: e.target.checked })}
                        />
                        <span className="!absolute !inset-0 !bg-slate-200 !rounded-full peer-checked:!bg-blue-600 !transition-all before:!content-[''] before:!absolute before:!left-1 before:!top-1 before:!bg-white before:!w-4 before:!h-4 before:!rounded-full peer-checked:before:!translate-x-6 before:!transition-all"></span>
                      </label>
                    </div>

                    <div className="preference-item !flex !justify-between !items-center !p-6 !bg-slate-50 !rounded-2xl">
                      <div className="preference-info">
                        <h4 className="!text-sm !font-black !text-slate-900 !mb-1">Incentive Streams</h4>
                        <p className="!text-[10px] !text-gray-400 !font-bold !uppercase">Proprietary deals and fiscal rewards</p>
                      </div>
                      <label className="!relative !inline-block !w-12 !h-6">
                        <input
                          type="checkbox"
                          className="!sr-only peer"
                          checked={notifications.promotions}
                          onChange={(e) => setNotifications({ ...notifications, promotions: e.target.checked })}
                        />
                        <span className="!absolute !inset-0 !bg-slate-200 !rounded-full peer-checked:!bg-blue-600 !transition-all before:!content-[''] before:!absolute before:!left-1 before:!top-1 before:!bg-white before:!w-4 before:!h-4 before:!rounded-full peer-checked:before:!translate-x-6 before:!transition-all"></span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="preferences-card !bg-slate-900 !rounded-[2.5rem] !p-10 !shadow-2xl !shadow-slate-200 max-md:!p-6">
                  <h3 className="!text-sm !font-black !text-white !uppercase !tracking-widest !mb-8 !flex !items-center !gap-3"><FiGift className="!text-blue-400" /> Patronage Tier</h3>

                  <div className="loyalty-status !space-y-8">
                    <div className="loyalty-tier !flex !items-center !gap-6">
                      <div className="tier-icon !w-16 !h-16 !bg-blue-600 !text-white !rounded-2xl !flex !items-center !justify-center !text-3xl !shadow-xl !shadow-blue-500/20">
                        {orderStats.totalSpent >= 100000 ? <FiAward /> : orderStats.totalSpent >= 50000 ? <FiStar /> : <FiHeart />}
                      </div>
                      <div className="tier-info">
                        <span className="tier-name !text-2xl !font-black !text-white !block !mb-1">
                          {orderStats.totalSpent >= 100000 ? 'Apex Patron' : orderStats.totalSpent >= 50000 ? 'Prime Affiliate' : 'Active Member'}
                        </span>
                        <span className="tier-desc !text-[10px] !font-bold !text-slate-500 !uppercase !tracking-widest">
                          {orderStats.totalSpent >= 100000
                            ? 'Maximized privileges active'
                            : orderStats.totalSpent >= 50000
                              ? `Relay ₹${(100000 - orderStats.totalSpent).toLocaleString()} for Apex status`
                              : `Relay ₹${(50000 - orderStats.totalSpent).toLocaleString()} for Prime status`
                          }
                        </span>
                      </div>
                    </div>
                    <div className="tier-progress !h-3 !bg-slate-800 !rounded-full !overflow-hidden">
                      <div
                        className="!h-full !bg-blue-600 !transition-all !duration-1000"
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
