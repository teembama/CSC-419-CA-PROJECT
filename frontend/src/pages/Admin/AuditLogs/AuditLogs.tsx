import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context';
import { adminAPI } from '../../../services/api';
import { formatDateTime } from '../../../utils/dateUtils';
import NotificationDropdown from '../../../components/Notifications/NotificationDropdown';
import GlobalSearch from '../../../components/Search/GlobalSearch';
import './AuditLogs.css';

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  affectedResource: string;
  actionType: string;
}

const AuditLogs: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [userRole, setUserRole] = useState('all');
  const [actionType, setActionType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get user display name from AuthContext
  const userFullName = `${user?.first_name || user?.firstName || ''} ${user?.last_name || user?.lastName || ''}`.trim() || 'Admin User';

  const handleLogout = async () => {
    await logout();
    navigate('/admin/signin');
  };

  // Helper function to convert technical action to readable text
  const formatAction = (action: string, tableName: string, newData: any): string => {
    const tableActions: Record<string, Record<string, string>> = {
      auth: {
        LOGIN: 'User logged in',
        LOGOUT: 'User logged out',
      },
      users: {
        INSERT: 'Created new user account',
        UPDATE: 'Updated user profile',
        DELETE: 'Deleted user account',
      },
      appt_bookings: {
        INSERT: 'Booked new appointment',
        UPDATE: 'Updated appointment status',
        DELETE: 'Cancelled appointment',
      },
      appt_slots: {
        INSERT: 'Created appointment slot',
        UPDATE: 'Updated appointment slot',
        DELETE: 'Removed appointment slot',
      },
      lab_orders: {
        INSERT: 'Created lab order',
        UPDATE: 'Updated lab order status',
        DELETE: 'Cancelled lab order',
      },
      lab_results: {
        INSERT: 'Submitted lab results',
        UPDATE: 'Updated lab results',
        DELETE: 'Removed lab results',
      },
      lab_test_items: {
        INSERT: 'Added lab test',
        UPDATE: 'Updated lab test',
        DELETE: 'Removed lab test',
      },
      patient_prescriptions: {
        INSERT: 'Issued prescription',
        UPDATE: 'Updated prescription',
        DELETE: 'Cancelled prescription',
      },
      patient_encounters: {
        INSERT: 'Started patient encounter',
        UPDATE: 'Updated encounter notes',
        DELETE: 'Closed encounter',
      },
      patient_charts: {
        INSERT: 'Created patient chart',
        UPDATE: 'Updated patient chart',
        DELETE: 'Removed patient chart',
      },
      patient_notes_soap: {
        INSERT: 'Added clinical notes',
        UPDATE: 'Updated clinical notes',
        DELETE: 'Removed clinical notes',
      },
      billing_invoices: {
        INSERT: 'Generated invoice',
        UPDATE: 'Updated payment status',
        DELETE: 'Voided invoice',
      },
      billing_line_items: {
        INSERT: 'Added billing item',
        UPDATE: 'Updated billing item',
        DELETE: 'Removed billing item',
      },
    };

    const defaultActions: Record<string, string> = {
      INSERT: 'Created record',
      UPDATE: 'Updated record',
      DELETE: 'Deleted record',
    };

    // Try to get specific action text, fallback to default
    const tableSpecific = tableActions[tableName]?.[action];
    if (tableSpecific) return tableSpecific;

    return defaultActions[action] || action;
  };

  // Helper function to convert table name to readable resource
  const formatResource = (tableName: string, newData: any): string => {
    const resourceNames: Record<string, string> = {
      auth: 'Authentication',
      users: 'User Account',
      appt_bookings: 'Appointment',
      appt_slots: 'Appointment Slot',
      lab_orders: 'Lab Order',
      lab_results: 'Lab Results',
      lab_test_items: 'Lab Test',
      patient_prescriptions: 'Prescription',
      patient_encounters: 'Patient Encounter',
      patient_charts: 'Patient Chart',
      patient_allergies: 'Patient Allergy',
      patient_notes_soap: 'Clinical Notes',
      billing_invoices: 'Invoice',
      billing_line_items: 'Billing Item',
      roles: 'User Role',
    };

    const baseName = resourceNames[tableName] || tableName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    // Special handling for auth events - show role and email
    if (tableName === 'auth' && newData) {
      const role = newData.role || 'User';
      const email = newData.email || '';
      return `${role} Session (${email})`;
    }

    // Add context from newData if available
    if (newData) {
      if (newData.email) return `${baseName} (${newData.email})`;
      if (newData.first_name && newData.last_name) return `${baseName} (${newData.first_name} ${newData.last_name})`;
      if (newData.patient) return `${baseName} - ${newData.patient}`;
      if (newData.medication) return `${baseName} - ${newData.medication}`;
      if (newData.test) return `${baseName} - ${newData.test}`;
      if (newData.status) return `${baseName} → ${newData.status}`;
    }

    return baseName;
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getAuditLogs();
      const logsArray = Array.isArray(data) ? data : (data?.data || []);

      const transformedLogs = logsArray.map((log: any) => {
        // Get user name from the nested users object
        const userName = log.users
          ? `${log.users.first_name || ''} ${log.users.last_name || ''}`.trim()
          : (log.changed_by ? `User ${String(log.changed_by).slice(0, 8)}...` : 'System');

        // Format action and resource to be human-readable
        const readableAction = formatAction(log.action, log.table_name, log.new_data);
        const readableResource = formatResource(log.table_name, log.new_data);

        return {
          id: log.id ? String(log.id) : `log-${Math.random()}`,
          timestamp: formatDateTime(log.changed_at || log.created_at || new Date().toISOString()),
          user: userName || 'System',
          action: readableAction,
          affectedResource: readableResource,
          actionType: log.action || 'System',
        };
      });

      setLogs(transformedLogs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.affectedResource.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesAction = actionType === 'all' || log.actionType === actionType;

    return matchesSearch && matchesAction;
  });

  // Get unique action types for filter dropdown
  const actionTypes = ['all', ...new Set(logs.map(l => l.actionType))];

  // Pagination
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const resetFilters = () => {
    setUserRole('all');
    setActionType('all');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const exportLogs = () => {
    const headers = ['Timestamp', 'User', 'Action', 'Affected Resource'];
    const csvRows = [headers.join(',')];

    filteredLogs.forEach(log => {
      const row = [
        `"${log.timestamp}"`,
        `"${log.user}"`,
        `"${log.action}"`,
        `"${log.affectedResource}"`,
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
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
              <button className="nav-item" onClick={() => navigate('/admin/roles-permissions')}>
                <img src="/images/user-badge-check.png" alt="" className="nav-icon" />
                <span>Roles and Permissions</span>
              </button>
              <button className="nav-item active">
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
          <div className="audit-logs-inner">
            {/* PAGE HEADER */}
            <div className="al-page-header">
              <div className="al-header-text">
                <h1>Audit Logs</h1>
                <p>Review comprehensive system activity and security logs for compliance and monitoring.</p>
              </div>
              <button className="export-logs-btn" onClick={exportLogs}>Export Logs</button>
            </div>

            {/* FILTERS */}
            <div className="al-filters">
              <div className="filter-group">
                <label className="filter-label">User Role</label>
                <div className="filter-select-wrapper">
                  <select
                    className="filter-select"
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value)}
                  >
                    <option value="all">All</option>
                    <option value="Admin">Admin</option>
                    <option value="Clinician">Clinician</option>
                    <option value="Patient">Patient</option>
                    <option value="LabTechnician">Lab Technician</option>
                  </select>
                  <svg className="select-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              <div className="filter-group">
                <label className="filter-label">Action Type</label>
                <div className="filter-select-wrapper">
                  <select
                    className="filter-select"
                    value={actionType}
                    onChange={(e) => { setActionType(e.target.value); setCurrentPage(1); }}
                  >
                    {actionTypes.map(type => (
                      <option key={type} value={type}>
                        {type === 'all' ? 'All Actions' : type}
                      </option>
                    ))}
                  </select>
                  <svg className="select-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>

              <button className="reset-filters-btn" onClick={resetFilters}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M14 8c0 3.314-2.686 6-6 6s-6-2.686-6-6 2.686-6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M8 2V0M8 2L6 4M8 2l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Reset Filters
              </button>
            </div>

            {/* TABLE CONTAINER */}
            <div className="al-table-container">
              <div className="al-table-header">
                <h2>All Staff</h2>
                <div className="al-search">
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

              <div className="al-table">
                <div className="al-table-head">
                  <div className="al-th timestamp-col-head">Timestamp</div>
                  <div className="al-th user-col-head">User</div>
                  <div className="al-th action-col-head">Action Performed</div>
                  <div className="al-th resource-col-head">Affected Resource</div>
                </div>

                <div className="al-table-body">
                  {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                      Loading audit logs...
                    </div>
                  ) : paginatedLogs.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                      No logs found.
                    </div>
                  ) : (
                    paginatedLogs.map((log) => (
                      <div key={log.id} className="al-table-row">
                        <div className="al-td timestamp-col">
                          <span className="timestamp-text">{log.timestamp}</span>
                        </div>
                        <div className="al-td user-col">
                          <span className="user-text">{log.user}</span>
                        </div>
                        <div className="al-td action-col">
                          <span className={`action-badge ${log.actionType.toLowerCase().replace(/\s+/g, '-')}`}>
                            {log.action}
                          </span>
                        </div>
                        <div className="al-td resource-col">
                          <span className="resource-text">{log.affectedResource}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Pagination */}
              {filteredLogs.length > itemsPerPage && (
                <div className="al-table-footer" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', padding: '16px' }}>
                  <button
                    className="view-more-btn"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
                  >
                    Previous
                  </button>
                  <span style={{ color: '#666' }}>
                    Page {currentPage} of {totalPages} ({filteredLogs.length} logs)
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
    </div>
  );
};

export default AuditLogs;