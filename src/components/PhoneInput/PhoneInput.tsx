import React from 'react';
import styles from './PhoneInput.module.css';

export interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  required?: boolean;
  countryCode?: string;
  onCountryCodeChange?: (code: string) => void;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  label,
  required = false,
  countryCode = '+234',
  onCountryCodeChange,
  className = '',
  ...props
}) => {
  return (
    <div className={`${styles.phoneField} ${className}`}>
      {label && (
        <label className={styles.label}>
          <span className={styles.labelText}>{label}</span>
          {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <div className={styles.inputWrapper}>
        <div className={styles.countryCode}>
          <span className={styles.codeText}>{countryCode}</span>
          <ChevronDownIcon />
        </div>
        <input
          type="tel"
          className={styles.input}
          {...props}
        />
      </div>
    </div>
  );
};

const ChevronDownIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 7.5L10 12.5L15 7.5" stroke="#9EA2AD" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default PhoneInput;
