import React from 'react';
import styles from './Header.module.css';
import { Logo } from '../Logo/Logo';
import { SearchIcon, BellIcon } from '../Icons';
import avatar from '../../assets/avatar.png';

interface HeaderProps {
  userName?: string;
  userRole?: string;
}

export const Header: React.FC<HeaderProps> = ({
  userName = 'John Doe',
  userRole = 'Patient',
}) => {
  return (
    <header className={styles.header}>
      <div className={styles.headerContent}>
        <Logo size="medium" />

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
