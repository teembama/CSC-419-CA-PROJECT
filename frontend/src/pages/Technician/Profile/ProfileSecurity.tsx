import React from 'react';

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

interface ProfileSecurityProps {
  passwordData: PasswordData;
  errors: PasswordErrors;
  showCurrentPassword: boolean;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
  isEditing: boolean;
  onPasswordInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleCurrentPassword: () => void;
  onToggleNewPassword: () => void;
  onToggleConfirmPassword: () => void;
  onSaveChanges: () => void;
  onEditInfo: () => void;
}

const ProfileSecurity: React.FC<ProfileSecurityProps> = ({
  passwordData,
  errors,
  showCurrentPassword,
  showNewPassword,
  showConfirmPassword,
  isEditing,
  onPasswordInputChange,
  onToggleCurrentPassword,
  onToggleNewPassword,
  onToggleConfirmPassword,
  onSaveChanges,
  onEditInfo,
}) => {
  const hasMinLength = passwordData.newPassword.length >= 8;
  const hasLowercase = /[a-z]/.test(passwordData.newPassword);
  const hasUppercase = /[A-Z]/.test(passwordData.newPassword);
  const hasNumber = /\d/.test(passwordData.newPassword);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(passwordData.newPassword);

  return (
    <div className="profile-form-section security-section">
      <div className="profile-form-header">
        <h3 className="profile-form-title">Security Settings</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="profile-edit-btn"
            onClick={onEditInfo}
          >
            {isEditing ? 'Cancel' : 'Edit Password'}
          </button>
          {isEditing && (
            <button className="profile-save-btn" onClick={onSaveChanges}>
              Save Changes
            </button>
          )}
        </div>
      </div>

      <div className="security-content">
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Update your password to keep your account secure.
        </p>

        <div className="profile-form-grid" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="profile-form-group">
            <label className="profile-form-label">Current Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                name="currentPassword"
                className={`profile-form-input ${errors.currentPassword ? 'error' : ''}`}
                value={passwordData.currentPassword}
                onChange={onPasswordInputChange}
                placeholder="Enter current password"
                disabled={!isEditing}
              />
              <button
                type="button"
                onClick={onToggleCurrentPassword}
                disabled={!isEditing}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: isEditing ? 'pointer' : 'default',
                  fontSize: '16px',
                }}
              >
                {showCurrentPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.currentPassword && (
              <span style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>{errors.currentPassword}</span>
            )}
          </div>

          <div className="profile-form-group">
            <label className="profile-form-label">New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNewPassword ? 'text' : 'password'}
                name="newPassword"
                className={`profile-form-input ${errors.newPassword ? 'error' : ''}`}
                value={passwordData.newPassword}
                onChange={onPasswordInputChange}
                placeholder="Enter new password"
                disabled={!isEditing}
              />
              <button
                type="button"
                onClick={onToggleNewPassword}
                disabled={!isEditing}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: isEditing ? 'pointer' : 'default',
                  fontSize: '16px',
                }}
              >
                {showNewPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.newPassword && (
              <span style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>{errors.newPassword}</span>
            )}
          </div>

          <div className="profile-form-group">
            <label className="profile-form-label">Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmNewPassword"
                className={`profile-form-input ${errors.confirmNewPassword ? 'error' : ''}`}
                value={passwordData.confirmNewPassword}
                onChange={onPasswordInputChange}
                placeholder="Confirm new password"
                disabled={!isEditing}
              />
              <button
                type="button"
                onClick={onToggleConfirmPassword}
                disabled={!isEditing}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: isEditing ? 'pointer' : 'default',
                  fontSize: '16px',
                }}
              >
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>
            {errors.confirmNewPassword && (
              <span style={{ color: '#dc2626', fontSize: '12px', marginTop: '4px' }}>{errors.confirmNewPassword}</span>
            )}
          </div>
        </div>

        {/* Password Requirements */}
        <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Password Requirements:</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '8px' }}>
            <li style={{ color: hasMinLength ? '#059669' : '#6b7280', fontSize: '13px' }}>
              {hasMinLength ? '✓' : '○'} Minimum 8 characters
            </li>
            <li style={{ color: hasLowercase ? '#059669' : '#6b7280', fontSize: '13px' }}>
              {hasLowercase ? '✓' : '○'} At least one lowercase letter
            </li>
            <li style={{ color: hasUppercase ? '#059669' : '#6b7280', fontSize: '13px' }}>
              {hasUppercase ? '✓' : '○'} At least one uppercase letter
            </li>
            <li style={{ color: hasNumber ? '#059669' : '#6b7280', fontSize: '13px' }}>
              {hasNumber ? '✓' : '○'} At least one number
            </li>
            <li style={{ color: hasSpecialChar ? '#059669' : '#6b7280', fontSize: '13px' }}>
              {hasSpecialChar ? '✓' : '○'} At least one special character
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProfileSecurity;
