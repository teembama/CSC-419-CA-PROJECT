import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './Appointments.module.css';
import { Button } from '../../components';
import { useAuth } from '../../context';
import { schedulingAPI } from '../../services/api';
import avatar from '../../assets/avatar.png';

interface Booking {
  id: string;
  patientId?: string;
  clinicianId?: string;
  slotId?: string;
  startTime?: string;
  endTime?: string;
  status: string;
  reasonForVisit?: string;
  isWalkIn?: boolean;
  clinician?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
  };
  slot?: {
    id: string;
    startTime: string;
    endTime: string;
    status?: string;
  };
  patient?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

// Calendar Plus Icon with gradient
const CalendarPlusIcon: React.FC<{ size?: number }> = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10.67 2.67V6.67" stroke="url(#calendar_grad_appt)" strokeWidth="2" strokeLinecap="round"/>
    <path d="M21.33 2.67V6.67" stroke="url(#calendar_grad_appt)" strokeWidth="2" strokeLinecap="round"/>
    <rect x="4" y="5.33" width="24" height="24" rx="3" stroke="url(#calendar_grad_appt)" strokeWidth="2"/>
    <path d="M4 12H28" stroke="url(#calendar_grad_appt)" strokeWidth="2"/>
    <path d="M16 17.33V25.33" stroke="url(#calendar_grad_appt)" strokeWidth="2" strokeLinecap="round"/>
    <path d="M12 21.33H20" stroke="url(#calendar_grad_appt)" strokeWidth="2" strokeLinecap="round"/>
    <defs>
      <linearGradient id="calendar_grad_appt" x1="4" y1="2.67" x2="28" y2="29.33" gradientUnits="userSpaceOnUse">
        <stop stopColor="#03A5FF"/>
        <stop offset="1" stopColor="#1FC16B"/>
      </linearGradient>
    </defs>
  </svg>
);

export const Appointments: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllPast, setShowAllPast] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const fetchBookings = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const data = await schedulingAPI.getPatientBookings(user.id);
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch bookings on mount and when navigating back to this page
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings, location.key]);

  const handleBookAppointment = () => {
    navigate('/appointments/book');
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await schedulingAPI.cancelBooking(bookingId);
      setBookings(bookings.map(b =>
        b.id === bookingId ? { ...b, status: 'Cancelled' } : b
      ));
    } catch (error) {
      console.error('Error cancelling booking:', error);
    }
  };

  const handleReschedule = (booking: Booking) => {
    navigate('/appointments/book', {
      state: {
        rescheduleBookingId: booking.id,
        clinicianId: booking.clinician?.id,
        clinicianName: `${booking.clinician?.first_name} ${booking.clinician?.last_name}`,
      }
    });
  };

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

  // Separate upcoming and past appointments
  const now = new Date();
  const upcomingBookings = bookings.filter(b => {
    const startTime = b.slot?.startTime || b.startTime;
    return startTime && new Date(startTime) > now && b.status !== 'Cancelled';
  });
  const pastBookings = bookings.filter(b => {
    const startTime = b.slot?.startTime || b.startTime;
    return !startTime || new Date(startTime) <= now || b.status === 'Completed';
  });

  // Sort upcoming bookings by date (nearest first)
  const sortedUpcomingBookings = [...upcomingBookings].sort((a, b) => {
    const aTime = new Date(a.slot?.startTime || a.startTime || '').getTime();
    const bTime = new Date(b.slot?.startTime || b.startTime || '').getTime();
    return aTime - bTime;
  });

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Appointments</h1>
      </div>

      {/* Upcoming Appointments Section */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Upcoming Appointments ({sortedUpcomingBookings.length})</h2>
          <Button size="small" onClick={handleBookAppointment}>Book Appointment</Button>
        </div>

        {loading ? (
          <div className={styles.upcomingCard}>
            <p style={{ padding: '20px', textAlign: 'center' }}>Loading...</p>
          </div>
        ) : sortedUpcomingBookings.length > 0 ? (
          <div className={styles.upcomingAppointmentsList}>
            {sortedUpcomingBookings.map((appointment) => (
              <div key={appointment.id} className={styles.upcomingCard}>
                <div className={styles.upcomingHeader}>
                  <CalendarPlusIcon size={32} />
                  <span className={styles.upcomingDateTime}>
                    {formatDate(appointment.slot?.startTime || appointment.startTime || '')} | {formatTime(appointment.slot?.startTime || appointment.startTime || '')}
                  </span>
                </div>

                <div className={styles.doctorCard}>
                  <div className={styles.doctorInfo}>
                    <img
                      src={avatar}
                      alt={`Dr. ${appointment.clinician?.first_name}`}
                      className={styles.doctorAvatar}
                    />
                    <div className={styles.doctorDetails}>
                      <span className={styles.doctorName}>
                        {appointment.clinician
                          ? `${appointment.clinician.first_name?.startsWith('Dr.') ? '' : 'Dr. '}${appointment.clinician.first_name || ''} ${appointment.clinician.last_name || ''}`.trim()
                          : 'Your Doctor'}
                      </span>
                      <div className={styles.departmentRow}>
                        <span className={styles.statusDot}></span>
                        <span className={styles.department}>
                          {appointment.reasonForVisit || 'General Consultation'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className={`${styles.statusBadge} ${appointment.status === 'Pending' ? styles.statusPending : ''}`}>
                    {appointment.status}
                  </span>
                </div>

                <div className={styles.appointmentActions}>
                  <Button
                    variant="outline"
                    size="small"
                    onClick={() => handleReschedule(appointment)}
                  >
                    Reschedule
                  </Button>
                  <button
                    className={styles.cancelBtn}
                    onClick={() => handleCancelBooking(appointment.id)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.upcomingCard}>
            <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
              No upcoming appointments
            </p>
            <Button onClick={handleBookAppointment} fullWidth>
              Book an Appointment
            </Button>
          </div>
        )}
      </div>

      {/* Past Appointments Section */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Past Appointments</h2>
          {pastBookings.length > 4 && (
            <button className={styles.viewMoreBtn} onClick={() => setShowAllPast(!showAllPast)}>
              {showAllPast ? 'Show Less' : 'View More'}
            </button>
          )}
        </div>

        {loading ? (
          <p style={{ padding: '20px', textAlign: 'center' }}>Loading...</p>
        ) : pastBookings.length > 0 ? (
          <div className={styles.pastAppointmentsGrid}>
            {pastBookings.slice(0, showAllPast ? undefined : 4).map((appointment) => (
              <div key={appointment.id} className={styles.pastCard}>
                <div className={styles.pastCardHeader}>
                  <img
                    src={avatar}
                    alt={`Dr. ${appointment.clinician?.first_name}`}
                    className={styles.pastAvatar}
                  />
                  <div className={styles.pastInfo}>
                    <span className={styles.pastDate}>{formatDate(appointment.slot?.startTime || appointment.startTime || '')}</span>
                    <span className={styles.pastTime}>{formatTime(appointment.slot?.startTime || appointment.startTime || '')}</span>
                    <span className={styles.pastDoctor}>
                      {appointment.clinician
                        ? `${appointment.clinician.first_name?.startsWith('Dr.') ? '' : 'Dr. '}${appointment.clinician.first_name || ''} ${appointment.clinician.last_name || ''}`.trim()
                        : 'Your Doctor'}
                    </span>
                    <span className={styles.pastDepartment}>
                      {appointment.reasonForVisit || 'General Consultation'}
                    </span>
                  </div>
                  <span className={styles.statusBadge}>{appointment.status}</span>
                </div>
                <button className={styles.viewSummaryBtn} onClick={() => navigate('/medical-records', { state: { tab: 'visit-history' } })}>View Summary</button>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
            No past appointments
          </p>
        )}
      </div>

    </div>
  );
};

export default Appointments;
