import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context';
import { userAPI } from '../../../services/api';
import ProfileSecurity from './ProfileSecurity';
import NotificationDropdown from '../../../components/Notifications/NotificationDropdown';
import GlobalSearch from '../../../components/Search/GlobalSearch';
import './Profile.css';

interface ProfileData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  staffId: string;
  email: string;
  phone: string;
  countryCode: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

interface PasswordErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'personal' | 'security'>('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Password state
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Get user display name from AuthContext
  const userFullName = `${user?.first_name || user?.firstName || ''} ${user?.last_name || user?.lastName || ''}`.trim() || 'Lab Technician';

  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    staffId: '',
    email: '',
    phone: '',
    countryCode: '+234',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });

  // Load user data from AuthContext
  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.first_name || user.firstName || '',
        lastName: user.last_name || user.lastName || '',
        dateOfBirth: user.date_of_birth || user.dateOfBirth || '',
        gender: user.gender || '',
        staffId: user.id?.slice(0, 8).toUpperCase() || '',
        email: user.email || '',
        phone: user.phone || '',
        countryCode: '+234',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        zipCode: user.zipCode || user.zip_code || '',
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (passwordErrors[name as keyof PasswordErrors]) {
      setPasswordErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validatePassword = (): boolean => {
    const errors: PasswordErrors = {};

    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else {
      const hasMinLength = passwordData.newPassword.length >= 8;
      const hasLowercase = /[a-z]/.test(passwordData.newPassword);
      const hasUppercase = /[A-Z]/.test(passwordData.newPassword);
      const hasNumber = /\d/.test(passwordData.newPassword);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword);

      if (!hasMinLength || !hasLowercase || !hasUppercase || !hasNumber || !hasSpecialChar) {
        errors.newPassword = 'Password does not meet all requirements';
      }
    }

    if (!passwordData.confirmNewPassword) {
      errors.confirmNewPassword = 'Please confirm your password';
    } else if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      errors.confirmNewPassword = 'Passwords do not match';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      if (activeTab === 'security') {
        if (validatePassword()) {
          await userAPI.changePassword(
            passwordData.currentPassword,
            passwordData.newPassword
          );
          setSaveMessage({ type: 'success', text: 'Password updated successfully!' });
          setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
          setIsEditing(false);
        }
      } else {
        await userAPI.updateProfile({
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          phoneNumber: profileData.phone,
          address: profileData.address,
          city: profileData.city,
          state: profileData.state,
          zipCode: profileData.zipCode,
        });

        setIsEditing(false);
        setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
        if (refreshUser) await refreshUser();
      }

      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error: any) {
      console.error('Error saving:', error);
      const message = error.response?.data?.message || 'Failed to save changes. Please try again.';
      setSaveMessage({ type: 'error', text: message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/technician/signin');
  };

  return (
    <div className="profile-container">
      {/* Header */}
      <header className="profile-header">
        <div className="profile-header-left">
          <img src="/images/citycare-logo-icon.png" alt="CityCare" className="profile-logo-icon" />
          <span className="profile-logo-text">CityCare</span>
        </div>

        <div className="profile-header-center">
          <GlobalSearch userRole="technician" placeholder="Search..." />
        </div>

        <div className="profile-header-right">
          <NotificationDropdown userRole="technician" />
          <div className="profile-user-info">
            <img src="/images/avatar.png" alt={userFullName} className="profile-user-avatar" />
            <div className="profile-user-details">
              <span className="profile-user-name">{userFullName}</span>
              <span className="profile-user-role">Lab Technician</span>
            </div>
          </div>
        </div>
      </header>

      <div className="profile-layout">
        {/* Sidebar */}
        <aside className={`profile-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <button
            className="profile-sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            ☰
          </button>

          <div className="profile-sidebar-header">
            <h3 className="profile-nav-title">Navigation</h3>
          </div>

          <nav className="profile-nav">
            <div className="profile-nav-section">
              <h4 className="profile-nav-section-title">Main</h4>
              <button className="profile-nav-item" onClick={() => navigate('/technician/dashboard')}>
                <span className="profile-nav-icon">🏠</span>
                <span className="profile-nav-label">Dashboard</span>
              </button>
              <button className="profile-nav-item" onClick={() => navigate('/technician/lab-orders')}>
                <span className="profile-nav-icon">📋</span>
                <span className="profile-nav-label">Lab Orders</span>
              </button>
              <button className="profile-nav-item" onClick={() => navigate('/technician/results')}>
                <span className="profile-nav-icon">📊</span>
                <span className="profile-nav-label">Results</span>
              </button>
            </div>

            <div className="profile-nav-section">
              <h4 className="profile-nav-section-title">Secondary</h4>
              <button className="profile-nav-item active" onClick={() => navigate('/technician/profile')}>
                <span className="profile-nav-icon">👤</span>
                <span className="profile-nav-label">Profile</span>
              </button>
            </div>
          </nav>

          <button className="profile-logout-btn" onClick={handleLogout}>
            <span className="profile-logout-icon">🚪</span>
            <span className="profile-logout-label">Logout</span>
          </button>
        </aside>

        {/* Main Content */}
        <main className="profile-main-content">
          {/* Page Header */}
          <div className="profile-page-header">
            <div>
              <h1 className="profile-page-title">My Profile</h1>
              <p className="profile-page-subtitle">Manage your account information and preferences.</p>
            </div>
            <div className="profile-breadcrumb">
              <span>Profile</span>
              <span className="profile-breadcrumb-separator">›</span>
              <span className="profile-breadcrumb-active">Personal Info</span>
            </div>
          </div>

          {/* Save Message */}
          {saveMessage && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '16px',
                backgroundColor: saveMessage.type === 'success' ? '#ecfdf5' : '#fef2f2',
                color: saveMessage.type === 'success' ? '#059669' : '#dc2626',
                border: `1px solid ${saveMessage.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
              }}
            >
              {saveMessage.text}
            </div>
          )}

          {/* Tabs */}
          <div className="profile-tabs">
            <button
              className={`profile-tab ${activeTab === 'personal' ? 'active' : ''}`}
              onClick={() => setActiveTab('personal')}
            >
              Personal Info
            </button>
            <button
              className={`profile-tab ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              Security
            </button>
            <button
              className="profile-save-btn"
              onClick={handleSaveChanges}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {/* Content Grid */}
          <div className="profile-content-grid">
            {/* Left Column - Profile Card */}
            <div className="profile-card">
              <div className="profile-avatar-section">
                <div className="profile-avatar-wrapper">
                  <img src="/images/avatar.png" alt={userFullName} className="profile-avatar-large" />
                  <button className="profile-avatar-edit">
                    <span>✏️</span>
                  </button>
                </div>
                <h3 className="profile-card-name">{profileData.firstName} {profileData.lastName}</h3>
                <p className="profile-card-email">{profileData.email}</p>
                <span className="profile-status-badge">Active Technician</span>
              </div>

              <div className="profile-quick-actions">
                <h4 className="profile-quick-actions-title">Quick Actions</h4>
                <button className="profile-action-btn" onClick={() => navigate('/technician/lab-orders')}>
                  <span className="profile-action-icon">📋</span>
                  <span className="profile-action-text">View Pending Orders</span>
                  <span className="profile-action-arrow">›</span>
                </button>
                <button className="profile-action-btn" onClick={() => navigate('/technician/results')}>
                  <span className="profile-action-icon">📊</span>
                  <span className="profile-action-text">Upload Results</span>
                  <span className="profile-action-arrow">›</span>
                </button>
              </div>
            </div>

            {/* Right Column - Forms */}
            <div className="profile-forms">
              {activeTab === 'personal' ? (
                <>
                  {/* Personal Information */}
                  <div className="profile-form-section">
                    <div className="profile-form-header">
                      <h3 className="profile-form-title">Personal Information</h3>
                      <button 
                        className="profile-edit-btn"
                        onClick={() => setIsEditing(!isEditing)}
                      >
                        {isEditing ? 'Cancel' : 'Edit Info'}
                      </button>
                    </div>

                    <div className="profile-form-grid">
                      <div className="profile-form-group">
                        <label className="profile-form-label">First Name</label>
                        <input
                          type="text"
                          name="firstName"
                          className="profile-form-input"
                          value={profileData.firstName}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="profile-form-group">
                        <label className="profile-form-label">Last Name</label>
                        <input
                          type="text"
                          name="lastName"
                          className="profile-form-input"
                          value={profileData.lastName}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="profile-form-group">
                        <label className="profile-form-label">Date of Birth</label>
                        <input
                          type="date"
                          name="dateOfBirth"
                          className="profile-form-input"
                          value={profileData.dateOfBirth}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="profile-form-group">
                        <label className="profile-form-label">Gender</label>
                        <select
                          name="gender"
                          className="profile-form-select"
                          value={profileData.gender}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        >
                          <option>Male</option>
                          <option>Female</option>
                          <option>Other</option>
                        </select>
                      </div>

                      <div className="profile-form-group profile-form-group-full">
                        <label className="profile-form-label">Staff ID</label>
                        <input
                          type="text"
                          name="staffId"
                          className="profile-form-input"
                          value={profileData.staffId}
                          disabled
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="profile-form-section">
                    <h3 className="profile-form-title">Contact Information</h3>

                    <div className="profile-form-grid">
                      <div className="profile-form-group">
                        <label className="profile-form-label">Email Address</label>
                        <input
                          type="email"
                          name="email"
                          className="profile-form-input"
                          value={profileData.email}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="profile-form-group">
                        <label className="profile-form-label">Phone Number</label>
                        <div className="profile-phone-input">
                          <select
                            name="countryCode"
                            className="profile-country-code"
                            value={profileData.countryCode}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          >
                            <option>+234</option>
                            <option>+1</option>
                            <option>+44</option>
                          </select>
                          <input
                            type="tel"
                            name="phone"
                            className="profile-form-input profile-phone-number"
                            value={profileData.phone}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                          />
                        </div>
                      </div>

                      <div className="profile-form-group profile-form-group-full">
                        <label className="profile-form-label">Address</label>
                        <input
                          type="text"
                          name="address"
                          className="profile-form-input"
                          value={profileData.address}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="profile-form-group">
                        <label className="profile-form-label">City</label>
                        <input
                          type="text"
                          name="city"
                          className="profile-form-input"
                          value={profileData.city}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="profile-form-group">
                        <label className="profile-form-label">State</label>
                        <input
                          type="text"
                          name="state"
                          className="profile-form-input"
                          value={profileData.state}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="profile-form-group">
                        <label className="profile-form-label">Zip Code</label>
                        <input
                          type="text"
                          name="zipCode"
                          className="profile-form-input"
                          value={profileData.zipCode}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                // Security Tab Content
                <ProfileSecurity
                  passwordData={passwordData}
                  errors={passwordErrors}
                  showCurrentPassword={showCurrentPassword}
                  showNewPassword={showNewPassword}
                  showConfirmPassword={showConfirmPassword}
                  isEditing={isEditing}
                  onPasswordInputChange={handlePasswordInputChange}
                  onToggleCurrentPassword={() => setShowCurrentPassword(!showCurrentPassword)}
                  onToggleNewPassword={() => setShowNewPassword(!showNewPassword)}
                  onToggleConfirmPassword={() => setShowConfirmPassword(!showConfirmPassword)}
                  onSaveChanges={handleSaveChanges}
                  onEditInfo={() => setIsEditing(!isEditing)}
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;
