import React from 'react';
import styles from './Header.module.css';
import { Logo } from '../Logo/Logo';
import { SearchIcon, BellIcon } from '../Icons';
import avatar from '../../assets/avatar.png';

// Hamburger menu icon
const MenuIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 12H21" stroke="#4A4A4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 6H21" stroke="#4A4A4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 18H21" stroke="#4A4A4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface HeaderProps {
  userName?: string;
  userRole?: string;
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  userName = 'John Doe',
  userRole = 'Patient',
  onMenuClick,
}) => {
  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <div className={styles.headerLeft}>
          <button className={styles.menuBtn} onClick={onMenuClick}>
            <MenuIcon />
          </button>
          <Logo size="medium" />
        </div>

        <div className={styles.searchBar}>
          <SearchIcon color="#9EA2AD" />
          <input
            type="text"
            placeholder="Search..."
            className={styles.searchInput}
          />
        </div>

        <div className={styles.headerRight}>
          <button className={styles.notificationBtn}>
            <BellIcon color="#4A4A4A" />
          </button>

          <div className={styles.userInfo}>
            <img src={avatar} alt={userName} className={styles.avatar} />
            <div className={styles.userDetails}>
              <span className={styles.userName}>{userName}</span>
              <span className={styles.userRole}>{userRole}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
