import { useState, useEffect, useCallback } from 'react';
import { NotificationService, type StoreNotification } from '../services/seller/NotificationService';

export const useSellerNotifications = () => {
  const [notifications, setNotifications] = useState<StoreNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingCount, setIsLoadingCount] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(0);
  const [size, setSize] = useState<number>(20);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // Load unread count
  const loadUnreadCount = useCallback(async () => {
    try {
      setIsLoadingCount(true);
      const count = await NotificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (err: any) {
      console.error('Error loading unread count:', err);
      setUnreadCount(0);
    } finally {
      setIsLoadingCount(false);
    }
  }, []);

  // Load notifications
  const loadNotifications = useCallback(async (pageNum: number = 0, pageSize: number = 20) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await NotificationService.getNotifications(pageNum, pageSize);
      setNotifications(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      setHasMore(!response.last);
      setPage(pageNum);
      setSize(pageSize);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải thông báo');
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      // Update local state
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      // Reload unread count
      await loadUnreadCount();
    } catch (err: any) {
      console.error('Error marking notification as read:', err);
      throw err;
    }
  }, [loadUnreadCount]);

  // Refresh both notifications and count
  const refresh = useCallback(async () => {
    await Promise.all([
      loadNotifications(page, size),
      loadUnreadCount(),
    ]);
  }, [loadNotifications, loadUnreadCount, page, size]);

  // Initial load
  useEffect(() => {
    loadNotifications(0, 20);
    loadUnreadCount();
  }, [loadNotifications, loadUnreadCount]);

  return {
    notifications,
    unreadCount,
    isLoading,
    isLoadingCount,
    error,
    page,
    size,
    totalPages,
    totalElements,
    hasMore,
    loadNotifications,
    loadUnreadCount,
    markAsRead,
    refresh,
    setPage,
    setSize,
  };
};

export default useSellerNotifications;

