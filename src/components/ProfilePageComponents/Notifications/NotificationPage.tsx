import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Empty, Spin, Pagination, Button, Typography, Tag } from 'antd';
import { BellOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { NotificationService, type Notification } from '../../../services/customer/NotificationService';
import { showCenterSuccess, showCenterError } from '../../../utils/notification';

const { Text, Title } = Typography;

const NotificationPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 5;

  // Load notifications
  const loadNotifications = useCallback(async (pageNum: number = 0) => {
    try {
      setLoading(true);
      setError(null);
      const response = await NotificationService.getNotifications(pageNum, pageSize);
      
      setNotifications(response.content || []);
      setTotalElements(response.totalElements || 0);
      setCurrentPage(pageNum + 1);
      
      // Update unread count
      await loadUnreadCount();
    } catch (err: any) {
      console.error('Error loading notifications:', err);
      setError(err?.message || 'Không thể tải thông báo');
      setNotifications([]);
      setTotalElements(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load unread count
  const loadUnreadCount = useCallback(async () => {
    try {
      const count = await NotificationService.getUnreadCount();
      setUnreadCount(count ?? 0);
    } catch (err) {
      console.error('Error loading unread notification count:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadNotifications(0);
  }, [loadNotifications]);

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
      return date.toLocaleDateString('vi-VN', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Vừa xong';
    }
  };

  // Navigate to action URL
  const navigateToActionUrl = (actionUrl: string) => {
    if (!actionUrl) return;

    // Map legacy customer order paths to current customer portal routes
    if (actionUrl === '/customer/orders' || actionUrl === '/customer/orders/') {
      navigate('/orders');
      return;
    }

    if (actionUrl.startsWith('/customer/orders/')) {
      const orderId = actionUrl.substring('/customer/orders/'.length);
      if (orderId) {
        navigate('/orders', { state: { orderId } });
      } else {
        navigate('/orders');
      }
      return;
    }

    navigate(actionUrl);
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.read) {
      try {
        // Optimistic update
        setNotifications(prev =>
          prev.map(n =>
            n.id === notification.id ? { ...n, read: true } : n
          )
        );

        await NotificationService.markAsRead(notification.id);
        setUnreadCount(prev => Math.max(0, prev - 1));
        showCenterSuccess('Đã đánh dấu đã đọc');
      } catch (error) {
        console.error('Error marking notification as read:', error);
        // Revert optimistic update
        setNotifications(prev =>
          prev.map(n =>
            n.id === notification.id ? { ...n, read: false } : n
          )
        );
        showCenterError('Không thể đánh dấu đã đọc');
        loadUnreadCount();
      }
    }

    // Navigate to action URL if available
    if (notification.actionUrl) {
      navigateToActionUrl(notification.actionUrl);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      if (unreadNotifications.length === 0) {
        showCenterSuccess('Tất cả thông báo đã được đọc');
        return;
      }

      // Optimistic update
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(prev => Math.max(0, prev - unreadNotifications.length));

      // Mark all as read
      await Promise.all(
        unreadNotifications.map(n => NotificationService.markAsRead(n.id))
      );

      showCenterSuccess('Đã đánh dấu tất cả là đã đọc');
      await loadUnreadCount();
    } catch (error) {
      console.error('Error marking all as read:', error);
      showCenterError('Không thể đánh dấu tất cả là đã đọc');
      loadNotifications(currentPage - 1);
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadNotifications(page - 1);
  };

  // Get notification type label
  const getNotificationTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'NEW_ORDER': 'Đơn hàng mới',
      'ORDER_CANCELLED': 'Đơn hàng hủy',
      'ORDER_SHIPPED': 'Đơn hàng đang giao',
      'ORDER_DELIVERED': 'Đơn hàng đã giao',
      'ORDER_COMPLETED': 'Đơn hàng hoàn tất',
      'PAYMENT_SUCCESS': 'Thanh toán thành công',
      'PAYMENT_FAILED': 'Thanh toán thất bại',
      'VOUCHER': 'Mã giảm giá',
      'PROMOTION': 'Khuyến mãi',
      'SYSTEM': 'Hệ thống',
    };
    return typeMap[type] || type;
  };

  return (
    <Card
      title={
        <div className="flex items-center justify-between">
          <div>
            <Title level={4} className="!mb-1 !text-gray-900">Thông báo</Title>
            {unreadCount > 0 && (
              <Text type="secondary" className="text-sm">
                Bạn có {unreadCount} thông báo chưa đọc
              </Text>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              type="default"
              icon={<CheckCircleOutlined />}
              onClick={handleMarkAllAsRead}
              style={{
                backgroundColor: 'transparent',
                borderColor: '#f97316',
                color: '#f97316',
                borderRadius: '8px',
                fontWeight: 500
              }}
            >
              Đánh dấu tất cả đã đọc
            </Button>
          )}
        </div>
      }
      className="shadow-sm border-gray-200"
      styles={{ body: { padding: '24px' } }}
    >
      {loading && notifications.length === 0 ? (
        <div className="py-12 text-center">
          <Spin size="large" style={{ color: '#f97316' }} />
          <p className="mt-4 text-gray-500">Đang tải thông báo...</p>
        </div>
      ) : error && notifications.length === 0 ? (
        <div className="py-12 text-center">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Text type="danger" className="text-base mb-4 block">{error}</Text>
                <Button
                  type="primary"
                  onClick={() => loadNotifications(0)}
                  style={{
                    backgroundColor: '#f97316',
                    borderColor: '#f97316',
                    borderRadius: '8px'
                  }}
                >
                  Thử lại
                </Button>
              </div>
            }
          />
        </div>
      ) : notifications.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <div>
              <BellOutlined style={{ fontSize: '48px', color: '#d1d5db', marginBottom: '16px' }} />
              <Text type="secondary" className="text-base">Chưa có thông báo nào</Text>
            </div>
          }
        />
      ) : (
        <>
          <div className="space-y-2">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                hoverable
                onClick={() => handleNotificationClick(notification)}
                className={`cursor-pointer transition-all ${
                  !notification.read ? 'bg-blue-50 border-blue-200' : 'bg-white'
                }`}
                styles={{
                  body: { padding: '16px' }
                }}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                    !notification.read ? 'bg-blue-500' : 'bg-transparent'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <Title
                        level={5}
                        className={`!mb-0 ${
                          !notification.read ? 'text-gray-900 font-semibold' : 'text-gray-700'
                        }`}
                      >
                        {notification.title}
                      </Title>
                      <Text type="secondary" className="text-xs whitespace-nowrap">
                        {formatDate(notification.createdAt)}
                      </Text>
                    </div>
                    <Text className="text-sm text-gray-600 block mb-2">
                      {notification.message}
                    </Text>
                    {notification.type && (
                      <Tag color="default" className="mt-1">
                        {getNotificationTypeLabel(notification.type)}
                      </Tag>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalElements > 0 && (
            <div className="mt-6 flex justify-center">
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={totalElements}
                showSizeChanger={false}
                showQuickJumper
                showTotal={(total, range) =>
                  `${range[0]}-${range[1]} của ${total} thông báo`
                }
                onChange={handlePageChange}
                style={{ marginTop: '24px' }}
              />
            </div>
          )}
        </>
      )}
    </Card>
  );
};

export default NotificationPage;

