import { useState, useEffect, useRef } from 'react';
import { FiUser, FiMail, FiPhone, FiMapPin, FiSave, FiCamera, FiUpload, FiCheckCircle, FiAlertCircle, FiSend, FiShield } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import uploadService from '../../services/uploadService';
import toast from 'react-hot-toast';
import './Profile.css';

const Profile = () => {
  const { user, updateUser, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);
  const [phoneOtpSending, setPhoneOtpSending] = useState(false);
  const [phoneOtpVerifying, setPhoneOtpVerifying] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpCooldown, setOtpCooldown] = useState(0);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: ''
  });

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

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setImageLoading(true);
    try {
      // Upload image
      const uploadResponse = await uploadService.uploadImage(file);
      
      // Update profile with new image
      const response = await authService.updateProfile({
        profileImage: uploadResponse.url
      });

      updateUser(response.user);
      toast.success('Profile picture updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setImageLoading(false);
      // Reset file input
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
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="page-header">
        <div className="container">
          <h1>My Profile</h1>
          <p>Manage your account information</p>
        </div>
      </div>

      <div className="container">
        <div className="profile-layout">
          {/* Profile Card */}
          <div className="profile-card">
            <div className="profile-avatar-wrapper">
              <div 
                className={`profile-avatar ${imageLoading ? 'loading' : ''}`}
                onClick={handleImageClick}
              >
                {user?.profileImage ? (
                  <img 
                    src={user.profileImage} 
                    alt={user.name} 
                    className="avatar-image"
                  />
                ) : (
                  <FiUser size={40} />
                )}
                <div className="avatar-overlay">
                  {imageLoading ? (
                    <div className="avatar-spinner"></div>
                  ) : (
                    <FiCamera size={20} />
                  )}
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden-input"
              />
              <button 
                type="button" 
                className="change-photo-btn"
                onClick={handleImageClick}
                disabled={imageLoading}
              >
                <FiUpload size={14} />
                {imageLoading ? 'Uploading...' : 'Change Photo'}
              </button>
            </div>
            <h2>{user?.name}</h2>
            <p>{user?.email}</p>
            <div className="profile-info">
              <div className="info-item">
                <FiPhone />
                <span>{user?.phone || 'Not provided'}</span>
              </div>
              <div className="info-item">
                <FiMail />
                <span>{user?.email}</span>
              </div>
            </div>

            {/* Verification Status Section */}
            <div className="verification-status-section">
              <h4><FiShield /> Verification Status</h4>
              
              {/* Email Verification */}
              <div className={`verification-item ${user?.emailVerified ? 'verified' : 'unverified'}`}>
                <div className="verification-info">
                  <FiMail />
                  <span>Email</span>
                  {user?.emailVerified ? (
                    <span className="status-badge verified">
                      <FiCheckCircle /> Verified
                    </span>
                  ) : (
                    <span className="status-badge unverified">
                      <FiAlertCircle /> Not Verified
                    </span>
                  )}
                </div>
                {!user?.emailVerified && (
                  <button
                    type="button"
                    className="verify-btn"
                    onClick={handleSendVerificationEmail}
                    disabled={emailVerifying}
                  >
                    <FiSend />
                    {emailVerifying ? 'Sending...' : 'Send Verification'}
                  </button>
                )}
              </div>

              {/* Phone Verification */}
              <div className={`verification-item ${user?.phoneVerified ? 'verified' : 'unverified'}`}>
                <div className="verification-info">
                  <FiPhone />
                  <span>Phone</span>
                  {user?.phoneVerified ? (
                    <span className="status-badge verified">
                      <FiCheckCircle /> Verified
                    </span>
                  ) : (
                    <span className="status-badge unverified">
                      <FiAlertCircle /> Not Verified
                    </span>
                  )}
                </div>
                {!user?.phoneVerified && user?.phone && (
                  <>
                    {!showOtpInput ? (
                      <button
                        type="button"
                        className="verify-btn"
                        onClick={handleSendPhoneOtp}
                        disabled={phoneOtpSending || otpCooldown > 0}
                      >
                        <FiSend />
                        {phoneOtpSending ? 'Sending...' : otpCooldown > 0 ? `Resend in ${otpCooldown}s` : 'Send OTP'}
                      </button>
                    ) : (
                      <div className="otp-input-section">
                        <input
                          type="text"
                          value={otpValue}
                          onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="Enter 6-digit OTP"
                          className="otp-input"
                          maxLength={6}
                        />
                        <button
                          type="button"
                          className="verify-btn"
                          onClick={handleVerifyPhoneOtp}
                          disabled={phoneOtpVerifying || otpValue.length !== 6}
                        >
                          {phoneOtpVerifying ? 'Verifying...' : 'Verify'}
                        </button>
                        <button
                          type="button"
                          className="resend-btn"
                          onClick={handleSendPhoneOtp}
                          disabled={phoneOtpSending || otpCooldown > 0}
                        >
                          {otpCooldown > 0 ? `${otpCooldown}s` : 'Resend'}
                        </button>
                      </div>
                    )}
                  </>
                )}
                {!user?.phone && (
                  <span className="hint-text">Add phone number first</span>
                )}
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="profile-form-card">
            <h3>Edit Profile</h3>
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="form-input"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  value={user?.email}
                  className="form-input"
                  disabled
                />
                <span className="form-hint">Email cannot be changed</span>
              </div>

              <h4 className="section-title">
                <FiMapPin /> Default Address
              </h4>

              <div className="form-group">
                <label className="form-label">Street Address</label>
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleChange}
                  placeholder="Enter your street address"
                  className="form-input"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Enter city"
                    className="form-input"
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
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-lg save-btn"
                disabled={loading}
              >
                <FiSave /> {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
