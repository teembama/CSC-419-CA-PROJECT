import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';
import { useAuth } from '../../../context';

interface ProfileData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  staffId: string;
  email: string;
  phoneNumber: string;
  phoneCode: string;
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
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'personal' | 'security'>('personal');
  const [isEditing, setIsEditing] = useState(true);

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    dateOfBirth: user?.date_of_birth || '',
    gender: user?.gender || 'Male',
    staffId: user?.id?.substring(0, 12) || '',
    email: user?.email || '',
    phoneNumber: user?.phone_number || '',
    phoneCode: '+234',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    zipCode: user?.zip_code || '',
  });

  // Password state
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const [errors, setErrors] = useState<PasswordErrors>({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof PasswordErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validatePassword = (): boolean => {
    const newErrors: PasswordErrors = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else {
      const hasMinLength = passwordData.newPassword.length >= 8;
      const hasLowercase = /[a-z]/.test(passwordData.newPassword);
      const hasUppercase = /[A-Z]/.test(passwordData.newPassword);
      const hasNumber = /\d/.test(passwordData.newPassword);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword);

      if (!hasMinLength || !hasLowercase || !hasUppercase || !hasNumber || !hasSpecialChar) {
        newErrors.newPassword = 'Password does not meet all requirements';
      }
    }

    if (!passwordData.confirmNewPassword) {
      newErrors.confirmNewPassword = 'Please confirm your password';
    } else if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      newErrors.confirmNewPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveChanges = () => {
    if (activeTab === 'security') {
      if (validatePassword()) {
        console.log('Updating password');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: '',
        });
        setIsEditing(false);
      }
    } else {
      console.log('Saving profile changes:', profileData);
      setIsEditing(false);
    }
  };

  const handleEditInfo = () => {
    setIsEditing(!isEditing);
  };

  // Password strength indicators
  const hasMinLength = passwordData.newPassword.length >= 8;
  const hasLowercase = /[a-z]/.test(passwordData.newPassword);
  const hasUppercase = /[A-Z]/.test(passwordData.newPassword);
  const hasNumber = /\d/.test(passwordData.newPassword);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword);

  return (
    <div className="labs-page">
      {/* Top bar */}
      <header className="labs-topbar">
        <div className="labs-brand">
          <img
            src="/images/citycare-logo-icon.png"
            alt="CityCare logo"
            className="labs-logoImage"
          />
          <span className="labs-brandName">CityCare</span>
        </div>

        <div className="labs-search">
          <span className="labs-searchIcon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path
                d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm6.2-1.1 4.3 4.3"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <input className="labs-searchInput" placeholder="Search..." />
        </div>

        <div className="labs-topRight">
          <button
            className="labs-iconBtn"
            type="button"
            aria-label="Notifications"
          >
            <img
              className="labs-bellImg"
              src="/images/notification-bell.png"
              alt="Notifications"
            />
            <span className="labs-dot" aria-hidden="true" />
          </button>

          <div className="labs-user">
            <div className="labs-avatar">
              <img
                className="labs-avatarImg"
                src="/images/justin.jpg"
                alt={`${user?.first_name} ${user?.last_name}`}
              />
            </div>

            <div className="labs-userMeta">
              <div className="labs-userName">{user?.first_name} {user?.last_name}</div>
              <div className="labs-userRole">Clinician</div>
            </div>
          </div>
        </div>
      </header>

      <div className="labs-body">
        {/* Sidebar */}
        <aside className="labs-sidebar">
          <div className="labs-sidebarBox">
            <div className="labs-navHeader">
              <div className="labs-navHeaderPanel">
                <img
                  className="labs-navHeaderCollapse"
                  src="/images/sidebar-collapse.png"
                  alt="Collapse sidebar"
                />
                <span className="labs-navHeaderTitle">Navigation</span>
              </div>
            </div>

            <div className="labs-sectionTitle">Main</div>

            <nav className="labs-nav">
              <button className="labs-navItem" type="button" onClick={() => handleNavigation('/clinician/dashboard')}>
                <span className="labs-navItemIcon">
                  <img className="labs-navImg" src="/images/home.png" alt="" />
                </span>
                Home
              </button>

              <button className="labs-navItem" type="button" onClick={() => handleNavigation('/clinician/appointments')}>
                <span className="labs-navItemIcon">
                  <img className="labs-navImg" src="/images/appointments.png" alt="" />
                </span>
                Appointments
              </button>

              <button className="labs-navItem" type="button" onClick={() => handleNavigation('/clinician/patients')}>
                <span className="labs-navItemIcon">
                  <img className="labs-navImg" src="/images/patients.png" alt="" />
                </span>
                Patients
              </button>

              <button className="labs-navItem" type="button" onClick={() => handleNavigation('/clinician/labs')}>
                <span className="labs-navItemIcon">
                  <img className="labs-navImg" src="/images/labs.png" alt="" />
                </span>
                Labs
              </button>
            </nav>

            <div className="labs-sectionTitle labs-mt24">Secondary</div>

            <nav className="labs-nav">
              <button className="labs-navItem labs-navItem--active" type="button">
                <span className="labs-navItemIcon">
                  <img className="labs-navImg" src="/images/profile.png" alt="" />
                </span>
                Profile
              </button>

              <button className="labs-navItem" type="button">
                <span className="labs-navItemIcon">
                  <img className="labs-navImg" src="/images/help-circle.png" alt="" />
                </span>
                Help / Support
              </button>
            </nav>

            <button className="labs-logout" type="button" onClick={() => handleNavigation('/clinician/signin')}>
              <span className="labs-logoutIcon">
                <img className="labs-logoutImg" src="/images/log-out.png" alt="" />
              </span>
              Logout
            </button>
          </div>
        </aside>

        {/* Content */}
        <main className="labs-content">
          <div className="profile-top-header">
            <h1 className="profile-pageTitle">My Profile</h1>
            <div className="profile-breadcrumb">
              Profile › {activeTab === 'personal' ? 'Personal Info' : 'Security'}
            </div>
          </div>

          <p className="profile-subtitle">Manage your account information and preferences.</p>

          <div className="profile-layout">
            {/* Left Panel - Profile Card */}
            <div className="profile-left">
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
              </div>

              <div className="profile-card">
                <div className="profile-avatar-wrapper">
                  <img
                    src="/images/justin.jpg"
                    alt="John Doe"
                    className="profile-avatar"
                  />
                  <div className="profile-avatar-edit">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </div>
                </div>
                <h3 className="profile-name">{user?.first_name} {user?.last_name}</h3>
                <p className="profile-email">{user?.email}</p>
                <span className="profile-badge">Active Clinician</span>
              </div>

              <div className="quick-actions">
                <h3 className="quick-actions-title">Quick Actions</h3>
                <div className="quick-actions-buttons">
                  <button className="quick-action-btn" type="button">
                    <div className="action-content">
                      <div className="action-icon-circle records">
                        <img src="/images/clock-rotate.png" alt="" className="action-icon-img" />
                      </div>
                      <span className="action-text">Request Records</span>
                    </div>
                    <span className="action-arrow">›</span>
                  </button>
                  <button className="quick-action-btn" type="button">
                    <div className="action-content">
                      <div className="action-icon-circle share">
                        <img src="/images/share-ios.png" alt="" className="action-icon-img" />
                      </div>
                      <span className="action-text">Share Profile</span>
                    </div>
                    <span className="action-arrow">›</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Panel - Conditional Content */}
            <div className="profile-right">
              <div className="profile-form-header">
                <button className="profile-saveBtn" onClick={handleSaveChanges}>
                  Save Changes
                </button>
              </div>

              {activeTab === 'personal' ? (
                // Personal Info Content
                <div className="profile-form-content">
                  <div className="profile-form-section">
                    <div className="profile-section-header">
                      <h3 className="profile-section-title">Personal Information</h3>
                      <button className="profile-editBtn" onClick={handleEditInfo}>
                        {isEditing ? 'Cancel' : 'Edit Info'}
                      </button>
                    </div>

                    <div className="profile-form-grid">
                      <div className="profile-form-group">
                        <label htmlFor="firstName">First Name</label>
                        <input
                          type="text"
                          id="firstName"
                          name="firstName"
                          value={profileData.firstName}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          placeholder="John"
                        />
                      </div>

                      <div className="profile-form-group">
                        <label htmlFor="lastName">Last Name</label>
                        <input
                          type="text"
                          id="lastName"
                          name="lastName"
                          value={profileData.lastName}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          placeholder="Doe"
                        />
                      </div>

                      <div className="profile-form-group">
                        <label htmlFor="dateOfBirth">Date of Birth</label>
                        <div className="profile-input-with-icon">
                          <input
                            type="text"
                            id="dateOfBirth"
                            name="dateOfBirth"
                            value={profileData.dateOfBirth}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            placeholder="15/02/1985"
                          />
                          <svg className="profile-input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                            <line x1="16" y1="2" x2="16" y2="6"/>
                            <line x1="8" y1="2" x2="8" y2="6"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                        </div>
                      </div>

                      <div className="profile-form-group">
                        <label htmlFor="gender">Gender</label>
                        <select
                          id="gender"
                          name="gender"
                          value={profileData.gender}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="profile-form-group full-width">
                        <label htmlFor="staffId">Staff ID</label>
                        <input
                          type="text"
                          id="staffId"
                          name="staffId"
                          value={profileData.staffId}
                          disabled
                          className="disabled-input"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="profile-form-section">
                    <h3 className="profile-section-title">Contact Information</h3>

                    <div className="profile-form-grid">
                      <div className="profile-form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={profileData.email}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          placeholder="johndoe@example.com"
                        />
                      </div>

                      <div className="profile-form-group">
                        <label htmlFor="phoneNumber">Phone Number</label>
                        <div className="profile-phone-group">
                          <select
                            name="phoneCode"
                            value={profileData.phoneCode}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            className="profile-phone-code"
                          >
                            <option value="+234">+234</option>
                            <option value="+1">+1</option>
                            <option value="+44">+44</option>
                          </select>
                          <input
                            type="tel"
                            id="phoneNumber"
                            name="phoneNumber"
                            value={profileData.phoneNumber}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            placeholder="801 234 5678"
                            className="profile-phone-input"
                          />
                        </div>
                      </div>

                      <div className="profile-form-group full-width">
                        <label htmlFor="address">Address</label>
                        <input
                          type="text"
                          id="address"
                          name="address"
                          value={profileData.address}
                          onChange={handleInputChange}
                          disabled={!isEditing}
                          placeholder="129 Wellness Blvd, Apt 4B"
                        />
                      </div>

                      <div className="profile-form-row-three">
                        <div className="profile-form-group">
                          <label htmlFor="city">City</label>
                          <input
                            type="text"
                            id="city"
                            name="city"
                            value={profileData.city}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            placeholder=""
                          />
                        </div>

                        <div className="profile-form-group">
                          <label htmlFor="state">State</label>
                          <input
                            type="text"
                            id="state"
                            name="state"
                            value={profileData.state}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            placeholder=""
                          />
                        </div>

                        <div className="profile-form-group">
                          <label htmlFor="zipCode">Zip Code</label>
                          <input
                            type="text"
                            id="zipCode"
                            name="zipCode"
                            value={profileData.zipCode}
                            onChange={handleInputChange}
                            disabled={!isEditing}
                            placeholder=""
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Security Content
                <div className="profile-form-content">
                  <div className="profile-form-section">
                    <div className="profile-section-header">
                      <h3 className="profile-section-title">Change Password</h3>
                      <button className="profile-editBtn" onClick={handleEditInfo}>
                        {isEditing ? 'Cancel' : 'Edit Info'}
                      </button>
                    </div>

                    <div className="security-password-form">
                      <div className="profile-form-group full-width">
                        <label htmlFor="currentPassword">Current Password</label>
                        <div className="security-password-input-wrapper">
                          <input
                            type={showCurrentPassword ? 'text' : 'password'}
                            id="currentPassword"
                            name="currentPassword"
                            value={passwordData.currentPassword}
                            onChange={handlePasswordInputChange}
                            disabled={!isEditing}
                            placeholder="········"
                          />
                          <button
                            type="button"
                            className="security-toggle-password"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            disabled={!isEditing}
                          >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              {showCurrentPassword ? (
                                <>
                                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                  <line x1="1" y1="1" x2="23" y2="23"/>
                                </>
                              ) : (
                                <>
                                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                  <circle cx="12" cy="12" r="3"/>
                                </>
                              )}
                            </svg>
                          </button>
                        </div>
                        {errors.currentPassword && (
                          <span className="security-error-message">{errors.currentPassword}</span>
                        )}
                      </div>

                      <div className="security-password-grid">
                        <div className="profile-form-group">
                          <label htmlFor="newPassword">New Password</label>
                          <div className="security-password-input-wrapper">
                            <input
                              type={showNewPassword ? 'text' : 'password'}
                              id="newPassword"
                              name="newPassword"
                              value={passwordData.newPassword}
                              onChange={handlePasswordInputChange}
                              disabled={!isEditing}
                              placeholder="········"
                            />
                            <button
                              type="button"
                              className="security-toggle-password"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              disabled={!isEditing}
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                {showNewPassword ? (
                                  <>
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                    <line x1="1" y1="1" x2="23" y2="23"/>
                                  </>
                                ) : (
                                  <>
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                    <circle cx="12" cy="12" r="3"/>
                                  </>
                                )}
                              </svg>
                            </button>
                          </div>
                          {errors.newPassword && (
                            <span className="security-error-message">{errors.newPassword}</span>
                          )}
                        </div>

                        <div className="profile-form-group">
                          <label htmlFor="confirmNewPassword">Confirm New Password</label>
                          <div className="security-password-input-wrapper">
                            <input
                              type={showConfirmPassword ? 'text' : 'password'}
                              id="confirmNewPassword"
                              name="confirmNewPassword"
                              value={passwordData.confirmNewPassword}
                              onChange={handlePasswordInputChange}
                              disabled={!isEditing}
                              placeholder="········"
                            />
                            <button
                              type="button"
                              className="security-toggle-password"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              disabled={!isEditing}
                            >
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                {showConfirmPassword ? (
                                  <>
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                    <line x1="1" y1="1" x2="23" y2="23"/>
                                  </>
                                ) : (
                                  <>
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                    <circle cx="12" cy="12" r="3"/>
                                  </>
                                )}
                              </svg>
                            </button>
                          </div>
                          {errors.confirmNewPassword && (
                            <span className="security-error-message">{errors.confirmNewPassword}</span>
                          )}
                        </div>
                      </div>

                      <div className="security-password-requirements">
                        <h4 className="security-requirements-title">Password requirements:</h4>
                        <ul className="security-requirements-list">
                          <li className={hasMinLength ? 'met' : ''}>
                            Minimum of 8 characters - the more, the better
                          </li>
                          <li className={hasLowercase && hasUppercase ? 'met' : ''}>
                            At least one lowercase & one uppercase character
                          </li>
                          <li className={hasNumber || hasSpecialChar ? 'met' : ''}>
                            At least one number, symbol, or whitespace character
                          </li>
                        </ul>
                      </div>

                      <button
                        className="security-btn-update-password"
                        onClick={handleSaveChanges}
                        disabled={!isEditing}
                      >
                        Update Password
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Profile;