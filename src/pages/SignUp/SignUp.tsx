import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './SignUp.module.css';
import { Button, Input, PhoneInput, Checkbox, Logo } from '../../components';
import authBg from '../../assets/auth-bg.png';

interface SignUpFormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

export const SignUp: React.FC = () => {
  const [formData, setFormData] = useState<SignUpFormData>({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });

  const [errors, setErrors] = useState<Partial<SignUpFormData>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof SignUpFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<SignUpFormData> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required' as any;
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required' as any;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email' as any;
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required' as any;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required' as any;
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters' as any;
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match' as any;
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = true as any;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      console.log('Form submitted:', formData);
      // Handle form submission - integrate with your auth service
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.formSection}>
          <div className={styles.formHeader}>
            <h1 className={styles.title}>Create your patient account</h1>
            <p className={styles.subtitle}>
              Sign Up to book appointments, view medical records, and manage your care.
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formFields}>
              <Input
                label="Full Name"
                name="fullName"
                required
                placeholder="Enter your full name (e.g. John Doe)"
                value={formData.fullName}
                onChange={handleChange}
                error={errors.fullName as string}
              />

              <Input
                label="Email Address"
                name="email"
                type="email"
                required
                placeholder="example@email.com"
                value={formData.email}
                onChange={handleChange}
                error={errors.email as string}
              />

              <PhoneInput
                label="Phone Number"
                name="phoneNumber"
                required
                placeholder="801  234  5678"
                value={formData.phoneNumber}
                onChange={handleChange}
              />

              <Input
                label="Password"
                name="password"
                type="password"
                required
                placeholder=" • • • • • • • •"
                showPasswordToggle
                value={formData.password}
                onChange={handleChange}
                hint="Must be at least 8 characters"
                error={errors.password as string}
              />

              <Input
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                required
                placeholder="Re-enter your password"
                showPasswordToggle
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword as string}
              />
            </div>

            <Button type="submit" fullWidth>
              Create Account
            </Button>

            <Checkbox
              name="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={handleChange}
              label={
                <>
                  I agree to the <Link to="/terms">Terms of Service</Link> and{' '}
                  <Link to="/privacy">Privacy Policy</Link>
                </>
              }
            />

            <p className={styles.loginLink}>
              Already have an account? <Link to="/login">Log in</Link>
            </p>
          </form>
        </div>

        <div className={styles.imageSection}>
          <img src={authBg} alt="Healthcare" className={styles.bgImage} />
          <div className={styles.logoOverlay}>
            <Logo size="large" variant="white" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
