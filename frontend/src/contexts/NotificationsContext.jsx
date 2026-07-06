import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { apiFetch } from '../api/apiFetch.js';
import { AlertTriangle, Droplet, ClipboardList, Clock } from 'lucide-react';
import { connectRealtime } from '../lib/realtimeClient.js';
import { getToken } from '../lib/authStorage.js';

const NotificationsContext = createContext();

export function NotificationsProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [readNotificationIds, setReadNotificationIds] = useState(() => {
    try {
      const stored = localStorage.getItem('readNotificationIds');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading readNotificationIds from localStorage:', error);
      return [];
    }
  });
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState(() => {
    try {
      const stored = localStorage.getItem('dismissedNotificationIds');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading dismissedNotificationIds from localStorage:', error);
      return [];
    }
  });
  
  // Refs for latest state (for fetch and markAllAsRead)
  const dismissedRef = useRef(dismissedNotificationIds);
  const readRef = useRef(readNotificationIds);
  const notificationsRef = useRef(notifications);
  const notificationCountRef = useRef(notificationCount);
  
  useEffect(() => {
    dismissedRef.current = dismissedNotificationIds;
  }, [dismissedNotificationIds]);
  
  useEffect(() => {
    readRef.current = readNotificationIds;
  }, [readNotificationIds]);

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);
  
  useEffect(() => {
    notificationCountRef.current = notificationCount;
  }, [notificationCount]);

  // Fetch notifications
  const fetchAllNotifications = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const results = await Promise.allSettled([
        apiFetch('/api/requests?page=1&limit=1000'),
        apiFetch('/api/expiry/expiring-soon'),
        apiFetch('/api/expiry/expired')
      ]);
      
      const [requestsResult, expiryResult, expiredResult] = results;
      
      const requestsData = requestsResult.status === 'fulfilled' ? requestsResult.value : null;
      const expiryData = expiryResult.status === 'fulfilled' ? expiryResult.value : null;
      const expiredData = expiredResult.status === 'fulfilled' ? expiredResult.value : null;

      const newNotifications = [];

      // SOURCE 1: Requests
      if (requestsData) {
        const pendingRequests = Array.isArray(requestsData?.items) 
          ? requestsData.items.filter(
              req => req?.status === 'PENDING' || req?.status === 'NEW'
            ) 
          : [];
        
        pendingRequests.forEach(req => {
          newNotifications.push({
            id: `request-${req.id}`,
            type: 'request',
            icon: 'clipboard',
            message: `New blood request: ${req?.bloodType || 'unknown'} from ${req?.hospital || 'unknown'}`,
            timestamp: req?.created_at ? new Date(req.created_at).toISOString() : new Date().toISOString(),
            url: '/requests'
          });
        });
      }

      // SOURCE 2: Expired batches
      if (expiredData) {
        (Array.isArray(expiredData) ? expiredData : []).forEach(batch => {
          newNotifications.push({
            id: `expired-${batch.batch_id}`,
            type: 'expiry',
            icon: 'alert',
            message: `EXPIRED: ${batch?.blood_type || 'unknown'} batch expired on ${batch?.expiry_date ? new Date(batch.expiry_date).toLocaleDateString() : 'unknown date'} — action required`,
            timestamp: batch?.expiry_date ? new Date(batch.expiry_date).toISOString() : new Date().toISOString(),
            url: '/inventory/alerts'
          });
        });
      }

      // SOURCE 3: Expiring soon
      if (expiryData) {
        (Array.isArray(expiryData) ? expiryData : []).forEach(batch => {
          newNotifications.push({
            id: `expiring-${batch.batch_id}`,
            type: 'expiry',
            icon: 'clock',
            message: `Expiring soon: 1 bag of ${batch?.blood_type || 'unknown'} expires on ${batch?.expiry_date ? new Date(batch.expiry_date).toLocaleDateString() : 'unknown date'}`,
            timestamp: batch?.expiry_date ? new Date(batch.expiry_date).toISOString() : new Date().toISOString(),
            url: '/inventory/alerts'
          });
        });
      }

      // Filter out dismissed notifications
      const filteredNotifications = newNotifications.filter(n => !dismissedRef.current.includes(n.id));
      
      // Compare to current notifications to avoid unnecessary re-renders
      const currentIds = notificationsRef.current.map(n => n.id).sort().join(',');
      const newIds = filteredNotifications.map(n => n.id).sort().join(',');
      
      if (currentIds !== newIds) {
        setNotifications(filteredNotifications);
      }
      
      const unreadCount = filteredNotifications.filter(n => !readRef.current.includes(n?.id)).length;
      if (unreadCount !== notificationCountRef.current) { // only update if count changed
        setNotificationCount(unreadCount || 0);
      }
    } catch (error) {
      console.error('NotificationsContext: Error fetching notifications:', error);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((notificationId) => {
    if (!notificationId) return;
    setReadNotificationIds(prev => {
      if (prev.includes(notificationId)) return prev;
      const newReadIds = [...prev, notificationId];
      try {
        localStorage.setItem('readNotificationIds', JSON.stringify(newReadIds));
      } catch (error) {
        console.error('Error saving readNotificationIds to localStorage:', error);
      }
      return newReadIds;
    });
    // Update count independently, no nested set inside set
    setNotificationCount(prev => {
      const currentNotifs = notificationsRef.current;
      const newReadIds = [...readRef.current, notificationId];
      return currentNotifs.filter(n => !newReadIds.includes(n.id)).length;
    });
  }, []);

  // Dismiss notification
  const dismissNotification = useCallback((notificationId) => {
    if (!notificationId) return;
    setDismissedNotificationIds(prev => {
      const newDismissedIds = [...prev, notificationId];
      try {
        localStorage.setItem('dismissedNotificationIds', JSON.stringify(newDismissedIds));
      } catch (error) {
        console.error('Error saving dismissedNotificationIds to localStorage:', error);
      }
      return newDismissedIds;
    });
    // Update state immediately
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    setReadNotificationIds(prev => {
      const newReadIds = prev.filter(id => id !== notificationId);
      try {
        localStorage.setItem('readNotificationIds', JSON.stringify(newReadIds));
      } catch (error) {
        console.error('Error updating readNotificationIds:', error);
      }
      return newReadIds;
    });
    setNotificationCount(prev => Math.max(0, prev - 1));
  }, []);

  // Mark all as read/dismiss
  const markAllAsRead = useCallback(() => {
    const allIds = notificationsRef.current.map(n => n?.id).filter(Boolean);
    setDismissedNotificationIds(prev => {
      const newDismissedIds = [...new Set([...prev, ...allIds])];
      try {
        localStorage.setItem('dismissedNotificationIds', JSON.stringify(newDismissedIds));
      } catch (error) {
        console.error('Error saving dismissedNotificationIds to localStorage:', error);
      }
      return newDismissedIds;
    });
    setNotifications([]);
    setNotificationCount(0);
  }, []); // No dependencies needed because we use ref

  // Listen for realtime events
  useEffect(() => {
    const socket = connectRealtime();
    if (socket) {
      const handleInventoryUpdated = () => fetchAllNotifications();
      const handleRequestCreated = () => fetchAllNotifications();
      const handleBatchDisposed = () => fetchAllNotifications();
      const handleRequestUpdated = () => fetchAllNotifications();
      
      socket.on('inventory_updated', handleInventoryUpdated);
      socket.on('request_created', handleRequestCreated);
      socket.on('batch_disposed', handleBatchDisposed);
      socket.on('request_updated', handleRequestUpdated);
      
      return () => {
        socket.off('inventory_updated', handleInventoryUpdated);
        socket.off('request_created', handleRequestCreated);
        socket.off('batch_disposed', handleBatchDisposed);
        socket.off('request_updated', handleRequestUpdated);
      };
    }
  }, [fetchAllNotifications]);

  // Initial fetch and polling
  useEffect(() => {
    fetchAllNotifications();
    const interval = setInterval(fetchAllNotifications, 30000); // 30 seconds
    return () => clearInterval(interval);
  }, [fetchAllNotifications]);

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        notificationCount,
        readNotificationIds,
        dismissedNotificationIds,
        markAsRead,
        dismissNotification,
        markAllAsRead,
        fetchAllNotifications
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}
