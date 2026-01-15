import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context';
import { adminAPI } from '../../../services/api';
import { getRelativeTime } from '../../../utils/dateUtils';
import CreateUserModal from '../../../components/Modals/CreateUserModal';
import EditPermissionsModal from '../../../components/Modals/EditPermissionsModal';
import NotificationDropdown from '../../../components/Notifications/NotificationDropdown';
import GlobalSearch from '../../../components/Search/GlobalSearch';
import './RolesPermissions.css';

interface Role {
  id: string;
  name: string;
  description: string;
  activeUsers: number;
  lastModified: string;
}

const RolesPermission: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRoles: 0,
    restrictedRoles: 0,
    totalUsers: 0,
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<{ id: number; name: string } | null>(null);

  // Get user display name from AuthContext
  const userFullName = `${user?.first_name || user?.firstName || ''} ${user?.last_name || user?.lastName || ''}`.trim() || 'Admin User';

  const handleLogout = async () => {
    await logout();
    navigate('/admin/signin');
  };

  const handleEditPermissions = (roleId: string, roleName: string) => {
    setSelectedRole({ id: parseInt(roleId), name: roleName });
    setShowPermissionsModal(true);
  };

  const handleSavePermissions = async (roleId: number, permissions: string[]) => {
    console.log('Saving permissions for role:', roleId, permissions);
    // TODO: Implement API call to save permissions
    // await adminAPI.updateRolePermissions(roleId, permissions);
  };

  const roleDescriptions: Record<string, string> = {
    'Admin': 'Full system access and user management',
    'Clinician': 'Access to patient charts, encounters, and prescriptions',
    'Patient': 'Access to personal health records and appointments',
    'LabTechnician': 'Lab orders processing and result uploads',
    'Staff': 'General hospital staff access',
  };

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getRoles();
      const rolesArray = Array.isArray(data) ? data : (data?.data || []);

      const transformedRoles = rolesArray.map((role: any) => ({
        id: role.id || `role-${Math.random()}`,
        name: role.name || 'Unknown Role',
        description: roleDescriptions[role.name] || role.description || 'System role',
        activeUsers: role._count?.users || role.userCount || 0,
        // Roles are system defaults and don't have timestamps
        lastModified: role.updated_at ? getRelativeTime(role.updated_at) : 'System Default',
      }));

      setRoles(transformedRoles);

      // Calculate stats
      const totalUsers = transformedRoles.reduce((acc: number, r: Role) => acc + r.activeUsers, 0);
      const restrictedRoles = transformedRoles.filter((r: Role) =>
        ['Admin', 'LabTechnician'].includes(r.name)
      ).length;

      setStats({
        totalRoles: transformedRoles.length,
        restrictedRoles,
        totalUsers,
      });
    } catch (error) {
      console.error('Error fetching roles:', error);
      // Set default roles if API fails
      setRoles([
        { id: '1', name: 'Admin', description: 'Full system access', activeUsers: 0, lastModified: 'System Default' },
        { id: '2', name: 'Clinician', description: 'Patient care access', activeUsers: 0, lastModified: 'System Default' },
        { id: '3', name: 'Patient', description: 'Personal health records', activeUsers: 0, lastModified: 'System Default' },
        { id: '4', name: 'LabTechnician', description: 'Lab access', activeUsers: 0, lastModified: 'System Default' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const filteredRoles = roles.filter((role) =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase())
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
              <button className="nav-item" onClick={() => navigate('/admin/user-management')}>
                <img src="/images/group.png" alt="" className="nav-icon" />
                <span>User Management</span>
              </button>
              <button className="nav-item active">
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
          <div className="roles-permission-inner">
            {/* PAGE HEADER */}
            <div className="rp-page-header">
              <div className="rp-header-text">
                <h1>Roles and Permissions</h1>
                <p>Manage hospital staff accounts, roles, and system access levels.</p>
              </div>
              <button className="create-user-btn" onClick={() => setShowCreateModal(true)}>Create New User</button>
            </div>

            {/* STATS CARDS - MOVED TO TOP */}
            <div className="rp-stats-grid">
              <div className="rp-stat-card blue-card">
                <div className="stat-icon-wrapper">
                  <img src="/images/paste-clipboard.png" alt="Total Roles" className="stat-icon-img" />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Total Roles</div>
                  <div className="stat-value">{loading ? '...' : String(stats.totalRoles).padStart(2, '0')}</div>
                  <div className="stat-detail">{stats.totalUsers} registered users</div>
                </div>
              </div>

              <div className="rp-stat-card orange-card">
                <div className="stat-icon-wrapper">
                  <img src="/images/healthcare.png" alt="Restricted Roles" className="stat-icon-img" />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Restricted Roles</div>
                  <div className="stat-value">{loading ? '...' : String(stats.restrictedRoles).padStart(2, '0')}</div>
                  <div className="stat-detail">High level clearance needed</div>
                </div>
              </div>

              <div className="rp-stat-card purple-card">
                <div className="stat-icon-wrapper">
                  <img src="/images/walking.png" alt="Active Users" className="stat-icon-img" />
                </div>
                <div className="stat-content">
                  <div className="stat-label">Active Users</div>
                  <div className="stat-value">{loading ? '...' : stats.totalUsers}</div>
                  <div className="stat-detail">Across all roles</div>
                </div>
              </div>
            </div>

            {/* ROLES TABLE */}
            <div className="rp-table-container">
              <div className="rp-table-header">
                <h2>All Roles</h2>
                <div className="rp-search">
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

              <div className="rp-table">
                <div className="rp-table-head">
                  <div className="rp-th role-name-col">Role Name</div>
                  <div className="rp-th description-col">Description</div>
                  <div className="rp-th active-users-col">Active Users</div>
                  <div className="rp-th last-modified-col">Last Modified</div>
                  <div className="rp-th actions-col">Actions</div>
                </div>

                <div className="rp-table-body">
                  {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                      Loading roles...
                    </div>
                  ) : filteredRoles.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                      No roles found.
                    </div>
                  ) : (
                    filteredRoles.map((role) => (
                      <div key={role.id} className="rp-table-row">
                        <div className="rp-td role-name-col">
                          <span className="role-name">{role.name}</span>
                        </div>
                        <div className="rp-td description-col">
                          <span className="role-description">{role.description}</span>
                        </div>
                        <div className="rp-td active-users-col">
                          <span className="active-users-badge">{String(role.activeUsers).padStart(2, '0')}</span>
                        </div>
                        <div className="rp-td last-modified-col">
                          <span className="last-modified-text">{role.lastModified}</span>
                        </div>
                        <div className="rp-td actions-col">
                          <button
                            className="edit-permissions-btn"
                            onClick={() => handleEditPermissions(role.id, role.name)}
                          >
                            Edit Permissions
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          fetchRoles();
          setShowCreateModal(false);
        }}
      />

      {/* Edit Permissions Modal */}
      {selectedRole && (
        <EditPermissionsModal
          isOpen={showPermissionsModal}
          onClose={() => {
            setShowPermissionsModal(false);
            setSelectedRole(null);
          }}
          roleName={selectedRole.name}
          roleId={selectedRole.id}
          onSave={handleSavePermissions}
        />
      )}
    </div>
  );
};

export default RolesPermission;