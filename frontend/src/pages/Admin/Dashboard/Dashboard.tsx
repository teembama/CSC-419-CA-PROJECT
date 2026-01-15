import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context';
import { adminAPI } from '../../../services/api';
import { getRelativeTime, formatDate } from '../../../utils/dateUtils';
import NotificationDropdown from '../../../components/Notifications/NotificationDropdown';
import GlobalSearch from '../../../components/Search/GlobalSearch';
import './Dashboard.css';

interface StatCard {
  title: string;
  value: string | number;
  change: string;
  icon: string;
  bgColor: string;
  changeColor: string;
}

interface Activity {
  id: string;
  title: string;
  description: string;
  time: string;
}

interface VerificationItem {
  id: string;
  name: string;
  email: string;
  role: string;
  color: string;
  createdAt: string;
}

interface DashboardStats {
  totalUsers: number;
  activeClinicians: number;
  activePatients: number;
  pendingVerifications: number;
}

// Helper function to convert technical action to readable text
const formatActivityAction = (action: string, tableName: string): string => {
  const tableActions: Record<string, Record<string, string>> = {
    users: { INSERT: 'New user registered', UPDATE: 'User profile updated', DELETE: 'User account deleted' },
    appt_bookings: { INSERT: 'Appointment booked', UPDATE: 'Appointment updated', DELETE: 'Appointment cancelled' },
    lab_orders: { INSERT: 'Lab order created', UPDATE: 'Lab order updated', DELETE: 'Lab order cancelled' },
    lab_results: { INSERT: 'Lab results submitted', UPDATE: 'Lab results updated', DELETE: 'Lab results removed' },
    patient_prescriptions: { INSERT: 'Prescription issued', UPDATE: 'Prescription updated', DELETE: 'Prescription cancelled' },
    patient_encounters: { INSERT: 'Patient encounter started', UPDATE: 'Encounter notes updated', DELETE: 'Encounter closed' },
    billing_invoices: { INSERT: 'Invoice generated', UPDATE: 'Payment status updated', DELETE: 'Invoice voided' },
  };
  return tableActions[tableName]?.[action] || `${action} on ${tableName.replace(/_/g, ' ')}`;
};

// Helper function to format activity description
const formatActivityDescription = (tableName: string, newData: any, userName: string): string => {
  if (!newData) return `By ${userName}`;

  if (tableName === 'users' && newData.email) {
    return `${newData.email} - by ${userName}`;
  }
  if (tableName === 'users' && newData.first_name) {
    return `${newData.first_name} ${newData.last_name || ''} - by ${userName}`;
  }
  if (newData.status) {
    return `Status: ${newData.status} - by ${userName}`;
  }
  if (newData.medication) {
    return `${newData.medication} - by ${userName}`;
  }
  return `By ${userName}`;
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeClinicians: 0,
    activePatients: 0,
    pendingVerifications: 0,
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [verificationQueue, setVerificationQueue] = useState<VerificationItem[]>([]);

  // Get user display name
  const userName = user?.first_name || user?.firstName || 'Admin';
  const userFullName = `${user?.first_name || user?.firstName || ''} ${user?.last_name || user?.lastName || ''}`.trim() || 'Admin User';

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch dashboard stats
        const data = await adminAPI.getDashboardStats();
        if (data) {
          setDashboardStats({
            totalUsers: data.totalUsers || 0,
            activeClinicians: data.activeClinicians || 0,
            activePatients: data.activePatients || 0,
            pendingVerifications: data.pendingVerifications || 0,
          });
        }

        // Fetch recent activity (audit logs)
        try {
          const logsData = await adminAPI.getRecentActivity();
          const logsArray = Array.isArray(logsData) ? logsData : (logsData?.data || []);
          const transformedActivities = logsArray.slice(0, 5).map((log: any) => {
            const userName = log.users
              ? `${log.users.first_name || ''} ${log.users.last_name || ''}`.trim()
              : 'System';

            return {
              id: log.id ? String(log.id) : `activity-${Math.random()}`,
              title: formatActivityAction(log.action, log.table_name),
              description: formatActivityDescription(log.table_name, log.new_data, userName),
              time: getRelativeTime(log.changed_at || log.created_at || new Date().toISOString()),
            };
          });
          setActivities(transformedActivities);
        } catch (error) {
          console.error('Error fetching activities:', error);
          // Set default activities if API fails
          setActivities([
            { id: '1', title: 'System Started', description: 'Dashboard loaded successfully', time: 'Just now' }
          ]);
        }

        // Fetch pending verifications
        try {
          const pendingData = await adminAPI.getPendingVerifications();
          const pendingArray = Array.isArray(pendingData) ? pendingData : (pendingData?.data || []);
          const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
          const transformedQueue = pendingArray.slice(0, 5).map((user: any, index: number) => ({
            id: user.id || `verify-${Math.random()}`,
            name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Unknown User',
            email: user.email || 'No email',
            role: user.roles?.name || user.role || 'User',
            color: colors[index % colors.length],
            createdAt: formatDate(user.created_at),
          }));
          setVerificationQueue(transformedQueue);
        } catch (error) {
          console.error('Error fetching verification queue:', error);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats: StatCard[] = [
    {
      title: 'Total Users',
      value: dashboardStats.totalUsers.toLocaleString(),
      change: '',
      icon: '/images/paste-clipboard.png',
      bgColor: '#dbeafe',
      changeColor: '#10b981',
    },
    {
      title: 'Active Clinicians',
      value: dashboardStats.activeClinicians.toLocaleString(),
      change: '',
      icon: '/images/healthcare.png',
      bgColor: '#fed7aa',
      changeColor: '#10b981',
    },
    {
      title: 'Active Patients',
      value: dashboardStats.activePatients.toLocaleString(),
      change: '',
      icon: '/images/walking.png',
      bgColor: '#e9d5ff',
      changeColor: '#10b981',
    },
    {
      title: 'Pending Verifications',
      value: dashboardStats.pendingVerifications,
      change: dashboardStats.pendingVerifications > 0 ? 'Action Required' : 'All Clear',
      icon: '/images/warning-square.png',
      bgColor: dashboardStats.pendingVerifications > 0 ? '#fee2e2' : '#dcfce7',
      changeColor: dashboardStats.pendingVerifications > 0 ? '#ef4444' : '#10b981',
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/admin/signin');
  };

  const handleVerifyUser = async (userId: string) => {
    try {
      await adminAPI.updateUserStatus(userId, true);
      // Refresh verification queue
      setVerificationQueue(prev => prev.filter(v => v.id !== userId));
      setDashboardStats(prev => ({
        ...prev,
        pendingVerifications: Math.max(0, prev.pendingVerifications - 1),
      }));
    } catch (error) {
      console.error('Error verifying user:', error);
      alert('Failed to verify user. Please try again.');
    }
  };

  return (
    <div className="dashboard-container">
      {/* HEADER */}
      <header className="dashboard-header">
        <div className="logo">
          <img
            src="/images/citycare-logo-icon.png"
            alt="CityCare"
            className="logo-image"
          />
          <span className="logo-text logo-gradient">CityCare</span>
        </div>

        <GlobalSearch userRole="admin" placeholder="Search..." />

        <div className="header-right">
          <NotificationDropdown userRole="admin" />

          <div className="header-profile">
            <img src="/images/avatar.png" alt={userFullName} />
            <div className="profile-info">
              <strong>{userFullName}</strong>
              <span>Admin</span>
            </div>
          </div>
        </div>
      </header>

      {/* BODY */}
      <div className="dashboard-layout">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <div className="sidebar-box">
            <div className="sidebar-header">
              <div className="sidebar-header-panel">
                <img
                  src="/images/sidebar-collapse.png"
                  alt=""
                  className="sidebar-collapse"
                />
                <h3 className="sidebar-title">Navigation</h3>
              </div>
            </div>

            <div className="nav-section">
              <span className="section-label">Main</span>
              <button className="nav-item active">
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="9 22 9 12 15 12 15 22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Dashboard</span>
              </button>
              <button className="nav-item" onClick={() => navigate('/admin/user-management')}>
                <img src="/images/group.png" alt="" className="nav-icon" />
                <span>User Management</span>
              </button>
              <button className="nav-item" onClick={() => navigate('/admin/roles-permissions')}>
                <img src="/images/user-badge-check.png" alt="" className="nav-icon" />
                <span>Roles and Permissions</span>
              </button>
              <button className="nav-item" onClick={() => navigate('/admin/audit-logs')}>
                <img src="/images/clock-rotate-right.png" alt="" className="nav-icon" />
                <span>Audit Logs</span>
              </button>
            </div>

            <div className="nav-section">
              <span className="section-label">Secondary</span>
              <button className="nav-item" onClick={() => navigate('/admin/profile')}>
                <img src="/images/profile.png" alt="" className="nav-icon" />
                <span>Profile</span>
              </button>
            </div>

            <button className="logout" onClick={handleLogout}>
              <img src="/images/log-out.png" alt="" className="nav-icon" />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <main className="main-content">
          <div className="dashboard-inner">
            <div className="page-header">
              <h1>Dashboard</h1>
              <p>
                Welcome back, {userName}. You have <span className="highlight">{dashboardStats.pendingVerifications} pending verifications</span> today.
              </p>
            </div>

            {/* STATS GRID */}
            <div className="stats-grid">
              {stats.map((s, i) => (
                <div key={i} className="stat-card">
                  <div className="stat-header">
                    <small>{s.title}</small>
                    {s.change && (
                      <span
                        className="stat-change"
                        style={{ color: s.changeColor, fontSize: '11px' }}
                      >
                        {s.change}
                      </span>
                    )}
                  </div>

                  <div className="stat-body">
                    <div
                      className="stat-icon"
                      style={{ background: s.bgColor }}
                    >
                      <img
                        src={s.icon}
                        alt={s.title}
                        className="stat-icon-img"
                      />
                    </div>

                    <h2>{loading ? '...' : s.value}</h2>
                  </div>
                </div>
              ))}
            </div>

            {/* CONTENT GRID */}
            <div className="content-grid">
              <section className="activity-section">
                <div className="section-header">
                  <h2>Recent System Activity</h2>
                  <button
                    className="view-all-link"
                    onClick={() => navigate('/admin/audit-logs')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }}
                  >
                    View All Audit Logs
                  </button>
                </div>

                <div className="activity-list">
                  {activities.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                      No recent activity found.
                    </div>
                  ) : (
                    activities.map((a) => (
                      <div key={a.id} className="activity-item">
                        <div className="activity-content">
                          <strong>{a.title}</strong>
                          <p>{a.description}</p>
                        </div>
                        <span className="activity-time">{a.time}</span>
                      </div>
                    ))
                  )}
                  <div className="activity-spacer" />
                </div>
              </section>

              <section className="verification-section">
                <div style={{ marginBottom: '12px' }}>
                  <h2>Verification Queue</h2>
                  <p style={{ fontSize: '12px', color: '#666', margin: '4px 0 0 0' }}>
                    New user accounts pending activation
                  </p>
                </div>

                <div className="verification-list">
                  {verificationQueue.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                      No pending verifications.
                    </div>
                  ) : (
                    verificationQueue.map((v) => (
                      <div key={v.id} className="verify-row">
                        <div className="verify-info">
                          <span className="avatar" style={{ background: v.color }}>
                            {v.name.charAt(0).toUpperCase()}
                          </span>
                          <div>
                            <strong>{v.name}</strong>
                            <small>{v.role}</small>
                          </div>
                        </div>
                        <button
                          className="verify-btn"
                          onClick={() => handleVerifyUser(v.id)}
                        >
                          Verify
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <button
                  className="primary-btn"
                  onClick={() => navigate('/admin/user-management')}
                >
                  View Full Queue
                </button>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
