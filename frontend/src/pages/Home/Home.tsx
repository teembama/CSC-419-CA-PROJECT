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
import { schedulingAPI, billingAPI } from '../../services/api';

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
    description: 'Check your latest test outcomes.',
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

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [appointments, setAppointments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const [appointmentsData, invoicesData] = await Promise.all([
        schedulingAPI.getPatientBookings(user.id).catch(() => []),
        billingAPI.getPatientInvoices(user.id).catch(() => []),
      ]);

      setAppointments(appointmentsData || []);
      setInvoices(invoicesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch data on mount and when navigating to this page
  useEffect(() => {
    fetchData();
  }, [fetchData, location.key]);

  const handleBookAppointment = () => {
    navigate('/appointments/book');
  };

  // Get next upcoming appointment
  const upcomingAppointment = appointments.find(a => a.status === 'Pending' || a.status === 'Confirmed');

  // Calculate outstanding balance
  const outstandingBalance = invoices
    .filter(inv => inv.status === 'Unpaid' || inv.status === 'Overdue')
    .reduce((sum, inv) => sum + parseFloat(inv.total_amount || 0), 0);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC'
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
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
                    Dr. {upcomingAppointment.clinician?.first_name} {upcomingAppointment.clinician?.last_name}
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
          <h3 className={styles.notificationsHeader}>Notifications</h3>
          <div className={styles.notificationsEmpty}>
            <EmptyNotificationIcon size={64} />
            <p className={styles.notificationsEmptyText}>You have no notifications</p>
          </div>
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
              <span className={styles.healthItemValue}>No recent diagnosis</span>
            </div>
            <div className={styles.healthItem}>
              <span className={styles.healthItemIcon}>
                <DocumentIcon size={16} color="#03A5FF" />
              </span>
              <span className={styles.healthItemLabel}>Current Medications:</span>
              <span className={styles.healthItemValue}>View in Medical Records</span>
            </div>
            <div className={styles.healthItem}>
              <span className={styles.healthItemIcon}>
                <LabIcon size={16} color="#22C55E" />
              </span>
              <span className={styles.healthItemLabel}>Recent Lab Results:</span>
              <span className={styles.healthItemValue}>View in Lab Results</span>
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

    </div>
  );
};

export default Home;
