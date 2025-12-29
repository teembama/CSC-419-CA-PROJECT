import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './Sidebar.module.css';
import {
  HomeIcon,
  CalendarIcon,
  ArchiveIcon,
  DocumentIcon,
  LabIcon,
  CreditCardIcon,
  ProfileIcon,
  HelpIcon,
  LogoutIcon,
  CollapseIcon,
} from '../Icons';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  badge?: boolean;
}

const mainNavItems: NavItem[] = [
  { path: '/', label: 'Home', icon: <HomeIcon /> },
  { path: '/appointments', label: 'Appointments', icon: <CalendarIcon /> },
  { path: '/medical-records', label: 'Medical Records', icon: <ArchiveIcon /> },
  { path: '/prescriptions', label: 'Prescriptions', icon: <DocumentIcon /> },
  { path: '/lab-results', label: 'Lab Results', icon: <LabIcon /> },
  { path: '/billing', label: 'Billing', icon: <CreditCardIcon />, badge: true },
];

const secondaryNavItems: NavItem[] = [
  { path: '/profile', label: 'Profile', icon: <ProfileIcon /> },
  { path: '/help', label: 'Help / Support', icon: <HelpIcon /> },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <CollapseIcon />
          <span className={styles.headerTitle}>Navigation</span>
        </div>
      </div>

      <nav className={styles.nav}>
        <div className={styles.navSection}>
          <span className={styles.sectionTitle}>Main</span>
          <ul className={styles.navList}>
            {mainNavItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                  }
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span className={styles.navLabel}>{item.label}</span>
                  {item.badge && <span className={styles.badge} />}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.navSection}>
          <span className={styles.sectionTitle}>Secondary</span>
          <ul className={styles.navList}>
            {secondaryNavItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
                  }
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span className={styles.navLabel}>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className={styles.footer}>
        <button className={styles.logoutBtn}>
          <LogoutIcon />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
