import React, { useState } from 'react';
import styles from './Profile.module.css';
import avatarImg from '../../assets/avatar.png';
import { useAuth } from '../../context';
import { userAPI } from '../../services/api';

interface ProfileData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  mrn: string;
  email: string;
  countryCode: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'personal' | 'security'>('personal');
  const [formData, setFormData] = useState<ProfileData>({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    dateOfBirth: user?.date_of_birth || '',
    gender: user?.gender || 'Male',
    mrn: user?.id?.substring(0, 12) || '',
    email: user?.email || '',
    countryCode: '+234',
    phoneNumber: user?.phone_number || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    zipCode: user?.zip_code || '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSaveMessage(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      await userAPI.updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
      });
      setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error: any) {
      setSaveMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update profile' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setSaveMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setSaveMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    setSaveMessage({ type: 'error', text: 'Password change requires the forgot password flow. Please use the forgot password link on the login page.' });
  };

  return (
    <div className={styles.profilePage}>
      {/* Header Section */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>My Profile</h1>
          <p className={styles.pageDescription}>Manage your account information and preferences.</p>
        </div>
        <div className={styles.breadcrumb}>
          <span className={styles.breadcrumbItem}>Profile</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4.5 3L7.5 6L4.5 9" stroke="#A4A4A4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className={styles.breadcrumbItemActive}>{activeTab === 'personal' ? 'Personal Info' : 'Security'}</span>
        </div>
      </div>

      {/* Tab Row */}
      <div className={styles.tabRow}>
        <div className={styles.tabSwitcher}>
          <button
            className={`${styles.tab} ${activeTab === 'personal' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            Personal Info
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'security' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('security')}
          >
            Security
          </button>
        </div>
        <button className={styles.saveBtn} onClick={handleSaveChanges} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {saveMessage && (
        <div style={{
          padding: '12px 16px',
          marginBottom: '16px',
          borderRadius: '8px',
          backgroundColor: saveMessage.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: saveMessage.type === 'success' ? '#166534' : '#dc2626',
          border: `1px solid ${saveMessage.type === 'success' ? '#22c55e' : '#ef4444'}`,
        }}>
          {saveMessage.text}
        </div>
      )}

      {/* Content Area */}
      <div className={styles.contentArea}>
        {/* Left Column - User Card & Quick Actions */}
        <div className={styles.leftColumn}>
          {/* User Profile Card */}
          <div className={styles.userCard}>
            <div className={styles.avatarWrapper}>
              <img
                src={avatarImg}
                alt="Profile"
                className={styles.avatar}
              />
              <button className={styles.editAvatarBtn}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8.5 1.5C8.63132 1.36868 8.78722 1.26454 8.95893 1.19347C9.13064 1.12239 9.31465 1.08582 9.50044 1.08582C9.68623 1.08582 9.87024 1.12239 10.042 1.19347C10.2137 1.26454 10.3696 1.36868 10.5009 1.5C10.6322 1.63132 10.7363 1.78722 10.8074 1.95893C10.8785 2.13064 10.915 2.31465 10.915 2.50044C10.915 2.68623 10.8785 2.87024 10.8074 3.04195C10.7363 3.21366 10.6322 3.36956 10.5009 3.50088L3.75 10.2518L1 11L1.74824 8.25L8.5 1.5Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            <h3 className={styles.userName}>{formData.firstName} {formData.lastName}</h3>
            <p className={styles.userEmail}>{formData.email}</p>
            <span className={styles.statusTag}>Active Patient</span>
          </div>

          {/* Quick Actions */}
          <div className={styles.quickActionsCard}>
            <h3 className={styles.quickActionsTitle}>Quick Actions</h3>
            <button className={styles.quickActionBtn} type="button">
              <div className={`${styles.quickActionIcon} ${styles.records}`}>
                <img src="/images/clock-rotate.png" alt="" className={styles.quickActionIconImg} />
              </div>
              <span className={styles.quickActionText}>Request Records</span>
              <span className={styles.quickActionArrow}>›</span>
            </button>
            <button className={styles.quickActionBtn} type="button">
              <div className={`${styles.quickActionIcon} ${styles.share}`}>
                <img src="/images/share-ios.png" alt="" className={styles.quickActionIconImg} />
              </div>
              <span className={styles.quickActionText}>Share Profile</span>
              <span className={styles.quickActionArrow}>›</span>
            </button>
          </div>
        </div>

        {/* Right Column - Form Content */}
        <div className={styles.rightColumn}>
          {activeTab === 'personal' ? (
            <>
              {/* Personal Information Section */}
              <div className={styles.formCard}>
                <div className={styles.formHeader}>
                  <h3 className={styles.formTitle}>Personal Information</h3>
                  <button className={styles.editInfoBtn}>Edit Info</button>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>First Name</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={styles.formInput}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Last Name</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={styles.formInput}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Date of Birth</label>
                    <div className={styles.inputWithIcon}>
                      <input
                        type="text"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        className={styles.formInput}
                        placeholder="DD/MM/YYYY"
                      />
                      <span className={styles.inputIcon}>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="2.5" y="3.33334" width="15" height="15" rx="2" stroke="#9EA2AD" strokeWidth="1.5"/>
                          <path d="M2.5 7.5H17.5" stroke="#9EA2AD" strokeWidth="1.5" strokeLinecap="round"/>
                          <path d="M6.66667 2.5V4.16667" stroke="#9EA2AD" strokeWidth="1.5" strokeLinecap="round"/>
                          <path d="M13.3333 2.5V4.16667" stroke="#9EA2AD" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </span>
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Gender</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className={styles.formSelect}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className={styles.formGroupFull}>
                    <label className={styles.formLabel}>MRN</label>
                    <input
                      type="text"
                      name="mrn"
                      value={formData.mrn}
                      onChange={handleInputChange}
                      className={styles.formInput}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className={styles.formCard}>
                <div className={styles.formHeader}>
                  <h3 className={styles.formTitle}>Contact Information</h3>
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Email Address</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={styles.formInput}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Phone Number</label>
                    <div className={styles.phoneInputWrapper}>
                      <select
                        name="countryCode"
                        value={formData.countryCode}
                        onChange={handleInputChange}
                        className={styles.countryCodeSelect}
                      >
                        <option value="+234">+234</option>
                        <option value="+1">+1</option>
                        <option value="+44">+44</option>
                        <option value="+91">+91</option>
                      </select>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        className={styles.phoneInput}
                      />
                    </div>
                  </div>
                  <div className={styles.formGroupFull}>
                    <label className={styles.formLabel}>Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className={styles.formInput}
                    />
                  </div>
                  <div className={styles.threeColumnRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>State</label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Zip Code</label>
                      <input
                        type="text"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleInputChange}
                        className={styles.formInput}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Change Password Section */}
              <div className={styles.formCard}>
                <div className={styles.formHeader}>
                  <h3 className={styles.formTitle}>Change Password</h3>
                  <button className={styles.editInfoBtn}>Edit Info</button>
                </div>

                <div className={styles.passwordForm}>
                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Current Password</label>
                    <div className={styles.passwordInputWrapper}>
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        placeholder="• • • • • • • •"
                        className={styles.formInput}
                      />
                    </div>
                  </div>

                  <div className={styles.passwordRow}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>New Password</label>
                      <div className={styles.passwordInputWrapper}>
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          name="newPassword"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          placeholder="• • • • • • • •"
                          className={styles.formInput}
                        />
                        <button
                          type="button"
                          className={styles.eyeBtn}
                          onClick={() => togglePasswordVisibility('new')}
                        >
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1.66663 10C1.66663 10 4.16663 4.16669 10 4.16669C15.8333 4.16669 18.3333 10 18.3333 10C18.3333 10 15.8333 15.8334 10 15.8334C4.16663 15.8334 1.66663 10 1.66663 10Z" stroke="#9EA2AD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="#9EA2AD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Confirm New Password</label>
                      <div className={styles.passwordInputWrapper}>
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          name="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          placeholder="• • • • • • • •"
                          className={styles.formInput}
                        />
                        <button
                          type="button"
                          className={styles.eyeBtn}
                          onClick={() => togglePasswordVisibility('confirm')}
                        >
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1.66663 10C1.66663 10 4.16663 4.16669 10 4.16669C15.8333 4.16669 18.3333 10 18.3333 10C18.3333 10 15.8333 15.8334 10 15.8334C4.16663 15.8334 1.66663 10 1.66663 10Z" stroke="#9EA2AD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="#9EA2AD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Password Requirements */}
                  <div className={styles.passwordRequirements}>
                    <p className={styles.requirementsTitle}>Password requirements:</p>
                    <ul className={styles.requirementsList}>
                      <li>Minimum of 8 characters - the more, the better</li>
                      <li>At least one lowercase & one uppercase character</li>
                      <li>At least one number, symbol, or whitespace character</li>
                    </ul>
                  </div>

                  <button className={styles.updatePasswordBtn} onClick={handleUpdatePassword}>Update Password</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
