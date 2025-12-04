import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { NotificationService, type Notification } from '../../services/customer/NotificationService';
import { CustomerAuthService } from '../../services/customer/Authcustomer';

const NotificationDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const isAuthenticated = CustomerAuthService.isAuthenticated();

  const loadUnreadCount = async () => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    try {
      const count = await NotificationService.getUnreadCount();
      setUnreadCount(count ?? 0);
    } catch (err) {
      console.error('Error loading unread notification count:', err);
    }
  };

  // Load notifications
  const loadNotifications = async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await NotificationService.getNotifications(0, 20);
      setNotifications(response.content || []);
      await loadUnreadCount();
    } catch (err: any) {
      console.error('Error loading notifications:', err);
      setError(err?.message || 'Không thể tải thông báo');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // Load notifications on mount and when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
      loadUnreadCount();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Vừa xong';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      if (diffHours < 24) return `${diffHours} giờ trước`;
      if (diffDays < 7) return `${diffDays} ngày trước`;
      return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return 'Vừa xong';
    }
  };

  const navigateToActionUrl = (actionUrl: string) => {
    if (!actionUrl) return;

    // Map legacy customer order paths to current customer portal routes
    if (actionUrl === '/customer/orders' || actionUrl === '/customer/orders/') {
      navigate('/orders');
      setIsOpen(false);
      return;
    }

    if (actionUrl.startsWith('/customer/orders/')) {
      const orderId = actionUrl.substring('/customer/orders/'.length);
      if (orderId) {
        navigate('/orders', { state: { orderId } });
      } else {
        navigate('/orders');
      }
      setIsOpen(false);
      return;
    }

    navigate(actionUrl);
    setIsOpen(false);
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.read) {
      try {
        // Optimistic update: update local state immediately
        setNotifications(prev => 
          prev.map(n => 
            n.id === notification.id ? { ...n, read: true } : n
          )
        );
        
        // Call API to mark as read
        await NotificationService.markAsRead(notification.id);
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error marking notification as read:', error);
        // Revert optimistic update on error
        setNotifications(prev => 
          prev.map(n => 
            n.id === notification.id ? { ...n, read: false } : n
          )
        );
        // Reload unread count to ensure accuracy
        loadUnreadCount();
      }
    }

    // Navigate to action URL if available
    if (notification.actionUrl) {
      navigateToActionUrl(notification.actionUrl);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => {
          if (isAuthenticated) {
            setIsOpen(!isOpen);
            if (!isOpen) {
              loadNotifications();
            }
          } else {
            navigate('/auth/login');
          }
        }}
        className="relative group"
      >
        <div className="flex items-center text-blue-600 hover:text-blue-700">
          <Bell className="w-5 h-5" />
        </div>
        {isAuthenticated && unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && isAuthenticated && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Thông báo</h3>
            {unreadCount > 0 && (
              <span className="text-sm text-gray-600">
                {unreadCount} chưa đọc
              </span>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Đang tải thông báo...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center">
                <p className="text-sm text-red-600">{error}</p>
                <button
                  onClick={loadNotifications}
                  className="mt-2 text-sm text-orange-500 hover:text-orange-600"
                >
                  Thử lại
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Chưa có thông báo nào</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                        !notification.read ? 'bg-blue-500' : 'bg-transparent'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className={`text-sm font-medium ${
                            !notification.read ? 'text-gray-900 font-semibold' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h4>
                          <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                            {formatDate(notification.createdAt)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                          {notification.message}
                        </p>
                        {notification.type && (
                          <span className="mt-2 inline-block text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                            {notification.type === 'NEW_ORDER' ? 'Đơn hàng mới' :
                             notification.type === 'ORDER_CANCELLED' ? 'Đơn hàng hủy' :
                             notification.type}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <Link
                to="/account/notifications"
                onClick={() => setIsOpen(false)}
                className="block w-full bg-orange-500 text-white text-center px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-medium text-sm"
              >
                Xem tất cả thông báo
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;

