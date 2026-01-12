import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './SignIn.module.css';
import { Button, Input, Logo } from '../../components';
import { useAuth } from '../../context';
import signInBg from '../../assets/signin-bg.png';

interface SignInFormData {
  email: string;
  password: string;
}

export const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState<SignInFormData>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<SignInFormData> & { general?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name as keyof SignInFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined, general: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<SignInFormData> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
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

    const result = await login(formData.email, formData.password);

    if (result.success) {
      navigate('/');
    } else {
      setErrors({ general: result.error });
    }

    setIsSubmitting(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.formSection}>
          <div className={styles.formWrapper}>
            <div className={styles.formHeader}>
              <h1 className={styles.title}>Welcome Back</h1>
              <p className={styles.subtitle}>
                Log in to access your appointments, medical records, and bills.
              </p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              {errors.general && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #ef4444',
                  borderRadius: '8px',
                  color: '#dc2626',
                  marginBottom: '16px',
                  fontSize: '14px'
                }}>
                  {errors.general}
                </div>
              )}

              <div className={styles.formFields}>
                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                />

                <div className={styles.passwordField}>
                  <Input
                    label="Password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    showPasswordToggle
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                  />
                  <Link to="/forgot-password" className={styles.forgotPassword}>
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <Button type="submit" fullWidth disabled={isSubmitting}>
                {isSubmitting ? 'Logging in...' : 'Log in'}
              </Button>

              <p className={styles.signupLink}>
                Don't have an account? <Link to="/signup">Create one</Link>
              </p>

              <p className={styles.signupLink}>
                Are you a clinician? <Link to="/clinician/signin">Sign in here</Link>
              </p>
            </form>
          </div>

          <p className={styles.securityNote}>
            🔒 Your health information is securely encrypted and protected.
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

export default SignIn;
