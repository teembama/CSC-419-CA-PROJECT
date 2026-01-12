import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Appointments.css';
import { useAuth } from '../../../context';
import { schedulingAPI } from '../../../services/api';
import cityCareLogoColored from '../../../assets/cityCarelogoColored.png';

interface ScheduleItem {
  id: string;
  slotId: string;
  clinicianId: string;
  startTime: string;
  endTime: string;
  status: string;
  slotStatus: string;
  reasonForVisit?: string;
  patient?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
  } | null;
}

// Calendar icon component
const CalendarIcon = () => (
  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="6" width="24" height="22" rx="3" fill="url(#calGradAppt)" fillOpacity="0.15"/>
    <rect x="4" y="6" width="24" height="22" rx="3" stroke="url(#calGradAppt)" strokeWidth="2"/>
    <path d="M4 12H28" stroke="url(#calGradAppt)" strokeWidth="2"/>
    <path d="M10 4V8" stroke="url(#calGradAppt)" strokeWidth="2" strokeLinecap="round"/>
    <path d="M22 4V8" stroke="url(#calGradAppt)" strokeWidth="2" strokeLinecap="round"/>
    <path d="M20 18L15 23L12 20" stroke="url(#calGradAppt)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <defs>
      <linearGradient id="calGradAppt" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#03A5FF"/>
        <stop offset="1" stopColor="#1FC16B"/>
      </linearGradient>
    </defs>
  </svg>
);

const Appointments: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeNavItem, setActiveNavItem] = useState('Appointments');

  const fetchSchedule = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 3);

      const scheduleData = await schedulingAPI.getClinicianSchedule(
        user.id,
        startDate.toISOString(),
        endDate.toISOString()
      ).catch(() => []);

      console.log('[ClinicianAppointments] Fetched schedule:', scheduleData);
      setSchedule(scheduleData || []);
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch data on mount and when navigating to this page
  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule, location.key]);

  const handleCancelAppointment = async (bookingId: string) => {
    try {
      await schedulingAPI.cancelBooking(bookingId);
      fetchSchedule();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert('Failed to cancel appointment');
    }
  };

  const handleNavigation = (item: string, path: string) => {
    setActiveNavItem(item);
    navigate(path);
  };

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

  const now = new Date();

  // Upcoming appointments (confirmed or pending, future)
  const upcomingAppointments = schedule.filter(item =>
    item.patient && (item.status === 'Confirmed' || item.status === 'Pending') && new Date(item.startTime) >= now
  );

  // Past appointments
  const pastAppointments = schedule.filter(item =>
    item.patient && (new Date(item.startTime) < now || item.status === 'Completed')
  );

  return (
    <div className="appt-page">
      {/* Top bar */}
      <header className="appt-topbar">
        <div className="appt-brand">
          <img src={cityCareLogoColored} alt="CityCare" width="32" height="32" />
          <span className="appt-brandName">CityCare</span>
        </div>

        <div className="appt-search">
          <span className="appt-searchIcon">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path d="M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Zm6.2-1.1 4.3 4.3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </span>
          <input className="appt-searchInput" placeholder="Search..." />
        </div>

        <div className="appt-topRight">
          <button className="appt-iconBtn" type="button" aria-label="Notifications">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </button>

          <div className="appt-user">
            <div className="appt-avatar">
              <img className="appt-avatarImg" src="/images/justin.jpg" alt={`${user?.first_name} ${user?.last_name}`} />
            </div>
            <div className="appt-userMeta">
              <div className="appt-userName">{user?.first_name} {user?.last_name}</div>
              <div className="appt-userRole">Clinician</div>
            </div>
          </div>
        </div>
      </header>

      <div className="appt-body">
        {/* Sidebar */}
        <aside className="appt-sidebar">
          <div className="appt-sidebarBox">
            <div className="appt-navHeader">
              <div className="appt-navHeaderPanel">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                </svg>
                <span className="appt-navHeaderTitle">Navigation</span>
              </div>
            </div>

            <div className="appt-sectionTitle">Main</div>

            <nav className="appt-nav">
              <button className={`appt-navItem ${activeNavItem === 'Home' ? 'appt-navItem--active' : ''}`} onClick={() => handleNavigation('Home', '/clinician/dashboard')} type="button">
                <span className="appt-navItemIcon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9,22 9,12 15,12 15,22"/>
                  </svg>
                </span>
                Home
              </button>

              <button className={`appt-navItem ${activeNavItem === 'Appointments' ? 'appt-navItem--active' : ''}`} type="button">
                <span className="appt-navItemIcon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2"/>
                    <path d="M16 2v4M8 2v4M3 10h18"/>
                  </svg>
                </span>
                Appointments
              </button>

              <button className={`appt-navItem ${activeNavItem === 'Patients' ? 'appt-navItem--active' : ''}`} onClick={() => handleNavigation('Patients', '/clinician/patients')} type="button">
                <span className="appt-navItemIcon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </span>
                Patients
              </button>

              <button className={`appt-navItem ${activeNavItem === 'Labs' ? 'appt-navItem--active' : ''}`} onClick={() => handleNavigation('Labs', '/clinician/labs')} type="button">
                <span className="appt-navItemIcon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 3h6v6l3 9H6l3-9V3z"/>
                    <path d="M9 3h6"/>
                  </svg>
                </span>
                Labs
              </button>
            </nav>

            <div className="appt-sectionTitle appt-mt24">Secondary</div>

            <nav className="appt-nav">
              <button className={`appt-navItem ${activeNavItem === 'Profile' ? 'appt-navItem--active' : ''}`} onClick={() => handleNavigation('Profile', '/clinician/profile')} type="button">
                <span className="appt-navItemIcon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="7" r="4"/>
                    <path d="M5.5 21a8.5 8.5 0 0 1 13 0"/>
                  </svg>
                </span>
                Profile
              </button>

              <button className="appt-navItem" type="button">
                <span className="appt-navItemIcon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                </span>
                Help / Support
              </button>
            </nav>

            <button className="appt-logout" type="button" onClick={() => { logout(); navigate('/clinician/signin'); }}>
              <span className="appt-logoutIcon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </span>
              Logout
            </button>
          </div>
        </aside>

        {/* Content */}
        <main className="appt-content">
          <h1 className="appt-pageTitle">Appointments</h1>

          {loading ? (
            <div className="appt-loading">Loading schedule...</div>
          ) : (
            <>
              {/* Upcoming Appointments */}
              <section className="appt-section">
                <div className="appt-sectionHeader">
                  <h2 className="appt-sectionTitleGradient">Upcoming Appointments</h2>
                  <button className="appt-bookBtn" type="button" onClick={() => navigate('/clinician/patients')}>Book Appointment</button>
                </div>

                {upcomingAppointments.length > 0 ? (
                  upcomingAppointments.slice(0, 1).map((appointment) => (
                    <div key={appointment.id} className="appt-upcomingCard">
                      <div className="appt-upcomingHeader">
                        <CalendarIcon />
                        <span className="appt-upcomingDateTime">
                          {formatDate(appointment.startTime)} | {formatTime(appointment.startTime)}
                        </span>
                      </div>

                      <div className="appt-upcomingDetails">
                        <img src="/images/avatar.png" alt={`${appointment.patient?.first_name}`} className="appt-upcomingAvatar" />
                        <div className="appt-upcomingInfo">
                          <h3 className="appt-upcomingName">{appointment.patient?.first_name} {appointment.patient?.last_name}</h3>
                          <p className="appt-upcomingType">{appointment.reasonForVisit || 'Physiotherapy Checkup'}</p>
                        </div>
                        <span className="appt-statusBadge appt-statusCompleted">
                          {appointment.status === 'Confirmed' ? 'Confirmed' : appointment.status}
                        </span>
                      </div>

                      <div className="appt-upcomingActions">
                        <button className="appt-btnPrimary" type="button" onClick={() => navigate(`/clinician/patients`)}>View Details</button>
                        <button className="appt-btnOutline" type="button" onClick={() => alert('Reschedule functionality coming soon')}>Reschedule</button>
                        <button className="appt-btnCancel" type="button" onClick={() => handleCancelAppointment(appointment.id)}>Cancel</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="appt-emptyCard">No upcoming appointments</div>
                )}
              </section>

              {/* Past Appointments */}
              <section className="appt-section">
                <div className="appt-sectionHeader">
                  <h2 className="appt-sectionTitleGradient">Past Appointments</h2>
                  {pastAppointments.length > 4 && (
                    <button className="appt-viewMoreBtn" type="button" onClick={() => alert('View more past appointments')}>View More</button>
                  )}
                </div>

                {pastAppointments.length > 0 ? (
                  <div className="appt-pastGrid">
                    {pastAppointments.slice(0, 4).map((appointment) => (
                      <div key={appointment.id} className="appt-pastCard">
                        <div className="appt-pastHeader">
                          <img src="/images/avatar.png" alt={`${appointment.patient?.first_name}`} className="appt-pastAvatar" />
                          <div className="appt-pastInfo">
                            <div className="appt-pastTopRow">
                              <span className="appt-pastDate">{formatDate(appointment.startTime)}</span>
                              <span className="appt-statusBadgeSmall appt-statusCompleted">Completed</span>
                            </div>
                            <div className="appt-pastTime">{formatTime(appointment.startTime)}</div>
                            <div className="appt-pastName">{appointment.patient?.first_name} {appointment.patient?.last_name}</div>
                            <div className="appt-pastBottomRow">
                              <span className="appt-pastType">{appointment.reasonForVisit || 'General Medicine'}</span>
                              <button className="appt-btnSummary" type="button" onClick={() => navigate('/clinician/patients')}>View Summary</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="appt-emptyCard">No past appointments</div>
                )}
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Appointments;
