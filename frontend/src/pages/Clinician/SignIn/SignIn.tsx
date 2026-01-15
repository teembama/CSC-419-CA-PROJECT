import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './SignIn.css';
import cityCareLogoWhite from '../../../assets/cityCarelogo.png';
import authBg from '../../../assets/auth-bg.png';
import { useAuth } from '../../../context';

interface FormData {
  emailOrPhone: string;
  password: string;
}

interface FormErrors {
  emailOrPhone?: string;
  password?: string;
  general?: string;
}

const ClinicianSignIn: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState<FormData>({
    emailOrPhone: '',
    password: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
        general: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.emailOrPhone.trim()) {
      newErrors.emailOrPhone = 'Email address or phone number is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    const result = await login(formData.emailOrPhone, formData.password);

    if (result.success) {
      // Get the current user from localStorage to check role
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          // Decode JWT to get role (basic decode without verification)
          const payload = JSON.parse(atob(token.split('.')[1]));
          const userRole = payload.role;

          // Allow Clinician, LabTechnician, Staff, and Admin roles
          const allowedRoles = ['Clinician', 'LabTechnician', 'Staff', 'Admin'];
          if (!allowedRoles.includes(userRole)) {
            // User is a patient, redirect them to patient portal
            setErrors({ general: 'This portal is for staff only. Please use the patient portal.' });
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setIsSubmitting(false);
            return;
          }
        } catch (e) {
          // If we can't decode token, proceed anyway
          console.warn('Could not decode token:', e);
        }
      }
      navigate('/clinician/dashboard');
    } else {
      setErrors({ general: result.error || 'Login failed. Please check your credentials.' });
    }

    setIsSubmitting(false);
  };

  return (
    <div className="signin-container">
      <div className="signin-content">
        <div className="form-section">
          <h1 className="title">Welcome Back</h1>
          <p className="subtitle">Sign in to access the CityCare staff portal</p>

          <form onSubmit={handleSubmit}>
            {errors.general && (
              <div
                role="alert"
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  backgroundColor: '#FEE2E2',
                  border: '2px solid #EF4444',
                  borderRadius: '8px',
                  boxSizing: 'border-box',
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '4px'
                }}>
                  <span style={{ fontSize: '16px' }}>⚠️</span>
                  <strong style={{ color: '#DC2626', fontSize: '14px' }}>Sign in failed</strong>
                </div>
                <div style={{ color: '#991B1B', fontSize: '13px', paddingLeft: '24px' }}>
                  {errors.general}
                </div>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="emailOrPhone">Email Address or Phone Number</label>
              <input
                type="text"
                id="emailOrPhone"
                name="emailOrPhone"
                value={formData.emailOrPhone}
                onChange={handleInputChange}
                placeholder="Enter your email address or phone number"
                className={errors.emailOrPhone ? 'error' : ''}
              />
              {errors.emailOrPhone && (
                <span className="error-message">{errors.emailOrPhone}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  className={errors.password ? 'error' : ''}
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <Link to="/clinician/forgot-password" className="forgot-password-link">
              Forgot your password?
            </Link>

            <button type="submit" className="submit-button" disabled={isSubmitting}>
              {isSubmitting ? 'Logging in...' : 'Log in'}
            </button>

            <p className="signup-link">
              New to the portal?{' '}
              <Link to="/clinician/signup" className="link">
                Sign up
              </Link>
            </p>
          </form>

        </div>

        <div className="image-section">
          <img
            src={authBg}
            alt="Healthcare"
            className="hero-image"
          />
          <div className="logo-overlay">
            <img src={cityCareLogoWhite} alt="" className="logo-icon-img" />
            <span className="logo-text">CityCare</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClinicianSignIn;
