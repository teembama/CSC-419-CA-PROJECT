import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from '../SignIn/SignIn.module.css';
import { Button, Input, Logo } from '../../components';
import { authAPI } from '../../services/api';
import signInBg from '../../assets/signin-bg.png';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await authAPI.forgotPassword(email);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.formSection}>
          <div className={styles.formWrapper}>
            <div className={styles.formHeader}>
              <h1 className={styles.title}>Forgot Password</h1>
              <p className={styles.subtitle}>
                {submitted
                  ? 'Check your email for password reset instructions.'
                  : 'Enter your email address and we\'ll send you a link to reset your password.'}
              </p>
            </div>

            {!submitted ? (
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
                    label="Email Address"
                    name="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <Button type="submit" fullWidth disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : 'Send Reset Link'}
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
                  If an account exists with that email, you will receive password reset instructions.
                </div>
                <Link to="/login">
                  <Button fullWidth variant="outline">Back to Login</Button>
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

export default ForgotPassword;
