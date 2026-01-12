import React, { useState } from 'react';
import styles from './AppointmentCalendarModal.module.css';

interface AppointmentCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDate: (date: Date) => void;
}

// Mock available dates (dates when doctors are available)
const availableDates = [
  new Date(2026, 0, 8),  // Jan 8
  new Date(2026, 0, 9),  // Jan 9
  new Date(2026, 0, 10), // Jan 10
  new Date(2026, 0, 13), // Jan 13
  new Date(2026, 0, 14), // Jan 14
  new Date(2026, 0, 15), // Jan 15
  new Date(2026, 0, 16), // Jan 16
  new Date(2026, 0, 17), // Jan 17
  new Date(2026, 0, 20), // Jan 20
  new Date(2026, 0, 21), // Jan 21
  new Date(2026, 0, 22), // Jan 22
  new Date(2026, 0, 23), // Jan 23
  new Date(2026, 0, 24), // Jan 24
  new Date(2026, 0, 27), // Jan 27
  new Date(2026, 0, 28), // Jan 28
  new Date(2026, 0, 29), // Jan 29
  new Date(2026, 0, 30), // Jan 30
  new Date(2026, 0, 31), // Jan 31
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Arrow icons
const ChevronLeftIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronRightIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CloseIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CalendarIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="18" rx="2" stroke="url(#cal_grad)" strokeWidth="2"/>
    <path d="M16 2V6" stroke="url(#cal_grad)" strokeWidth="2" strokeLinecap="round"/>
    <path d="M8 2V6" stroke="url(#cal_grad)" strokeWidth="2" strokeLinecap="round"/>
    <path d="M3 10H21" stroke="url(#cal_grad)" strokeWidth="2"/>
    <defs>
      <linearGradient id="cal_grad" x1="3" y1="2" x2="21" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#03A5FF"/>
        <stop offset="1" stopColor="#1FC16B"/>
      </linearGradient>
    </defs>
  </svg>
);

export const AppointmentCalendarModal: React.FC<AppointmentCalendarModalProps> = ({
  isOpen,
  onClose,
  onSelectDate,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0, 1)); // January 2026
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isDateAvailable = (day: number) => {
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return availableDates.some(
      (d) =>
        d.getFullYear() === checkDate.getFullYear() &&
        d.getMonth() === checkDate.getMonth() &&
        d.getDate() === checkDate.getDate()
    );
  };

  const isDateSelected = (day: number) => {
    if (!selectedDate) return false;
    return (
      selectedDate.getFullYear() === currentDate.getFullYear() &&
      selectedDate.getMonth() === currentDate.getMonth() &&
      selectedDate.getDate() === day
    );
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getFullYear() === currentDate.getFullYear() &&
      today.getMonth() === currentDate.getMonth() &&
      today.getDate() === day
    );
  };

  const isPastDate = (day: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return checkDate < today;
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day: number) => {
    if (isDateAvailable(day) && !isPastDate(day)) {
      const selected = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      setSelectedDate(selected);
    }
  };

  const handleConfirm = () => {
    if (selectedDate) {
      onSelectDate(selectedDate);
      onClose();
    }
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className={styles.dayEmpty}></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const available = isDateAvailable(day);
      const selected = isDateSelected(day);
      const today = isToday(day);
      const past = isPastDate(day);

      let dayClass = styles.day;
      if (available && !past) dayClass += ` ${styles.dayAvailable}`;
      if (selected) dayClass += ` ${styles.daySelected}`;
      if (today) dayClass += ` ${styles.dayToday}`;
      if (past) dayClass += ` ${styles.dayPast}`;

      days.push(
        <button
          key={day}
          className={dayClass}
          onClick={() => handleDateClick(day)}
          disabled={!available || past}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <CalendarIcon />
            <span>Book an Appointment</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <p className={styles.subtitle}>Select a date when doctors are available</p>

        <div className={styles.calendarContainer}>
          <div className={styles.calendarHeader}>
            <button className={styles.navBtn} onClick={handlePrevMonth}>
              <ChevronLeftIcon />
            </button>
            <span className={styles.monthYear}>
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <button className={styles.navBtn} onClick={handleNextMonth}>
              <ChevronRightIcon />
            </button>
          </div>

          <div className={styles.weekDays}>
            {DAYS.map((day) => (
              <div key={day} className={styles.weekDay}>
                {day}
              </div>
            ))}
          </div>

          <div className={styles.daysGrid}>{renderCalendarDays()}</div>
        </div>

        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendAvailable}`}></span>
            <span>Available</span>
          </div>
          <div className={styles.legendItem}>
            <span className={`${styles.legendDot} ${styles.legendUnavailable}`}></span>
            <span>Unavailable</span>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            className={styles.confirmBtn}
            onClick={handleConfirm}
            disabled={!selectedDate}
          >
            Confirm Date
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentCalendarModal;
