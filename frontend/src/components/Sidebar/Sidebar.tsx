import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
import { LogoutModal } from '../Modals/LogoutModal';
import { useAuth } from '../../context';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  badge?: boolean;
}

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

// Close icon for mobile
const CloseIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18" stroke="#4A4A4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 6L18 18" stroke="#4A4A4A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

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

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    await logout();
    navigate('/login');
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  const handleNavClick = () => {
    // Close sidebar on mobile when clicking a nav item
    if (onClose) {
      onClose();
    }
  };

  return (
    <>
    <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <CollapseIcon />
          <span className={styles.headerTitle}>Navigation</span>
          <button className={styles.closeBtn} onClick={onClose}>
            <CloseIcon />
          </button>
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
                  onClick={handleNavClick}
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
                  onClick={handleNavClick}
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
        <button className={styles.logoutBtn} onClick={handleLogoutClick}>
          <LogoutIcon />
          <span>Logout</span>
        </button>
      </div>
    </aside>

    <LogoutModal
      isOpen={showLogoutModal}
      onClose={handleLogoutCancel}
      onConfirm={handleLogoutConfirm}
    />
    </>
  );
};

export default Sidebar;
