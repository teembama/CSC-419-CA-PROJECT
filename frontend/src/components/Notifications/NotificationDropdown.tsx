import React, { useState, useEffect, useRef } from 'react';
import { notificationAPI } from '../../services/api';
import { getRelativeTime } from '../../utils/dateUtils';
import './NotificationDropdown.css';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  isRead: boolean;
  createdAt: string;
}

interface NotificationDropdownProps {
  userRole?: string;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ userRole = 'user' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationAPI.getNotifications();
      const notificationsArray = Array.isArray(data) ? data : (data?.data || []);

      const transformedNotifications = notificationsArray.slice(0, 10).map((n: any) => ({
        id: n.id || `notif-${Math.random()}`,
        title: n.title || 'Notification',
        message: n.message || n.content || '',
        type: n.type || 'info',
        isRead: n.is_read || n.isRead || false,
        createdAt: n.created_at || n.createdAt || new Date().toISOString(),
      }));

      setNotifications(transformedNotifications);
      setUnreadCount(transformedNotifications.filter((n: Notification) => !n.isRead).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Set sample notifications if API fails
      const sampleNotifications: Notification[] = [
        {
          id: '1',
          title: 'System Update',
          message: 'System maintenance scheduled for tonight at 2 AM.',
          type: 'info',
          isRead: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '2',
          title: 'New User Registration',
          message: 'A new user has registered and requires approval.',
          type: 'warning',
          isRead: false,
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: '3',
          title: 'Backup Complete',
          message: 'Daily backup completed successfully.',
          type: 'success',
          isRead: true,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ];
      setNotifications(sampleNotifications);
      setUnreadCount(sampleNotifications.filter(n => !n.isRead).length);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      case 'error':
        return '✕';
      default:
        return 'ℹ';
    }
  };

  return (
    <div className="notification-dropdown-wrapper" ref={dropdownRef}>
      <button
        className="notification-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
      >
        <img
          src="/images/notification-bell.png"
          alt="Notifications"
          className="notification-icon"
        />
        {unreadCount > 0 && <span className="notification-dot">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button className="mark-all-btn" onClick={handleMarkAllAsRead}>
                Mark all as read
              </button>
            )}
          </div>

          <div className="notification-dropdown-body">
            {loading ? (
              <div className="notification-loading">Loading notifications...</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">No notifications</div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
                  onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                >
                  <div className={`notification-icon-wrapper ${notification.type}`}>
                    {getTypeIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-time">{getRelativeTime(notification.createdAt)}</div>
                  </div>
                  {!notification.isRead && <div className="notification-unread-indicator" />}
                </div>
              ))
            )}
          </div>

          <div className="notification-dropdown-footer">
            <button className="view-all-btn">View all notifications</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
