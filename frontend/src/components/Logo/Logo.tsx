import React from 'react';
import styles from './Logo.module.css';
import cityCarelogo from '../../assets/cityCarelogo.png';
import cityCarelogoColored from '../../assets/cityCarelogoColored.png';

export interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'white';
  showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'medium',
  variant = 'default',
  showText = true,
}) => {
  const iconSize = {
    small: 24,
    medium: 32,
    large: 60,
  }[size];

  // Use white logo for auth pages (white variant), colored logo for dashboard
  const logoSrc = variant === 'white' ? cityCarelogo : cityCarelogoColored;

  return (
    <div className={`${styles.logo} ${styles[size]}`}>
      <img
        src={logoSrc}
        alt="CityCare"
        style={{ height: iconSize, width: 'auto' }}
        className={styles.logoImage}
      />
      {showText && (
        <span className={`${styles.text} ${variant === 'white' ? styles.textWhite : styles.textGradient}`}>
          CityCare
        </span>
      )}
    </div>
  );
};

export default Logo;
