import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import styles from './DashboardLayout.module.css';
import { Header, Sidebar } from '../../components';
import { useAuth } from '../../context';

export const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const userName = user ? `${user.first_name} ${user.last_name}` : 'User';
  const userRole = user?.roles?.name || 'Patient';

  return (
    <div className={styles.layout}>
      <Header onMenuClick={toggleSidebar} userName={userName} userRole={userRole} />
      <div className={styles.main}>
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className={styles.overlay} onClick={closeSidebar} />
        )}
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
