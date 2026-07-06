
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Menu, Bell, ChevronDown, X, Check, AlertTriangle, Droplet, ClipboardList, Clock } from 'lucide-react';
import { getStoredUser } from '../../lib/authStorage.js';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationsContext.jsx';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '12px 16px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          fontSize: '14px',
          color: '#dc2626',
          margin: '8px'
        }}>
          TopBar Error: {this.state.error?.message}
        </div>
      );
    }
    return this.props.children;
  }
}

export const TopBar = ({ onToggleSidebar = () => {} }) => {
  const user = getStoredUser() || {};
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const {
    notifications,
    notificationCount,
    readNotificationIds,
    markAsRead,
    dismissNotification,
    markAllAsRead
  } = useNotifications();

  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (notification?.id) {
      markAsRead(notification.id);
      dismissNotification(notification.id);
    }
    if (notification?.url) {
      navigate(notification.url);
    }
    setShowDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Group notifications
  const groupedNotifications = useMemo(() => {
    const groups = {
      request: [],
      inventory: [],
      expiry: []
    };
    if (Array.isArray(notifications)) {
      notifications.forEach(n => {
        if (n?.type && groups[n.type]) {
          groups[n.type].push(n);
        }
      });
    }
    return groups;
  }, [notifications]);

  return (
    <ErrorBoundary>
      <div
        className="flex items-center justify-between px-4 sticky top-0 z-40"
        style={{ height: '60px', backgroundColor: 'transparent' }}
      >
        {/* Left Section: Hamburger Menu */}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Menu className="w-6 h-6 text-gray-600" />
        </button>

        {/* Right Section: Grouped elements */}
        <div className="flex items-center gap-6">
          {/* Notifications Bell */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => {
                console.log('Bell clicked!');
                setShowDropdown(!showDropdown);
              }}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
            >
              <Bell className="w-[22px] h-[22px] text-gray-600" />
              {notificationCount > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-xs font-bold text-white bg-red-500 rounded-full"
                >
                  {notificationCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg border border-gray-200 shadow-lg z-50">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
                  {notificationCount > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-xs font-medium text-blue-600 hover:text-blue-700"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                {/* Notifications List */}
                <div className="max-h-96 overflow-y-auto">
                  {!Array.isArray(notifications) || notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                      <Check className="w-10 h-10 mb-2 text-gray-300" />
                      <p className="text-sm">No new notifications</p>
                    </div>
                  ) : (
                    <>
                      {/* Requests group */}
                      {groupedNotifications.request.length > 0 && (
                        <div>
                          <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100">REQUESTS</div>
                          {groupedNotifications.request.map(notification => (
                            <NotificationItem 
                              key={notification?.id}
                              notification={notification}
                              isRead={notification?.id ? readNotificationIds.includes(notification.id) : true}
                              onClick={() => handleNotificationClick(notification)}
                              onDismiss={() => dismissNotification(notification.id)}
                            />
                          ))}
                        </div>
                      )}

                      {/* Expiry alerts group */}
                      {groupedNotifications.expiry.length > 0 && (
                        <div>
                          <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100">EXPIRY ALERTS</div>
                          {groupedNotifications.expiry.map(notification => (
                            <NotificationItem 
                              key={notification?.id}
                              notification={notification}
                              isRead={notification?.id ? readNotificationIds.includes(notification.id) : true}
                              onClick={() => handleNotificationClick(notification)}
                              onDismiss={() => dismissNotification(notification.id)}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex items-center gap-3">
            <div 
              className="flex items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white font-bold text-lg"
              style={{ width: '36px', height: '36px' }}
            >
              {(user?.full_name?.charAt(0) || user?.name?.charAt(0) || 'A').toUpperCase()}
            </div>
            <div className="flex flex-col leading-tight">
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937' }} className="whitespace-nowrap">
                {user?.full_name || user?.name || 'Admin'}
              </span>
              <span style={{ fontSize: '12px', color: '#6b7280' }} className="whitespace-nowrap">
                {user?.role === 'STAFF' ? 'Staff Member' : 'System Admin'}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

// Map icon strings to actual components
const getIcon = (iconName) => {
  switch(iconName) {
    case 'clipboard': return ClipboardList;
    case 'alert': return AlertTriangle;
    case 'clock': return Clock;
    default: return AlertTriangle;
  }
};

// Notification Item Component
function NotificationItem({ notification, isRead, onClick, onDismiss }) {
  const Icon = getIcon(notification?.icon);
  const timeAgo = (date) => {
    if (!date) return 'Recently';
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMin = Math.floor(diffMs / (1000 * 60));
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} hours ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} days ago`;
  };

  return (
    <div 
      className={`w-full px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left flex items-start gap-3 cursor-pointer ${!isRead ? 'bg-blue-50' : ''}`}
      onClick={onClick}
    >
      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${notification?.type === 'expiry' ? 'text-red-500' : 'text-gray-500'}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${!isRead ? 'font-semibold text-gray-800' : 'text-gray-700'}`}>
          {notification?.message || 'Notification'}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {timeAgo(notification?.timestamp)}
        </p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        className="p-1 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 flex-shrink-0"
        title="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
      {!isRead && (
        <span className="w-2 h-2 mt-2 rounded-full bg-blue-500 flex-shrink-0" />
      )}
    </div>
  );
}

export default TopBar;
