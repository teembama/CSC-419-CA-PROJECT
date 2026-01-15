import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context';
import { labAPI } from '../../../services/api';
import { formatTime, formatShortDate } from '../../../utils/dateUtils';
import NotificationDropdown from '../../../components/Notifications/NotificationDropdown';
import GlobalSearch from '../../../components/Search/GlobalSearch';
import '../Dashboard/Dashboard.css';
import './LabOrders.css';

interface Order {
  id: string;
  timeReceived: string;
  orderId: string;
  patientName: string;
  testType: string;
  priority: 'Urgent' | 'Routine' | 'Stat';
  status: string;
  date: string;
  action: string;
  rawStatus: string;
}

const LabOrders: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [priorityFilter, setPriorityFilter] = useState('All Priorities');
  const [currentPage, setCurrentPage] = useState(1);
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const itemsPerPage = 10;

  // Get user display name from AuthContext
  const userFullName = `${user?.first_name || user?.firstName || ''} ${user?.last_name || user?.lastName || ''}`.trim() || 'Lab Technician';

  // Status mapping
  const statusMap: Record<string, string> = {
    'Ordered': 'Pending',
    'In Progress': 'In Progress',
    'Completed': 'Completed',
    'Cancelled': 'Cancelled',
    'Pending': 'Pending',
    'InProgress': 'In Progress'
  };

  const fetchLabOrders = async () => {
    try {
      setLoading(true);
      const labOrders = await labAPI.getOrders().catch(() => []);
      const ordersArray = Array.isArray(labOrders) ? labOrders : [];

      // Transform orders for display
      const transformedOrders = ordersArray.map((order: any) => {
        // Patient info comes from chart.patient in the API response
        const patient = order.chart?.patient || order.patient_encounters?.patient_charts?.users;
        const patientName = patient
          ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim()
          : 'Unknown Patient';

        // Test type from testItems array or lab_test_items
        const testType = order.testItems?.[0]?.testName || order.lab_test_items?.[0]?.test_name || 'Lab Test';

        // Use createdAt from backend (encounter date) or created_at fallback
        const createdAt = order.createdAt || order.created_at;
        const timeReceived = formatTime(createdAt);
        const date = formatShortDate(createdAt);
        const orderId = order.id ? `#LAB-${order.id.slice(0, 4).toUpperCase()}` : 'N/A';

        const displayStatus = statusMap[order.status] || order.status || 'Pending';
        const action = displayStatus === 'Pending' || displayStatus === 'Ordered'
          ? 'Start Test'
          : displayStatus === 'In Progress'
            ? 'Complete'
            : 'View';

        return {
          id: order.id || `temp-${Math.random()}`,
          timeReceived,
          orderId,
          patientName,
          testType,
          priority: order.priority === 'STAT' ? 'Urgent' : order.priority || 'Routine',
          status: displayStatus,
          rawStatus: order.status,
          date,
          action,
        };
      });

      setAllOrders(transformedOrders);
      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error fetching lab orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabOrders();
  }, []);

  // Filter orders when filters change
  useEffect(() => {
    let filtered = [...allOrders];

    // Filter by status
    if (statusFilter !== 'All Statuses') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Filter by priority
    if (priorityFilter !== 'All Priorities') {
      filtered = filtered.filter(order => order.priority === priorityFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.patientName.toLowerCase().includes(query) ||
        order.orderId.toLowerCase().includes(query) ||
        order.testType.toLowerCase().includes(query)
      );
    }

    setOrders(filtered);
    setCurrentPage(1);
  }, [statusFilter, priorityFilter, searchQuery, allOrders]);

  const handleLogout = async () => {
    await logout();
    navigate('/technician/signin');
  };

  const resetFilters = () => {
    setStatusFilter('All Statuses');
    setPriorityFilter('All Priorities');
    setSearchQuery('');
  };

  const handleOrderAction = async (order: Order) => {
    if (order.action === 'View') {
      // Navigate to results page for completed orders
      navigate('/technician/results');
      return;
    }

    setUpdating(order.id);
    try {
      let newStatus = '';
      if (order.action === 'Start Test') {
        newStatus = 'In Progress';
      } else if (order.action === 'Complete') {
        newStatus = 'Completed';
      }

      if (newStatus) {
        await labAPI.updateOrderStatus(order.id, newStatus);
        // Refresh orders after update
        await fetchLabOrders();
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status. Please try again.');
    } finally {
      setUpdating(null);
    }
  };

  // Pagination
  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const paginatedOrders = orders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getPriorityClass = (priority: string): string => {
    switch (priority) {
      case 'Urgent':
      case 'STAT':
        return 'urgent';
      case 'Routine':
        return 'routine';
      default:
        return 'routine';
    }
  };

  return (
    <div className="tech-dashboard-container">
      {/* Header */}
      <header className="tech-header">
        <div className="tech-header-left">
          <img src="/images/citycare-logo-icon.png" alt="CityCare" className="tech-logo-icon" />
          <span className="tech-logo-text">CityCare</span>
        </div>

        <div className="tech-header-center">
          <GlobalSearch userRole="technician" placeholder="Search orders..." />
        </div>

        <div className="tech-header-right">
          <NotificationDropdown userRole="technician" />
          <div className="tech-user-profile">
            <img src="/images/avatar.png" alt={userFullName} className="tech-user-avatar" />
            <div className="tech-user-info">
              <span className="tech-user-name">{userFullName}</span>
              <span className="tech-user-role">Lab Technician</span>
            </div>
          </div>
        </div>
      </header>

      <div className="tech-layout">
        {/* Sidebar */}
        <aside className="tech-sidebar">
          <div className="tech-sidebar-header">
            <h3 className="tech-nav-title">Navigation</h3>
          </div>

          <nav className="tech-nav">
            <div className="tech-nav-section">
              <h4 className="tech-nav-section-title">Main</h4>
              <button className="tech-nav-item" onClick={() => navigate('/technician/dashboard')}>
                <span className="tech-nav-icon">🏠</span>
                <span className="tech-nav-label">Dashboard</span>
              </button>
              <button className="tech-nav-item active" onClick={() => navigate('/technician/lab-orders')}>
                <span className="tech-nav-icon">📋</span>
                <span className="tech-nav-label">Lab Orders</span>
              </button>
              <button className="tech-nav-item" onClick={() => navigate('/technician/results')}>
                <span className="tech-nav-icon">📊</span>
                <span className="tech-nav-label">Results</span>
              </button>
            </div>

            <div className="tech-nav-section">
              <h4 className="tech-nav-section-title">Secondary</h4>
              <button className="tech-nav-item" onClick={() => navigate('/technician/profile')}>
                <span className="tech-nav-icon">👤</span>
                <span className="tech-nav-label">Profile</span>
              </button>
            </div>
          </nav>

          <button className="tech-logout-btn" onClick={handleLogout}>
            <span className="tech-logout-icon">🚪</span>
            <span className="tech-logout-label">Logout</span>
          </button>
        </aside>

        {/* Main Content */}
        <main className="tech-main-content">
          <div className="tech-content-header">
            <div>
              <h1 className="tech-page-title">Lab Orders</h1>
              <p className="tech-page-subtitle">
                Manage and track all incoming laboratory diagnostic requests.
                {orders.length > 0 && ` (${orders.length} orders)`}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="lab-filters-section">
            <div className="lab-filter-group">
              <label className="lab-filter-label">Status</label>
              <select
                className="lab-filter-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option>All Statuses</option>
                <option>Pending</option>
                <option>In Progress</option>
                <option>Completed</option>
                <option>Cancelled</option>
              </select>
            </div>

            <div className="lab-filter-group">
              <label className="lab-filter-label">Priority</label>
              <select
                className="lab-filter-select"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option>All Priorities</option>
                <option>Urgent</option>
                <option>Routine</option>
              </select>
            </div>

            <button className="lab-reset-btn" onClick={resetFilters}>
              🔄 Reset Filters
            </button>
          </div>

          {/* Orders Table */}
          <div className="tech-orders-section">
            <div className="tech-table-container">
              {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                  Loading orders...
                </div>
              ) : paginatedOrders.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                  No orders found.
                </div>
              ) : (
                <table className="tech-table">
                  <thead>
                    <tr>
                      <th>Time Received</th>
                      <th>Order ID</th>
                      <th>Patient Name</th>
                      <th>Test Type</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedOrders.map((order) => (
                      <tr key={order.id}>
                        <td>{order.timeReceived}</td>
                        <td>{order.orderId}</td>
                        <td>{order.patientName}</td>
                        <td>{order.testType}</td>
                        <td>
                          <span className={`tech-priority-badge ${getPriorityClass(order.priority)}`}>
                            {order.priority}
                          </span>
                        </td>
                        <td>{order.status}</td>
                        <td>{order.date}</td>
                        <td>
                          <button
                            className="tech-action-btn"
                            onClick={() => handleOrderAction(order)}
                            disabled={updating === order.id}
                          >
                            {updating === order.id ? 'Updating...' : order.action}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {orders.length > itemsPerPage && (
              <div className="lab-pagination">
                <button
                  className="lab-pagination-btn"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </button>
                <span style={{ padding: '0 16px', color: '#666' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="lab-pagination-btn primary"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default LabOrders;
