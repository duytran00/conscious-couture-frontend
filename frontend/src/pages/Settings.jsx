import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Settings.css";

// MUI Icons
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SecurityIcon from '@mui/icons-material/Security';
import PaymentIcon from '@mui/icons-material/Payment';
import HelpIcon from '@mui/icons-material/Help';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

function Settings() {
  const navigate = useNavigate();
  const { user, isAuthenticated, updateUser, logout } = useAuth();
  const [activeSection, setActiveSection] = useState("profile");
  const [saveStatus, setSaveStatus] = useState(null);

  // Profile state
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: ''
  });

  // Address state
  const [addresses, setAddresses] = useState([
    {
      id: 1,
      label: 'Home',
      name: 'Sarah Mitchell',
      street: '123 Sustainable Way',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
      isDefault: true
    }
  ]);
  const [editingAddress, setEditingAddress] = useState(null);

  // Notifications state
  const [notifications, setNotifications] = useState({
    emailOrders: true,
    emailSwaps: true,
    emailNewsletter: false,
    pushOrders: true,
    pushSwaps: true,
    pushMessages: true
  });

  // Security state
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  // Initialize profile data
  useEffect(() => {
    if (user) {
      const nameParts = (user.name || '').split(' ');
      setProfileData({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: user.email || '',
        phone: '',
        bio: ''
      });
    }
  }, [user]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleProfileChange = (field) => (e) => {
    setProfileData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleSaveProfile = () => {
    const fullName = `${profileData.firstName} ${profileData.lastName}`.trim();
    updateUser({ name: fullName, email: profileData.email });
    setSaveStatus('Profile updated successfully!');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleNotificationChange = (key) => (e) => {
    setNotifications(prev => ({
      ...prev,
      [key]: e.target.checked
    }));
  };

  const handlePasswordChange = (field) => (e) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleChangePassword = () => {
    if (passwordData.new !== passwordData.confirm) {
      alert("New passwords don't match");
      return;
    }
    if (passwordData.new.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }
    setSaveStatus('Password changed successfully!');
    setPasswordData({ current: '', new: '', confirm: '' });
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleDeleteAddress = (id) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      setAddresses(prev => prev.filter(addr => addr.id !== id));
    }
  };

  const handleSetDefaultAddress = (id) => {
    setAddresses(prev => prev.map(addr => ({
      ...addr,
      isDefault: addr.id === id
    })));
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const sections = [
    { id: 'profile', label: 'Profile', icon: PersonIcon },
    { id: 'addresses', label: 'Addresses', icon: LocationOnIcon },
    { id: 'notifications', label: 'Notifications', icon: NotificationsIcon },
    { id: 'security', label: 'Security', icon: SecurityIcon },
    { id: 'payment', label: 'Payment', icon: PaymentIcon },
    { id: 'help', label: 'Help', icon: HelpIcon }
  ];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="settings-page">
      <div className="settings-container">
        {/* Header */}
        <div className="settings-header">
          <Link to="/dashboard" className="back-link">
            <ArrowBackIcon />
            Back to Dashboard
          </Link>
          <h1 className="settings-title">Settings</h1>
          <p className="settings-subtitle">Manage your account preferences</p>
        </div>

        {/* Success message */}
        {saveStatus && (
          <div className="save-notification">
            <CheckCircleIcon />
            {saveStatus}
          </div>
        )}

        <div className="settings-layout">
          {/* Sidebar Navigation */}
          <nav className="settings-nav">
            {sections.map(section => (
              <button
                key={section.id}
                className={`settings-nav-item ${activeSection === section.id ? 'active' : ''}`}
                onClick={() => setActiveSection(section.id)}
              >
                <section.icon className="settings-nav-icon" />
                {section.label}
              </button>
            ))}
          </nav>

          {/* Content Area */}
          <div className="settings-content">
            {/* Profile Section */}
            {activeSection === 'profile' && (
              <div className="settings-section">
                <h2 className="section-title">Profile Information</h2>
                <p className="section-description">Update your personal details and public profile.</p>

                <div className="profile-avatar-section">
                  <div className="profile-avatar-large">
                    {profileData.firstName?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="avatar-actions">
                    <button className="avatar-btn">Change Photo</button>
                    <p className="avatar-hint">JPG, PNG or GIF. Max 2MB.</p>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-field">
                    <label className="form-label">First Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={profileData.firstName}
                      onChange={handleProfileChange('firstName')}
                      placeholder="Enter your first name"
                    />
                  </div>

                  <div className="form-field">
                    <label className="form-label">Last Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={profileData.lastName}
                      onChange={handleProfileChange('lastName')}
                      placeholder="Enter your last name"
                    />
                  </div>

                  <div className="form-field full-width">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      value={profileData.email}
                      onChange={handleProfileChange('email')}
                      placeholder="you@example.com"
                    />
                  </div>

                  <div className="form-field full-width">
                    <label className="form-label">Phone Number <span className="optional">(Optional)</span></label>
                    <input
                      type="tel"
                      className="form-input"
                      value={profileData.phone}
                      onChange={handleProfileChange('phone')}
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div className="form-field full-width">
                    <label className="form-label">Bio <span className="optional">(Optional)</span></label>
                    <textarea
                      className="form-textarea"
                      value={profileData.bio}
                      onChange={handleProfileChange('bio')}
                      placeholder="Tell others about yourself and your sustainable fashion journey..."
                      rows={4}
                    />
                  </div>
                </div>

                <div className="section-actions">
                  <button className="primary-btn" onClick={handleSaveProfile}>
                    <SaveIcon /> Save Changes
                  </button>
                </div>
              </div>
            )}

            {/* Addresses Section */}
            {activeSection === 'addresses' && (
              <div className="settings-section">
                <div className="section-header-row">
                  <div>
                    <h2 className="section-title">Shipping Addresses</h2>
                    <p className="section-description">Manage your shipping and billing addresses.</p>
                  </div>
                  <button className="secondary-btn">
                    <AddIcon /> Add Address
                  </button>
                </div>

                <div className="addresses-list">
                  {addresses.map(address => (
                    <div key={address.id} className={`address-card ${address.isDefault ? 'default' : ''}`}>
                      <div className="address-header">
                        <span className="address-label">{address.label}</span>
                        {address.isDefault && (
                          <span className="default-badge">Default</span>
                        )}
                      </div>
                      <div className="address-content">
                        <p className="address-name">{address.name}</p>
                        <p className="address-line">{address.street}</p>
                        <p className="address-line">{address.city}, {address.state} {address.zip}</p>
                      </div>
                      <div className="address-actions">
                        {!address.isDefault && (
                          <button
                            className="address-action-btn"
                            onClick={() => handleSetDefaultAddress(address.id)}
                          >
                            Set as Default
                          </button>
                        )}
                        <button className="address-action-btn">
                          <EditIcon fontSize="small" /> Edit
                        </button>
                        <button
                          className="address-action-btn delete"
                          onClick={() => handleDeleteAddress(address.id)}
                        >
                          <DeleteIcon fontSize="small" /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {addresses.length === 0 && (
                  <div className="empty-section">
                    <LocationOnIcon className="empty-icon" />
                    <h3>No addresses saved</h3>
                    <p>Add an address to make checkout faster.</p>
                    <button className="primary-btn">
                      <AddIcon /> Add Your First Address
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Notifications Section */}
            {activeSection === 'notifications' && (
              <div className="settings-section">
                <h2 className="section-title">Notification Preferences</h2>
                <p className="section-description">Choose how you want to be notified about activity.</p>

                <div className="notification-group">
                  <h3 className="notification-group-title">Email Notifications</h3>

                  <label className="notification-toggle">
                    <div className="toggle-info">
                      <span className="toggle-label">Order Updates</span>
                      <span className="toggle-description">Get notified about order status changes</span>
                    </div>
                    <input
                      type="checkbox"
                      className="toggle-checkbox"
                      checked={notifications.emailOrders}
                      onChange={handleNotificationChange('emailOrders')}
                    />
                    <span className="toggle-switch"></span>
                  </label>

                  <label className="notification-toggle">
                    <div className="toggle-info">
                      <span className="toggle-label">Swap Requests</span>
                      <span className="toggle-description">Get notified when someone wants to swap</span>
                    </div>
                    <input
                      type="checkbox"
                      className="toggle-checkbox"
                      checked={notifications.emailSwaps}
                      onChange={handleNotificationChange('emailSwaps')}
                    />
                    <span className="toggle-switch"></span>
                  </label>

                  <label className="notification-toggle">
                    <div className="toggle-info">
                      <span className="toggle-label">Newsletter</span>
                      <span className="toggle-description">Sustainable fashion tips and promotions</span>
                    </div>
                    <input
                      type="checkbox"
                      className="toggle-checkbox"
                      checked={notifications.emailNewsletter}
                      onChange={handleNotificationChange('emailNewsletter')}
                    />
                    <span className="toggle-switch"></span>
                  </label>
                </div>

                <div className="notification-group">
                  <h3 className="notification-group-title">Push Notifications</h3>

                  <label className="notification-toggle">
                    <div className="toggle-info">
                      <span className="toggle-label">Order Updates</span>
                      <span className="toggle-description">Real-time order tracking updates</span>
                    </div>
                    <input
                      type="checkbox"
                      className="toggle-checkbox"
                      checked={notifications.pushOrders}
                      onChange={handleNotificationChange('pushOrders')}
                    />
                    <span className="toggle-switch"></span>
                  </label>

                  <label className="notification-toggle">
                    <div className="toggle-info">
                      <span className="toggle-label">Swap Activity</span>
                      <span className="toggle-description">Updates on your swap requests</span>
                    </div>
                    <input
                      type="checkbox"
                      className="toggle-checkbox"
                      checked={notifications.pushSwaps}
                      onChange={handleNotificationChange('pushSwaps')}
                    />
                    <span className="toggle-switch"></span>
                  </label>

                  <label className="notification-toggle">
                    <div className="toggle-info">
                      <span className="toggle-label">Messages</span>
                      <span className="toggle-description">New messages from other users</span>
                    </div>
                    <input
                      type="checkbox"
                      className="toggle-checkbox"
                      checked={notifications.pushMessages}
                      onChange={handleNotificationChange('pushMessages')}
                    />
                    <span className="toggle-switch"></span>
                  </label>
                </div>
              </div>
            )}

            {/* Security Section */}
            {activeSection === 'security' && (
              <div className="settings-section">
                <h2 className="section-title">Security Settings</h2>
                <p className="section-description">Manage your password and account security.</p>

                <div className="security-card">
                  <h3 className="security-card-title">Change Password</h3>

                  <div className="form-grid single">
                    <div className="form-field full-width">
                      <label className="form-label">Current Password</label>
                      <div className="password-input-container">
                        <input
                          type={showPassword.current ? 'text' : 'password'}
                          className="form-input"
                          value={passwordData.current}
                          onChange={handlePasswordChange('current')}
                          placeholder="Enter current password"
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => setShowPassword(prev => ({ ...prev, current: !prev.current }))}
                        >
                          {showPassword.current ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </button>
                      </div>
                    </div>

                    <div className="form-field full-width">
                      <label className="form-label">New Password</label>
                      <div className="password-input-container">
                        <input
                          type={showPassword.new ? 'text' : 'password'}
                          className="form-input"
                          value={passwordData.new}
                          onChange={handlePasswordChange('new')}
                          placeholder="Enter new password"
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => setShowPassword(prev => ({ ...prev, new: !prev.new }))}
                        >
                          {showPassword.new ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </button>
                      </div>
                      <p className="form-hint">Minimum 8 characters</p>
                    </div>

                    <div className="form-field full-width">
                      <label className="form-label">Confirm New Password</label>
                      <div className="password-input-container">
                        <input
                          type={showPassword.confirm ? 'text' : 'password'}
                          className="form-input"
                          value={passwordData.confirm}
                          onChange={handlePasswordChange('confirm')}
                          placeholder="Confirm new password"
                        />
                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => setShowPassword(prev => ({ ...prev, confirm: !prev.confirm }))}
                        >
                          {showPassword.confirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button className="primary-btn" onClick={handleChangePassword}>
                    Update Password
                  </button>
                </div>

                <div className="danger-zone">
                  <h3 className="danger-title">Danger Zone</h3>
                  <div className="danger-actions">
                    <div className="danger-item">
                      <div>
                        <span className="danger-label">Sign Out</span>
                        <p className="danger-description">Sign out of your account on this device</p>
                      </div>
                      <button className="danger-btn" onClick={handleLogout}>
                        Sign Out
                      </button>
                    </div>
                    <div className="danger-item">
                      <div>
                        <span className="danger-label">Delete Account</span>
                        <p className="danger-description">Permanently delete your account and all data</p>
                      </div>
                      <button className="danger-btn delete">
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Section */}
            {activeSection === 'payment' && (
              <div className="settings-section">
                <div className="section-header-row">
                  <div>
                    <h2 className="section-title">Payment Methods</h2>
                    <p className="section-description">Manage your payment options for purchases.</p>
                  </div>
                  <button className="secondary-btn">
                    <AddIcon /> Add Payment Method
                  </button>
                </div>

                <div className="empty-section">
                  <PaymentIcon className="empty-icon" />
                  <h3>No payment methods saved</h3>
                  <p>Add a payment method for faster checkout.</p>
                  <button className="primary-btn">
                    <AddIcon /> Add Payment Method
                  </button>
                </div>
              </div>
            )}

            {/* Help Section */}
            {activeSection === 'help' && (
              <div className="settings-section">
                <h2 className="section-title">Help & Support</h2>
                <p className="section-description">Get help with your account or contact support.</p>

                <div className="help-links">
                  <a href="#" className="help-link-card">
                    <div className="help-link-icon">
                      <HelpIcon />
                    </div>
                    <div className="help-link-content">
                      <h4>FAQs</h4>
                      <p>Find answers to common questions</p>
                    </div>
                  </a>

                  <a href="#" className="help-link-card">
                    <div className="help-link-icon">
                      <PersonIcon />
                    </div>
                    <div className="help-link-content">
                      <h4>Contact Support</h4>
                      <p>Get in touch with our team</p>
                    </div>
                  </a>

                  <a href="#" className="help-link-card">
                    <div className="help-link-icon">
                      <SecurityIcon />
                    </div>
                    <div className="help-link-content">
                      <h4>Privacy Policy</h4>
                      <p>Learn how we protect your data</p>
                    </div>
                  </a>

                  <a href="#" className="help-link-card">
                    <div className="help-link-icon">
                      <PaymentIcon />
                    </div>
                    <div className="help-link-content">
                      <h4>Terms of Service</h4>
                      <p>Read our terms and conditions</p>
                    </div>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
