import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import styles from './ClinicianDashboardLayout.module.css';
import { ClinicianSidebar } from '../../components/ClinicianSidebar';

export const ClinicianDashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className={styles.layout}>
      {/* Top bar */}
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <img
            src="/images/citycare-logo-icon.png"
            alt="CityCare Logo"
            className={styles.logoImage}
          />
          <span className={styles.brandName}>CityCare</span>
        </div>

        <div className={styles.search}>
          <span className={styles.searchIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path
                d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm6.2-1.1 4.3 4.3"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <input className={styles.searchInput} placeholder="Search..." />
        </div>

        <div className={styles.topRight}>
          <button
            className={styles.menuBtn}
            type="button"
            aria-label="Toggle menu"
            onClick={toggleSidebar}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          <button
            className={styles.iconBtn}
            type="button"
            aria-label="Notifications"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </button>

          <div className={styles.user}>
            <div className={styles.avatar}>
              <img
                className={styles.avatarImg}
                src="/images/justin.jpg"
                alt="Peter Parker"
              />
            </div>

            <div className={styles.userMeta}>
              <div className={styles.userName}>Peter Parker</div>
              <div className={styles.userRole}>Clinician</div>
            </div>
          </div>
        </div>
      </header>

      <div className={styles.body}>
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className={styles.overlay} onClick={closeSidebar} />
        )}

        <ClinicianSidebar isOpen={sidebarOpen} onClose={closeSidebar} />

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ClinicianDashboardLayout;
