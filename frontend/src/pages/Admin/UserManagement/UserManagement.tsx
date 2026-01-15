import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context';
import { adminAPI } from '../../../services/api';
import { getRelativeTime } from '../../../utils/dateUtils';
import CreateUserModal from '../../../components/Modals/CreateUserModal';
import NotificationDropdown from '../../../components/Notifications/NotificationDropdown';
import GlobalSearch from '../../../components/Search/GlobalSearch';
import './UserManagement.css';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  lastActivity: string;
  isActive: boolean;
}

type TabType = 'all' | 'active' | 'inactive';

const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const itemsPerPage = 10;

  // Get user display name from AuthContext
  const userFullName = `${user?.first_name || user?.firstName || ''} ${user?.last_name || user?.lastName || ''}`.trim() || 'Admin User';

  const handleLogout = async () => {
    await logout();
    navigate('/admin/signin');
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getUsers();
      const usersArray = Array.isArray(data) ? data : (data?.data || []);

      const transformedUsers = usersArray.map((u: any) => ({
        id: u.id || `user-${Math.random()}`,
        name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || 'Unknown User',
        email: u.email || 'No email',
        role: u.roles?.name || u.role || 'User',
        status: u.is_active ? 'Active' : 'Inactive',
        lastActivity: getRelativeTime(u.updated_at || u.created_at),
        isActive: u.is_active ?? true,
      }));

      setUsers(transformedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    setUpdating(userId);
    try {
      await adminAPI.updateUserStatus(userId, !currentStatus);
      await fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status. Please try again.');
    } finally {
      setUpdating(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'active') return matchesSearch && u.status === 'Active';
    if (activeTab === 'inactive') return matchesSearch && u.status === 'Inactive';
    return matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
              <button className="nav-item" onClick={() => navigate('/admin/dashboard')}>
                <svg className="nav-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="9 22 9 12 15 12 15 22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Dashboard</span>
              </button>
              <button className="nav-item active">
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

        {/* MAIN CONTENT */}
        <main className="main-content">
          <div className="user-management-inner">
            {/* PAGE HEADER */}
            <div className="um-page-header">
              <div className="um-header-text">
                <h1>User Management</h1>
                <p>Manage hospital staff accounts, roles, and system access levels.</p>
              </div>
              <button className="create-user-btn" onClick={() => setShowCreateModal(true)}>Create New User</button>
            </div>

            {/* TABS */}
            <div className="um-tabs">
              <button
                className={`um-tab ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
              >
                All Users ({users.length})
              </button>
              <button
                className={`um-tab ${activeTab === 'active' ? 'active' : ''}`}
                onClick={() => { setActiveTab('active'); setCurrentPage(1); }}
              >
                Active ({users.filter(u => u.status === 'Active').length})
              </button>
              <button
                className={`um-tab ${activeTab === 'inactive' ? 'active' : ''}`}
                onClick={() => { setActiveTab('inactive'); setCurrentPage(1); }}
              >
                Inactive ({users.filter(u => u.status === 'Inactive').length})
              </button>
            </div>

            {/* USER TABLE */}
            <div className="um-table-container">
              <div className="um-table-header">
                <h2>All Staff</h2>
                <div className="um-search">
                  <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                    <circle cx="9" cy="9" r="6" stroke="#9ca3af" strokeWidth="2" />
                    <path
                      d="M13.5 13.5L17 17"
                      stroke="#9ca3af"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="um-table">
                <div className="um-table-head">
                  <div className="um-th user-details-col">User Details</div>
                  <div className="um-th department-col">Role</div>
                  <div className="um-th status-col">Status</div>
                  <div className="um-th activity-col">Last Activity</div>
                  <div className="um-th actions-col">Actions</div>
                </div>

                <div className="um-table-body">
                  {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                      Loading users...
                    </div>
                  ) : paginatedUsers.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                      No users found.
                    </div>
                  ) : (
                    paginatedUsers.map((u) => (
                      <div key={u.id} className={`um-table-row ${u.status.toLowerCase()}`}>
                        <div className="um-td user-details-col">
                          <div>
                            <span className="user-name">{u.name}</span>
                            <small style={{ display: 'block', color: '#666', fontSize: '12px' }}>{u.email}</small>
                          </div>
                        </div>
                        <div className="um-td department-col">
                          <span className="department-text">{u.role}</span>
                        </div>
                        <div className="um-td status-col">
                          <span className={`status-badge ${u.status.toLowerCase()}`}>
                            {u.status}
                          </span>
                        </div>
                        <div className="um-td activity-col">
                          <span className="activity-text">{u.lastActivity}</span>
                        </div>
                        <div className="um-td actions-col">
                          <button
                            className={`toggle-status-btn ${u.isActive ? 'deactivate' : 'activate'}`}
                            onClick={() => handleToggleStatus(u.id, u.isActive)}
                            disabled={updating === u.id}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '12px',
                              backgroundColor: u.isActive ? '#fee2e2' : '#dcfce7',
                              color: u.isActive ? '#dc2626' : '#16a34a',
                            }}
                          >
                            {updating === u.id ? '...' : (u.isActive ? 'Deactivate' : 'Activate')}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Pagination */}
              {filteredUsers.length > itemsPerPage && (
                <div className="um-table-footer" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', padding: '16px' }}>
                  <button
                    className="view-more-btn"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
                  >
                    Previous
                  </button>
                  <span style={{ color: '#666' }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    className="view-more-btn"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    style={{ opacity: currentPage >= totalPages ? 0.5 : 1 }}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          fetchUsers();
          setShowCreateModal(false);
        }}
      />
    </div>
  );
};

export default UserManagement;