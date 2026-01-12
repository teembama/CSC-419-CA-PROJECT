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
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const fetchBookings = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const data = await schedulingAPI.getPatientBookings(user.id);
      console.log('[Appointments] Fetched bookings:', data);
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

  const formatDate = (dateStr: string) => {
    // Parse as UTC to avoid timezone issues
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

  const upcomingAppointment = upcomingBookings[0];

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Appointments</h1>
      </div>

      {/* Upcoming Appointments Section */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Upcoming Appointments</h2>
          <Button size="small" onClick={handleBookAppointment}>Book Appointment</Button>
        </div>

        {loading ? (
          <div className={styles.upcomingCard}>
            <p style={{ padding: '20px', textAlign: 'center' }}>Loading...</p>
          </div>
        ) : upcomingAppointment ? (
          <div className={styles.upcomingCard}>
            <div className={styles.upcomingHeader}>
              <CalendarPlusIcon size={32} />
              <span className={styles.upcomingDateTime}>
                {formatDate(upcomingAppointment.slot?.startTime || upcomingAppointment.startTime || '')} | {formatTime(upcomingAppointment.slot?.startTime || upcomingAppointment.startTime || '')}
              </span>
            </div>

            <div className={styles.doctorCard}>
              <div className={styles.doctorInfo}>
                <img
                  src={avatar}
                  alt={`Dr. ${upcomingAppointment.clinician?.first_name}`}
                  className={styles.doctorAvatar}
                />
                <div className={styles.doctorDetails}>
                  <span className={styles.doctorName}>
                    Dr. {upcomingAppointment.clinician?.first_name} {upcomingAppointment.clinician?.last_name}
                  </span>
                  <div className={styles.departmentRow}>
                    <span className={styles.statusDot}></span>
                    <span className={styles.department}>
                      {upcomingAppointment.reasonForVisit || 'General Consultation'}
                    </span>
                  </div>
                </div>
              </div>
              <span className={styles.statusBadge}>{upcomingAppointment.status}</span>
            </div>

            <div className={styles.appointmentActions}>
              <Button
                variant="outline"
                size="small"
                onClick={() => handleReschedule(upcomingAppointment)}
              >
                Reschedule
              </Button>
              <button
                className={styles.cancelBtn}
                onClick={() => handleCancelBooking(upcomingAppointment.id)}
              >
                Cancel
              </button>
            </div>
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
            <button className={styles.viewMoreBtn} onClick={() => alert('View more past appointments')}>View More</button>
          )}
        </div>

        {loading ? (
          <p style={{ padding: '20px', textAlign: 'center' }}>Loading...</p>
        ) : pastBookings.length > 0 ? (
          <div className={styles.pastAppointmentsGrid}>
            {pastBookings.slice(0, 4).map((appointment) => (
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
                      Dr. {appointment.clinician?.first_name} {appointment.clinician?.last_name}
                    </span>
                    <span className={styles.pastDepartment}>
                      {appointment.reasonForVisit || 'General Consultation'}
                    </span>
                  </div>
                  <span className={styles.statusBadge}>{appointment.status}</span>
                </div>
                <button className={styles.viewSummaryBtn} onClick={() => navigate('/medical-records')}>View Summary</button>
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
