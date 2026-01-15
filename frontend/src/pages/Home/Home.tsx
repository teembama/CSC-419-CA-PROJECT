import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styles from './Home.module.css';
import {
  CalendarIcon,
  ArchiveIcon,
  LabIcon,
  CreditCardIcon,
  DocumentIcon,
  HealthcareIcon,
  HeartIcon,
} from '../../components';
import { Button } from '../../components';
import { useAuth } from '../../context';
import { schedulingAPI, billingAPI, notificationAPI, clinicalAPI, labAPI } from '../../services/api';

interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  buttonText: string;
  iconBg: string;
  isPrimary?: boolean;
}

const quickActions: QuickAction[] = [
  {
    title: 'Book Appointment',
    description: 'Schedule a visit with your doctor.',
    icon: <CalendarIcon size={24} color="#03A5FF" />,
    path: '/appointments',
    buttonText: 'Book Now',
    iconBg: 'rgba(3, 165, 255, 0.1)',
    isPrimary: true,
  },
  {
    title: 'Medical Records',
    description: 'View your history and reports.',
    icon: <ArchiveIcon size={24} color="#22C55E" />,
    path: '/medical-records',
    buttonText: 'View Records',
    iconBg: 'rgba(34, 197, 94, 0.1)',
  },
  {
    title: 'Lab Results',
    description: 'Check your latest test outcomes.',
    icon: <LabIcon size={24} color="#8B5CF6" />,
    path: '/lab-results',
    buttonText: 'View Results',
    iconBg: 'rgba(139, 92, 246, 0.1)',
  },
  {
    title: 'Pay Your Bill',
    description: 'View and pay your outstanding bills.',
    icon: <CreditCardIcon size={24} color="#F59E0B" />,
    path: '/billing',
    buttonText: 'Pay Bill',
    iconBg: 'rgba(245, 158, 11, 0.1)',
  },
];

// Calendar Plus Icon component
const CalendarPlusIcon: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10.67 2.67V6.67" stroke="url(#calendar_plus_grad)" strokeWidth="2" strokeLinecap="round"/>
    <path d="M21.33 2.67V6.67" stroke="url(#calendar_plus_grad)" strokeWidth="2" strokeLinecap="round"/>
    <rect x="4" y="5.33" width="24" height="24" rx="3" stroke="url(#calendar_plus_grad)" strokeWidth="2"/>
    <path d="M4 12H28" stroke="url(#calendar_plus_grad)" strokeWidth="2"/>
    <path d="M16 17.33V25.33" stroke="url(#calendar_plus_grad)" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 21.33H20" stroke="url(#calendar_plus_grad)" strokeWidth="2" strokeLinecap="round"/>
    <defs>
      <linearGradient id="calendar_plus_grad" x1="4" y1="2.67" x2="28" y2="29.33" gradientUnits="userSpaceOnUse">
        <stop stopColor="#03A5FF"/>
        <stop offset="1" stopColor="#1FC16B"/>
      </linearGradient>
    </defs>
  </svg>
);

// Empty Notifications Bell Icon
const EmptyNotificationIcon: React.FC<{ size?: number }> = ({ size = 60 }) => (
  <svg width={size} height={size} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M45.334 27.5C46.7888 40.9387 52.5 45 52.5 45H7.5C7.5 45 15 39.6667 15 21C15 16.7565 16.5804 12.6869 19.3934 9.68629C22.2064 6.68571 26.0218 5 30 5C30.8433 5 31.6793 5.07575 32.5 5.22372" stroke="#E8E8E8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M47.5 20C51.6421 20 55 16.6421 55 12.5C55 8.35786 51.6421 5 47.5 5C43.3579 5 40 8.35786 40 12.5C40 16.6421 43.3579 20 47.5 20Z" stroke="#E8E8E8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M34.325 52.5C33.8855 53.2577 33.2547 53.8866 32.4956 54.3238C31.7366 54.761 30.876 54.9911 30 54.9911C29.1241 54.9911 28.2635 54.761 27.5045 54.3238C26.7454 53.8866 26.1146 53.2577 25.675 52.5" stroke="#E8E8E8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  reference_id?: string;
  reference_type?: string;
}

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showProfileNudge, setShowProfileNudge] = useState(false);
  const [healthSummary, setHealthSummary] = useState<{
    latestDiagnosis: string;
    medications: string[];
    recentLabResults: string[];
  }>({
    latestDiagnosis: 'No recent diagnosis',
    medications: [],
    recentLabResults: [],
  });

  const fetchData = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const [appointmentsData, invoicesData, notificationsData] = await Promise.all([
        schedulingAPI.getPatientBookings(user.id).catch(() => []),
        billingAPI.getPatientInvoices(user.id).catch(() => []),
        notificationAPI.getNotifications(10).catch(() => ({ notifications: [], unreadCount: 0 })),
      ]);

      setAppointments(appointmentsData || []);
      setInvoices(invoicesData || []);
      setNotifications(notificationsData?.notifications || []);
      setUnreadCount(notificationsData?.unreadCount || 0);

      // Fetch health summary data
      try {
        const [prescriptionsData, labResultsData, chartData] = await Promise.all([
          clinicalAPI.getPatientPrescriptions(user.id).catch(() => []),
          labAPI.getPatientResults(user.id).catch(() => []),
          clinicalAPI.getPatientChart(user.id).catch(() => null),
        ]);

        // Get medication names from prescriptions
        const medications = (prescriptionsData || [])
          .slice(0, 3)
          .map((p: any) => p.medication_name || p.medicationName || 'Unknown');

        // Get recent lab test names
        const labResults = (labResultsData || [])
          .slice(0, 3)
          .map((r: any) => r.testItem?.testName || r.test_name || 'Lab Test');

        // Get latest diagnosis from encounters
        let latestDiagnosis = 'No recent diagnosis';
        if (chartData?.encounters?.length > 0) {
          const latestEncounter = chartData.encounters[0];
          if (latestEncounter.soapNotes?.assessment) {
            latestDiagnosis = latestEncounter.soapNotes.assessment;
          }
        }

        setHealthSummary({
          latestDiagnosis,
          medications,
          recentLabResults: labResults,
        });
      } catch (healthError) {
        console.error('Error fetching health summary:', healthError);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications(notifications.map(n =>
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <CalendarIcon size={16} color="#03A5FF" />;
      case 'lab_result':
        return <LabIcon size={16} color="#8B5CF6" />;
      case 'invoice':
        return <CreditCardIcon size={16} color="#F59E0B" />;
      case 'prescription':
        return <DocumentIcon size={16} color="#22C55E" />;
      default:
        return <HeartIcon size={16} color="#03A5FF" />;
    }
  };

  const formatNotificationTime = (dateStr: string | undefined | null) => {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Recently';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Fetch data on mount and when navigating to this page
  useEffect(() => {
    fetchData();
  }, [fetchData, location.key]);

  // Check if profile is incomplete (new account nudge)
  useEffect(() => {
    if (user) {
      // Check if key profile fields are missing
      const isIncomplete = !user.phone_number || !user.address;
      // Only show nudge if not previously dismissed in this session
      const dismissed = sessionStorage.getItem('profileNudgeDismissed');
      setShowProfileNudge(isIncomplete && !dismissed);
    }
  }, [user]);

  const dismissProfileNudge = () => {
    sessionStorage.setItem('profileNudgeDismissed', 'true');
    setShowProfileNudge(false);
  };

  const handleBookAppointment = () => {
    navigate('/appointments/book');
  };

  // Get next upcoming appointment (future dates only, sorted by nearest)
  const now = new Date();
  const upcomingAppointment = appointments
    .filter(a =>
      (a.status === 'Pending' || a.status === 'Confirmed') &&
      a.slot?.startTime &&
      new Date(a.slot.startTime) >= now
    )
    .sort((a, b) => new Date(a.slot?.startTime).getTime() - new Date(b.slot?.startTime).getTime())
    [0];

  // Calculate outstanding balance
  const outstandingBalance = invoices
    .filter(inv => ['Draft', 'Pending', 'Unpaid', 'Overdue'].includes(inv.status))
    .reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0);

  const formatDate = (dateStr: string | undefined | null) => {
    if (!dateStr) return 'Date not set';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    });
  };

  const formatTime = (dateStr: string | undefined | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC'
    });
  };

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Home</h1>
          <p className={styles.welcomeText}>
            Welcome, {user?.first_name || 'User'} 👋🏾
          </p>
        </div>
      </div>

      {/* Profile Completion Nudge */}
      {showProfileNudge && (
        <div className={styles.profileNudge}>
          <div className={styles.profileNudgeContent}>
            <div className={styles.profileNudgeIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4"/>
                <path d="M12 8h.01"/>
              </svg>
            </div>
            <div className={styles.profileNudgeText}>
              <strong>Complete your profile</strong>
              <span>Add your phone number and address to help us serve you better.</span>
            </div>
          </div>
          <div className={styles.profileNudgeActions}>
            <button className={styles.profileNudgeBtn} onClick={() => navigate('/profile')}>
              Complete Profile
            </button>
            <button className={styles.profileNudgeDismiss} onClick={dismissProfileNudge}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Top Row - Appointment and Notifications */}
      <div className={styles.topRow}>
        {/* Upcoming Appointment Card */}
        <div className={styles.upcomingAppointmentCard}>
          <div className={styles.appointmentHeader}>
            <CalendarPlusIcon size={32} />
            <span className={styles.appointmentLabel}>Upcoming Appointment</span>
          </div>
          {loading ? (
            <div className={styles.appointmentDetails}>
              <p>Loading...</p>
            </div>
          ) : upcomingAppointment ? (
            <>
              <div className={styles.appointmentDetails}>
                <div className={styles.appointmentInfo}>
                  <p className={styles.appointmentDateTime}>
                    {formatDate(upcomingAppointment.slot?.startTime)} | {formatTime(upcomingAppointment.slot?.startTime)}
                  </p>
                  <p className={styles.appointmentDoctor}>
                    {upcomingAppointment.clinician
                      ? `${upcomingAppointment.clinician.first_name?.startsWith('Dr.') ? '' : 'Dr. '}${upcomingAppointment.clinician.first_name || ''} ${upcomingAppointment.clinician.last_name || ''}`.trim()
                      : 'Your Doctor'}
                  </p>
                  <p className={styles.appointmentDepartment}>
                    {upcomingAppointment.reasonForVisit || 'General Consultation'}
                  </p>
                </div>
              </div>
              <div className={styles.appointmentActions}>
                <Link to="/appointments">
                  <Button size="small">View Details</Button>
                </Link>
                <Link to="/appointments">
                  <Button variant="outline" size="small">Reschedule</Button>
                </Link>
              </div>
            </>
          ) : (
            <div className={styles.appointmentDetails}>
              <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
                No upcoming appointments
              </p>
              <Button onClick={handleBookAppointment} fullWidth>
                Book Appointment
              </Button>
            </div>
          )}
        </div>

        {/* Notifications Card */}
        <div className={styles.notificationsCard}>
          <div className={styles.notificationsHeaderRow}>
            <h3 className={styles.notificationsHeader}>
              Notifications
              {unreadCount > 0 && (
                <span className={styles.unreadBadge}>{unreadCount}</span>
              )}
            </h3>
            {notifications.length > 0 && unreadCount > 0 && (
              <button className={styles.markAllReadBtn} onClick={handleMarkAllAsRead}>
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className={styles.notificationsEmpty}>
              <EmptyNotificationIcon size={64} />
              <p className={styles.notificationsEmptyText}>You have no notifications</p>
            </div>
          ) : (
            <div className={styles.notificationsList}>
              {notifications.slice(0, 5).map((notification) => (
                <div
                  key={notification.id}
                  className={`${styles.notificationItem} ${!notification.is_read ? styles.unread : ''}`}
                  onClick={() => {
                    setSelectedNotification(notification);
                    if (!notification.is_read) handleMarkAsRead(notification.id);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className={styles.notificationIcon}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className={styles.notificationContent}>
                    <p className={styles.notificationTitle}>{notification.title}</p>
                    <p className={styles.notificationMessage}>{notification.message}</p>
                    <span className={styles.notificationTime}>
                      {formatNotificationTime(notification.created_at)}
                    </span>
                  </div>
                  {!notification.is_read && <span className={styles.unreadDot} />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Section */}
      <div className={styles.quickActionsSection}>
        <h3 className={styles.sectionTitle}>Quick Actions</h3>
        <div className={styles.quickActionsGrid}>
          {quickActions.map((action) => (
            <div key={action.path} className={styles.quickActionCard}>
              <div
                className={styles.quickActionIcon}
                style={{ backgroundColor: action.iconBg }}
              >
                {action.icon}
              </div>
              <div className={styles.quickActionInfo}>
                <h4>{action.title}</h4>
                <p>{action.description}</p>
              </div>
              {action.isPrimary ? (
                <button
                  onClick={handleBookAppointment}
                  className={styles.quickActionButtonPrimary}
                >
                  {action.buttonText}
                </button>
              ) : (
                <Link
                  to={action.path}
                  className={styles.quickActionButton}
                >
                  {action.buttonText}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Row - Health Summary and Billing */}
      <div className={styles.bottomRow}>
        {/* Health Summary Card */}
        <div className={styles.healthSummaryCard}>
          <div className={styles.healthSummaryHeader}>
            <HealthcareIcon size={24} />
            <span>Health Summary</span>
          </div>
          <div className={styles.healthSummaryContent}>
            <div className={styles.healthItem}>
              <span className={styles.healthItemIcon}>
                <HeartIcon size={16} color="#EF4444" />
              </span>
              <span className={styles.healthItemLabel}>Latest Diagnosis:</span>
              <span className={styles.healthItemValue}>
                {loading ? 'Loading...' : healthSummary.latestDiagnosis}
              </span>
            </div>
            <div className={styles.healthItem}>
              <span className={styles.healthItemIcon}>
                <DocumentIcon size={16} color="#03A5FF" />
              </span>
              <span className={styles.healthItemLabel}>Current Medications:</span>
              <span className={styles.healthItemValue}>
                {loading ? 'Loading...' :
                  healthSummary.medications.length > 0
                    ? healthSummary.medications.join(', ')
                    : 'No current medications'}
              </span>
            </div>
            <div className={styles.healthItem}>
              <span className={styles.healthItemIcon}>
                <LabIcon size={16} color="#22C55E" />
              </span>
              <span className={styles.healthItemLabel}>Recent Lab Results:</span>
              <span className={styles.healthItemValue}>
                {loading ? 'Loading...' :
                  healthSummary.recentLabResults.length > 0
                    ? healthSummary.recentLabResults.join(', ')
                    : 'No recent lab results'}
              </span>
            </div>
          </div>
        </div>

        {/* Billing Overview Card */}
        <div className={styles.billingCard}>
          <div className={styles.billingHeader}>
            <h3>Billing Overview</h3>
            <div className={styles.billingBalance}>
              <span className={styles.balanceLabel}>Outstanding Balance:</span>
              <span className={styles.balanceAmount}>
                {loading ? 'Loading...' : `₦${outstandingBalance.toLocaleString()}`}
              </span>
            </div>
          </div>
          <Link to="/billing">
            <Button fullWidth>View Bills</Button>
          </Link>
        </div>
      </div>

      {/* Notification Detail Modal */}
      {selectedNotification && (
        <div className={styles.notificationModalOverlay} onClick={() => setSelectedNotification(null)}>
          <div className={styles.notificationModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.notificationModalHeader}>
              <div className={styles.notificationModalHeaderLeft}>
                <div className={styles.notificationModalIcon}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <h3 className={styles.notificationModalTitle}>{selectedNotification.title}</h3>
              </div>
              <button className={styles.notificationModalClose} onClick={() => setSelectedNotification(null)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className={styles.notificationModalBody}>
              <p className={styles.notificationModalMessage}>{selectedNotification.message}</p>
              <div className={styles.notificationModalTime}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12,6 12,12 16,14" />
                </svg>
                {formatNotificationTime(selectedNotification.created_at)}
              </div>
            </div>
            <div className={styles.notificationModalFooter}>
              <button className={styles.notificationModalBtn} onClick={() => setSelectedNotification(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
