import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import styles from '../SignIn/SignIn.module.css';
import { Button, Input, Logo } from '../../components';
import { authAPI } from '../../services/api';
import signInBg from '../../assets/signin-bg.png';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
      return;
    }

    if (!newPassword.trim()) {
      setError('Please enter a new password');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await authAPI.resetPassword(token, newPassword);
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.formSection}>
            <div className={styles.formWrapper}>
              <div className={styles.formHeader}>
                <h1 className={styles.title}>Invalid Link</h1>
                <p className={styles.subtitle}>
                  This password reset link is invalid or has expired.
                </p>
              </div>
              <div className={styles.form}>
                <div style={{
                  padding: '16px',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #ef4444',
                  borderRadius: '8px',
                  color: '#dc2626',
                  marginBottom: '16px',
                  fontSize: '14px',
                  textAlign: 'center'
                }}>
                  Please request a new password reset link.
                </div>
                <Link to="/forgot-password">
                  <Button fullWidth>Request New Link</Button>
                </Link>
              </div>
            </div>
          </div>
          <div className={styles.imageSection}>
            <img src={signInBg} alt="Healthcare" className={styles.bgImage} />
            <div className={styles.logoOverlay}>
              <Logo size="large" variant="white" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.formSection}>
          <div className={styles.formWrapper}>
            <div className={styles.formHeader}>
              <h1 className={styles.title}>Reset Password</h1>
              <p className={styles.subtitle}>
                {success
                  ? 'Your password has been reset successfully!'
                  : 'Enter your new password below.'}
              </p>
            </div>

            {!success ? (
              <form onSubmit={handleSubmit} className={styles.form}>
                {error && (
                  <div style={{
                    padding: '12px',
                    backgroundColor: '#fee2e2',
                    border: '1px solid #ef4444',
                    borderRadius: '8px',
                    color: '#dc2626',
                    marginBottom: '16px',
                    fontSize: '14px'
                  }}>
                    {error}
                  </div>
                )}

                <div className={styles.formFields}>
                  <Input
                    label="New Password"
                    name="newPassword"
                    type="password"
                    placeholder="Enter your new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <Input
                    label="Confirm Password"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>

                <Button type="submit" fullWidth disabled={isSubmitting}>
                  {isSubmitting ? 'Resetting...' : 'Reset Password'}
                </Button>

                <p className={styles.signupLink}>
                  Remember your password? <Link to="/login">Log in</Link>
                </p>
              </form>
            ) : (
              <div className={styles.form}>
                <div style={{
                  padding: '16px',
                  backgroundColor: '#dcfce7',
                  border: '1px solid #22c55e',
                  borderRadius: '8px',
                  color: '#166534',
                  marginBottom: '16px',
                  fontSize: '14px',
                  textAlign: 'center'
                }}>
                  Your password has been reset. Redirecting to login...
                </div>
                <Link to="/login">
                  <Button fullWidth>Go to Login</Button>
                </Link>
              </div>
            )}
          </div>

          <p className={styles.securityNote}>
            Your health information is securely encrypted and protected.
          </p>
        </div>

        <div className={styles.imageSection}>
          <img src={signInBg} alt="Healthcare" className={styles.bgImage} />
          <div className={styles.logoOverlay}>
            <Logo size="large" variant="white" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
