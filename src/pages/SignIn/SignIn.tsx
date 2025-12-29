import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './SignIn.module.css';
import { Button, Input, Logo } from '../../components';
import signInBg from '../../assets/signin-bg.png';

interface SignInFormData {
  emailOrPhone: string;
  password: string;
}

export const SignIn: React.FC = () => {
  const [formData, setFormData] = useState<SignInFormData>({
    emailOrPhone: '',
    password: '',
  });

  const [errors, setErrors] = useState<Partial<SignInFormData>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof SignInFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<SignInFormData> = {};

    if (!formData.emailOrPhone.trim()) {
      newErrors.emailOrPhone = 'Email or phone number is required';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      console.log('Login submitted:', formData);
      // Handle login - integrate with your auth service
    }
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
              <div className={styles.formFields}>
                <Input
                  label="Email Address or Phone Number"
                  name="emailOrPhone"
                  placeholder="Enter your email address or phone number"
                  value={formData.emailOrPhone}
                  onChange={handleChange}
                  error={errors.emailOrPhone}
                />

                <div className={styles.passwordField}>
                  <Input
                    label="Password"
                    name="password"
                    type="password"
                    placeholder="Enter your  • • • • • • • •"
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

              <Button type="submit" fullWidth>
                Log in
              </Button>

              <p className={styles.signupLink}>
                Don't have an account? <Link to="/signup">Create one</Link>
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
