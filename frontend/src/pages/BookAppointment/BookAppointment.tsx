import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './BookAppointment.module.css';
import { Button } from '../../components';
import { useAuth } from '../../context';
import { schedulingAPI } from '../../services/api';
import avatar from '../../assets/avatar.png';

interface Clinician {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
}

interface Slot {
  id: string;
  clinicianId: string;
  startTime: string;
  endTime: string;
  status: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const BookAppointment: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Reschedule mode
  const rescheduleBookingId = location.state?.rescheduleBookingId;
  const isReschedule = !!rescheduleBookingId;

  // State
  const [step, setStep] = useState<'clinician' | 'datetime' | 'confirm'>(
    isReschedule ? 'datetime' : 'clinician'
  );
  const [clinicians, setClinicians] = useState<Clinician[]>([]);
  const [selectedClinician, setSelectedClinician] = useState<Clinician | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    location.state?.selectedDate ? new Date(location.state.selectedDate) : null
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [reasonForVisit, setReasonForVisit] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [loadingDates, setLoadingDates] = useState(false);

  // Fetch clinicians on mount and auto-select for reschedule
  useEffect(() => {
    const fetchClinicians = async () => {
      try {
        const data = await schedulingAPI.getClinicians();
        setClinicians(data || []);

        // Auto-select clinician if rescheduling
        if (isReschedule && location.state?.clinicianId) {
          const clinician = data?.find((c: Clinician) => c.id === location.state.clinicianId);
          if (clinician) {
            setSelectedClinician(clinician);
          }
        }
      } catch (err) {
        console.error('Error fetching clinicians:', err);
        setError('Failed to load clinicians');
      }
    };
    fetchClinicians();
  }, [isReschedule, location.state?.clinicianId]);

  // Helper to format date as YYYY-MM-DD without timezone conversion (defined early for use in useEffect)
  const formatDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch available dates for the month when clinician or month changes
  useEffect(() => {
    const fetchAvailableDates = async () => {
      if (!selectedClinician) {
        setAvailableDates(new Set());
        return;
      }

      setLoadingDates(true);
      const dates = new Set<string>();

      // Fetch availability for each day of the visible month
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      try {
        // Fetch slots for each day in parallel (batched)
        const promises = [];
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(year, month, day);
          // Skip past dates
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (date < today) continue;

          // Use local date string to avoid timezone issues
          const dateStr = formatDateString(date);
          promises.push(
            schedulingAPI.getAvailableSlots(selectedClinician.id, dateStr)
              .then(slots => {
                if (slots && slots.length > 0) {
                  dates.add(dateStr);
                }
              })
              .catch(() => {}) // Ignore errors for individual dates
          );
        }

        await Promise.all(promises);
        setAvailableDates(dates);
      } catch (err) {
        console.error('Error fetching available dates:', err);
      } finally {
        setLoadingDates(false);
      }
    };

    fetchAvailableDates();
  }, [selectedClinician, currentMonth]);

  // Fetch available slots when clinician and date are selected
  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedClinician || !selectedDate) {
        setAvailableSlots([]);
        return;
      }

      try {
        // Use local date string to avoid timezone issues
        const dateStr = formatDateString(selectedDate);
        console.log(`[BookAppointment] Fetching slots for clinician ${selectedClinician.id} on ${dateStr}`);
        const data = await schedulingAPI.getAvailableSlots(selectedClinician.id, dateStr);
        console.log('[BookAppointment] Available slots:', data);

        // De-duplicate slots by ID and sort by start time
        const slotMap = new Map<string, Slot>();
        if (data) {
          data.forEach((slot: Slot) => {
            slotMap.set(slot.id, slot);
          });
        }
        const uniqueSlots = Array.from(slotMap.values()).sort((a, b) =>
          new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );

        setAvailableSlots(uniqueSlots);
      } catch (err) {
        console.error('Error fetching slots:', err);
        setAvailableSlots([]);
      }
    };
    fetchSlots();
  }, [selectedClinician, selectedDate]);

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getFullYear() === currentMonth.getFullYear() &&
      today.getMonth() === currentMonth.getMonth() &&
      today.getDate() === day
    );
  };

  const isPastDate = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return checkDate < today;
  };

  const isDateSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getFullYear() === currentMonth.getFullYear() &&
      selectedDate.getMonth() === currentMonth.getMonth() &&
      selectedDate.getDate() === day
    );
  };

  const isDateAvailable = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateStr = formatDateString(date);
    return availableDates.has(dateStr);
  };

  const handleDateClick = (day: number) => {
    if (!isPastDate(day) && isDateAvailable(day)) {
      const selected = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      setSelectedDate(selected);
      setSelectedSlot(null);
    }
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

  const handleSelectClinician = (clinician: Clinician) => {
    setSelectedClinician(clinician);
    setStep('datetime');
  };

  const handleSelectSlot = (slot: Slot) => {
    setSelectedSlot(slot);
  };

  const handleContinueToConfirm = () => {
    if (selectedClinician && selectedSlot) {
      setStep('confirm');
    }
  };

  const handleConfirmBooking = async () => {
    if (!user || !selectedClinician || !selectedSlot) return;

    setLoading(true);
    setError('');

    try {
      if (isReschedule) {
        // Reschedule existing booking
        console.log('[BookAppointment] Rescheduling booking:', {
          bookingId: rescheduleBookingId,
          newSlotId: selectedSlot.id,
        });
        const result = await schedulingAPI.rescheduleBooking(rescheduleBookingId, {
          newSlotId: selectedSlot.id,
        });
        console.log('[BookAppointment] Booking rescheduled successfully:', result);
      } else {
        // Create new booking
        console.log('[BookAppointment] Creating booking with:', {
          patientId: user.id,
          clinicianId: selectedClinician.id,
          slotId: selectedSlot.id,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          reasonForVisit: reasonForVisit || undefined,
        });
        const result = await schedulingAPI.createBooking({
          patientId: user.id,
          clinicianId: selectedClinician.id,
          slotId: selectedSlot.id,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          reasonForVisit: reasonForVisit || undefined,
        });
        console.log('[BookAppointment] Booking created successfully:', result);
      }
      setBookingSuccess(true);
    } catch (err: any) {
      console.error('[BookAppointment] Error:', err);
      console.error('[BookAppointment] Error response:', err?.response?.data);
      setError(err?.response?.data?.message || `Failed to ${isReschedule ? 'reschedule' : 'book'} appointment. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className={styles.dayEmpty}></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const past = isPastDate(day);
      const selected = isDateSelected(day);
      const today = isToday(day);
      const available = isDateAvailable(day);

      let dayClass = styles.day;
      if (!past && available) dayClass += ` ${styles.dayAvailable}`;
      if (!past && !available) dayClass += ` ${styles.dayUnavailable}`;
      if (selected) dayClass += ` ${styles.daySelected}`;
      if (today) dayClass += ` ${styles.dayToday}`;
      if (past) dayClass += ` ${styles.dayPast}`;

      days.push(
        <button
          key={day}
          className={dayClass}
          onClick={() => handleDateClick(day)}
          disabled={past || !available}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  // Success view
  if (bookingSuccess) {
    return (
      <div className={styles.container}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="32" cy="32" r="32" fill="#E8F5E9"/>
              <path d="M20 32L28 40L44 24" stroke="#1FC16B" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className={styles.successTitle}>
            {isReschedule ? 'Appointment Rescheduled!' : 'Appointment Booked!'}
          </h2>
          <p className={styles.successText}>
            Your appointment with Dr. {selectedClinician?.firstName} {selectedClinician?.lastName} has been {isReschedule ? 'rescheduled' : 'confirmed'}.
          </p>
          <div className={styles.successDetails}>
            <p><strong>Date:</strong> {selectedSlot && formatDate(selectedSlot.startTime)}</p>
            <p><strong>Time:</strong> {selectedSlot && formatTime(selectedSlot.startTime)}</p>
          </div>
          <Button onClick={() => navigate('/appointments')} fullWidth>
            View My Appointments
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => navigate('/appointments')}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
        <h1 className={styles.title}>{isReschedule ? 'Reschedule Appointment' : 'Book Appointment'}</h1>
      </div>

      {/* Progress Steps */}
      <div className={styles.progress}>
        {!isReschedule && (
          <>
            <div className={`${styles.progressStep} ${step === 'clinician' || step === 'datetime' || step === 'confirm' ? styles.active : ''}`}>
              <span className={styles.stepNumber}>1</span>
              <span className={styles.stepLabel}>Select Doctor</span>
            </div>
            <div className={styles.progressLine}></div>
          </>
        )}
        <div className={`${styles.progressStep} ${step === 'datetime' || step === 'confirm' ? styles.active : ''}`}>
          <span className={styles.stepNumber}>{isReschedule ? '1' : '2'}</span>
          <span className={styles.stepLabel}>Date & Time</span>
        </div>
        <div className={styles.progressLine}></div>
        <div className={`${styles.progressStep} ${step === 'confirm' ? styles.active : ''}`}>
          <span className={styles.stepNumber}>{isReschedule ? '2' : '3'}</span>
          <span className={styles.stepLabel}>Confirm</span>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* Step 1: Select Clinician */}
      {step === 'clinician' && (
        <div className={styles.stepContent}>
          <h2 className={styles.stepTitle}>Select a Doctor</h2>
          <p className={styles.stepSubtitle}>Choose the doctor you'd like to see</p>

          {clinicians.length === 0 ? (
            <p className={styles.emptyText}>No doctors available at this time.</p>
          ) : (
            <div className={styles.clinicianGrid}>
              {clinicians.map((clinician) => (
                <button
                  key={clinician.id}
                  className={`${styles.clinicianCard} ${selectedClinician?.id === clinician.id ? styles.selected : ''}`}
                  onClick={() => handleSelectClinician(clinician)}
                >
                  <img src={avatar} alt={clinician.name} className={styles.clinicianAvatar} />
                  <div className={styles.clinicianInfo}>
                    <span className={styles.clinicianName}>Dr. {clinician.firstName} {clinician.lastName}</span>
                    <span className={styles.clinicianEmail}>{clinician.email}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Select Date & Time */}
      {step === 'datetime' && (
        <div className={styles.stepContent}>
          <div className={styles.dateTimeLayout}>
            {/* Calendar */}
            <div className={styles.calendarSection}>
              <h2 className={styles.stepTitle}>Select Date</h2>
              <div className={styles.calendarWrapper}>
                <div className={styles.calendar}>
                  <div className={styles.calendarHeader}>
                    <button
                      className={styles.navBtn}
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    <span className={styles.monthYear}>
                      {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </span>
                    <button
                      className={styles.navBtn}
                      onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                    >
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                  </div>

                  <div className={styles.weekDays}>
                    {DAYS.map((day) => (
                      <div key={day} className={styles.weekDay}>{day}</div>
                    ))}
                  </div>

                  <div className={styles.daysGrid}>
                    {renderCalendarDays()}
                  </div>
                </div>
                {loadingDates && (
                  <div className={styles.loadingOverlay}>
                    <span className={styles.loadingText}>Loading availability...</span>
                  </div>
                )}
              </div>

              {/* Legend */}
              <div className={styles.calendarLegend}>
                <div className={styles.legendItem}>
                  <span className={`${styles.legendDot} ${styles.legendDotAvailable}`}></span>
                  <span>Available</span>
                </div>
                <div className={styles.legendItem}>
                  <span className={`${styles.legendDot} ${styles.legendDotUnavailable}`}></span>
                  <span>Unavailable</span>
                </div>
              </div>
            </div>

            {/* Time Slots */}
            <div className={styles.slotsSection}>
              <h2 className={styles.stepTitle}>Select Time</h2>
              {!selectedDate ? (
                <p className={styles.emptyText}>Please select a date first</p>
              ) : availableSlots.length === 0 ? (
                <p className={styles.emptyText}>No available slots for this date</p>
              ) : (
                <div className={styles.slotsGrid}>
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.id}
                      className={`${styles.slotBtn} ${selectedSlot?.id === slot.id ? styles.slotSelected : ''}`}
                      onClick={() => handleSelectSlot(slot)}
                    >
                      {formatTime(slot.startTime)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={styles.stepActions}>
            <Button variant="outline" onClick={() => setStep('clinician')}>Back</Button>
            <Button onClick={handleContinueToConfirm} disabled={!selectedSlot}>Continue</Button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 'confirm' && (
        <div className={styles.stepContent}>
          <h2 className={styles.stepTitle}>Confirm Your Appointment</h2>

          <div className={styles.confirmCard}>
            <div className={styles.confirmRow}>
              <span className={styles.confirmLabel}>Doctor</span>
              <span className={styles.confirmValue}>Dr. {selectedClinician?.firstName} {selectedClinician?.lastName}</span>
            </div>
            <div className={styles.confirmRow}>
              <span className={styles.confirmLabel}>Date</span>
              <span className={styles.confirmValue}>
                {selectedSlot && formatDate(selectedSlot.startTime)}
              </span>
            </div>
            <div className={styles.confirmRow}>
              <span className={styles.confirmLabel}>Time</span>
              <span className={styles.confirmValue}>{selectedSlot && formatTime(selectedSlot.startTime)}</span>
            </div>
          </div>

          <div className={styles.reasonSection}>
            <label className={styles.reasonLabel}>Reason for Visit (Optional)</label>
            <textarea
              className={styles.reasonInput}
              placeholder="Describe your symptoms or reason for the appointment..."
              value={reasonForVisit}
              onChange={(e) => setReasonForVisit(e.target.value)}
              rows={4}
            />
          </div>

          <div className={styles.stepActions}>
            <Button variant="outline" onClick={() => setStep('datetime')}>Back</Button>
            <Button onClick={handleConfirmBooking} disabled={loading}>
              {loading ? 'Booking...' : 'Confirm Booking'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookAppointment;
