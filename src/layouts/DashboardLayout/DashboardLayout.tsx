import React from 'react';
import { Outlet } from 'react-router-dom';
import styles from './DashboardLayout.module.css';
import { Header, Sidebar } from '../../components';

export const DashboardLayout: React.FC = () => {
  return (
    <div className={styles.layout}>
      <Header />
      <div className={styles.main}>
        <Sidebar />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
