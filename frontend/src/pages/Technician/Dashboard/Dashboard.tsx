import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context';
import { labAPI } from '../../../services/api';
import { formatTime, formatShortDate } from '../../../utils/dateUtils';
import NotificationDropdown from '../../../components/Notifications/NotificationDropdown';
import GlobalSearch from '../../../components/Search/GlobalSearch';
import './Dashboard.css';

interface StatCard {
  title: string;
  value: number;
  icon: string;
  color: string;
  bgColor: string;
}

interface Order {
  id: string;
  timeReceived: string;
  orderId: string;
  patientName: string;
  testType: string;
  priority: 'Urgent' | 'Routine' | 'Stat';
  status: string;
  rawStatus: string;
  action: string;
}

interface LabStats {
  totalOrders: number;
  pending: number;
  inProgress: number;
  completed: number;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [labStats, setLabStats] = useState<LabStats>({
    totalOrders: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [urgentCount, setUrgentCount] = useState(0);
  const [abnormalCount, setAbnormalCount] = useState(0);

  // Get user display name from AuthContext
  const userName = user?.first_name || user?.firstName || 'Technician';
  const userFullName = `${user?.first_name || user?.firstName || ''} ${user?.last_name || user?.lastName || ''}`.trim() || 'Lab Technician';

  const fetchLabData = async () => {
    try {
      setLoading(true);
      // Fetch lab orders
      const labOrders = await labAPI.getOrders().catch(() => []);
      const ordersArray = Array.isArray(labOrders) ? labOrders : [];

      // Calculate stats from orders
      const stats = {
        totalOrders: ordersArray.length,
        pending: ordersArray.filter((o: any) => o.status === 'Pending' || o.status === 'Ordered').length,
        inProgress: ordersArray.filter((o: any) => o.status === 'InProgress' || o.status === 'In Progress').length,
        completed: ordersArray.filter((o: any) => o.status === 'Completed').length,
      };
      setLabStats(stats);

      // Calculate urgent count
      const urgent = ordersArray.filter((o: any) => o.priority === 'STAT' || o.priority === 'Urgent').length;
      setUrgentCount(urgent);

      // Check for abnormal results
      try {
        const results = await labAPI.getUnverifiedResults().catch(() => []);
        const abnormal = Array.isArray(results) ? results.filter((r: any) =>
          r.abnormality_flag && !['Normal', 'normal'].includes(r.abnormality_flag)
        ).length : 0;
        setAbnormalCount(abnormal);
      } catch {
        setAbnormalCount(0);
      }

      // Transform orders for display (get recent 5)
      const recentOrders = ordersArray.slice(0, 5).map((order: any) => {
        // Patient info comes from chart.patient in the API response
        const patient = order.chart?.patient || order.patient_encounters?.patient_charts?.users;
        const patientName = patient
          ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim()
          : 'Unknown Patient';

        // Test type from testItems array or lab_test_items
        const testType = order.testItems?.[0]?.testName || order.lab_test_items?.[0]?.test_name || 'Lab Test';

        // Format time received - backend returns createdAt (from encounter date)
        const createdAt = order.createdAt || order.created_at;
        let timeReceived = 'N/A';
        if (createdAt) {
          const time = formatTime(createdAt);
          const date = formatShortDate(createdAt);
          timeReceived = time !== 'N/A' ? `${time} (${date})` : date;
        }

        const orderId = order.id ? `#LAB-${order.id.slice(0, 4).toUpperCase()}` : 'N/A';

        // Map API status to display status
        const statusMap: Record<string, string> = {
          'Ordered': 'Pending',
          'In Progress': 'In Progress',
          'Completed': 'Completed',
          'Cancelled': 'Cancelled',
          'Pending': 'Pending',
          'InProgress': 'In Progress'
        };

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
          patientName: patientName || 'Unknown Patient',
          testType: testType || 'Lab Test',
          priority: order.priority === 'STAT' ? 'Urgent' : order.priority || 'Routine',
          status: displayStatus,
          rawStatus: order.status,
          action,
        };
      });
      setAllOrders(recentOrders);
      setOrders(recentOrders);
    } catch (error) {
      console.error('Error fetching lab data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabData();
  }, []);

  // Filter orders based on search query
  useEffect(() => {
    if (!orderSearchQuery) {
      setOrders(allOrders);
    } else {
      const query = orderSearchQuery.toLowerCase();
      const filtered = allOrders.filter(order =>
        order.patientName.toLowerCase().includes(query) ||
        order.orderId.toLowerCase().includes(query) ||
        order.testType.toLowerCase().includes(query)
      );
      setOrders(filtered);
    }
  }, [orderSearchQuery, allOrders]);

  // Handle order actions
  const handleOrderAction = async (order: Order) => {
    if (order.action === 'View') {
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
        await fetchLabData();
      }
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order status. Please try again.');
    } finally {
      setUpdating(null);
    }
  };

  // Handle global search
  const handleGlobalSearch = () => {
    if (searchQuery) {
      navigate(`/technician/lab-orders?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Stats data using real values
  const stats: StatCard[] = [
    {
      title: 'Total Orders Today',
      value: labStats.totalOrders,
      icon: '📋',
      color: '#00A8E8',
      bgColor: '#E6F7FF',
    },
    {
      title: 'Pending',
      value: labStats.pending,
      icon: '⏳',
      color: '#FFA500',
      bgColor: '#FFF4E6',
    },
    {
      title: 'In Progress',
      value: labStats.inProgress,
      icon: '🔄',
      color: '#9333EA',
      bgColor: '#F3E8FF',
    },
    {
      title: 'Completed',
      value: labStats.completed,
      icon: '✅',
      color: '#10B981',
      bgColor: '#ECFDF5',
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/technician/signin');
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
          <GlobalSearch userRole="technician" placeholder="Search orders, patients..." />
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
        <aside className={`tech-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <button
            className="tech-sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            ☰
          </button>

          <div className="tech-sidebar-header">
            <h3 className="tech-nav-title">Navigation</h3>
          </div>

          <nav className="tech-nav">
            <div className="tech-nav-section">
              <h4 className="tech-nav-section-title">Main</h4>
              <button className="tech-nav-item active" onClick={() => navigate('/technician/dashboard')}>
                <span className="tech-nav-icon">🏠</span>
                <span className="tech-nav-label">Dashboard</span>
              </button>
              <button className="tech-nav-item" onClick={() => navigate('/technician/lab-orders')}>
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
              <h1 className="tech-page-title">Dashboard</h1>
              <p className="tech-page-subtitle">
                Welcome back, {userName}. You have{' '}
                <span className="tech-urgent-count">{urgentCount} urgent tasks</span> today.
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="tech-stats-grid">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="tech-stat-card"
                style={{ backgroundColor: stat.bgColor }}
              >
                <div className="tech-stat-header">
                  <span className="tech-stat-title">{stat.title}</span>
                </div>
                <div className="tech-stat-content">
                  <div
                    className="tech-stat-icon"
                    style={{ backgroundColor: stat.color + '20' }}
                  >
                    <span style={{ color: stat.color }}>{stat.icon}</span>
                  </div>
                  <span className="tech-stat-value" style={{ color: stat.color }}>
                    {stat.value}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Abnormal Results Alert */}
          {abnormalCount > 0 && (
            <div className="tech-alert-banner">
              <div className="tech-alert-content">
                <div className="tech-alert-icon">⚠️</div>
                <div className="tech-alert-text">
                  <h3 className="tech-alert-title">Abnormal Results Alert</h3>
                  <p className="tech-alert-description">
                    There {abnormalCount === 1 ? 'is' : 'are'} {abnormalCount} critical result{abnormalCount !== 1 ? 's' : ''} that require{abnormalCount === 1 ? 's' : ''} immediate validation and flagging to clinician staff.
                  </p>
                </div>
              </div>
              <button className="tech-alert-btn" onClick={() => navigate('/technician/results?filter=abnormal')}>
                Review Alerts
              </button>
            </div>
          )}

          {/* Orders Queue */}
          <div className="tech-orders-section">
            <div className="tech-section-header">
              <h2 className="tech-section-title">Orders Queue</h2>
              <div className="tech-search-box">
                <span className="tech-search-icon-small">🔍</span>
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="tech-table-container">
              {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                  Loading orders...
                </div>
              ) : orders.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                  {orderSearchQuery ? 'No orders match your search.' : 'No pending orders.'}
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
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td>{order.timeReceived}</td>
                        <td>{order.orderId}</td>
                        <td>{order.patientName}</td>
                        <td>{order.testType}</td>
                        <td>
                          <span className={`tech-priority-badge ${order.priority === 'Urgent' ? 'urgent' : 'routine'}`}>
                            {order.priority}
                          </span>
                        </td>
                        <td>{order.status}</td>
                        <td>
                          <button
                            className="tech-action-btn"
                            onClick={() => handleOrderAction(order)}
                            disabled={updating === order.id}
                          >
                            {updating === order.id ? '...' : order.action}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <button className="tech-view-more-btn" onClick={() => navigate('/technician/lab-orders')}>
              View All Orders
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
