import React, { useState } from 'react';
import styles from './Input.module.css';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  required = false,
  hint,
  error,
  leftIcon,
  rightIcon,
  showPasswordToggle = false,
  type = 'text',
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = showPasswordToggle && type === 'password'
    ? (showPassword ? 'text' : 'password')
    : type;

  return (
    <div className={`${styles.inputField} ${className}`}>
      {label && (
        <label className={styles.label}>
          <span className={styles.labelText}>{label}</span>
          {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <div className={`${styles.inputWrapper} ${error ? styles.inputError : ''}`}>
        {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}

        <input
          type={inputType}
          className={styles.input}
          {...props}
        />

        {showPasswordToggle && type === 'password' && (
          <button
            type="button"
            className={styles.togglePassword}
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}

        {rightIcon && !showPasswordToggle && (
          <span className={styles.rightIcon}>{rightIcon}</span>
        )}
      </div>

      {(hint || error) && (
        <div className={`${styles.hint} ${error ? styles.hintError : ''}`}>
          {error || hint}
        </div>
      )}
    </div>
  );
};

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 4.375C3.75 4.375 1.25 10 1.25 10C1.25 10 3.75 15.625 10 15.625C16.25 15.625 18.75 10 18.75 10C18.75 10 16.25 4.375 10 4.375Z" stroke="#9EA2AD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z" stroke="#9EA2AD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.75 3.75L16.25 16.25" stroke="#9EA2AD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8.125 8.125C7.7925 8.4575 7.625 8.8958 7.625 9.375C7.625 10.4083 8.4667 11.25 9.5 11.25C9.9792 11.25 10.4175 11.0825 10.75 10.75" stroke="#9EA2AD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6.25 6.25C3.75 7.5 2.5 10 2.5 10C2.5 10 5 15 10 15C11.4167 15 12.6667 14.6667 13.75 14.1667" stroke="#9EA2AD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15.8333 12.5C17.0833 11.25 17.5 10 17.5 10C17.5 10 15 5 10 5C9.58333 5 9.16667 5.04167 8.75 5.125" stroke="#9EA2AD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default Input;
