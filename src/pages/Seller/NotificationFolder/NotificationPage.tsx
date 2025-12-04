import React, { useState, useEffect, useCallback } from 'react';
import { Clock } from 'lucide-react';
import { Input, Card, Pagination, Button, Space, Tag, Empty, Spin, message } from 'antd';
import { 
  SearchOutlined, 
  CheckCircleOutlined, 
  ShoppingCartOutlined, 
  CloseCircleOutlined, 
  TruckOutlined, 
  InboxOutlined,
  BellOutlined
} from '@ant-design/icons';
import { NotificationService, type StoreNotification } from '../../../services/seller/NotificationService';
import { useNavigate } from 'react-router-dom';

const NotificationPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<StoreNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1); // Ant Design uses 1-based pagination
  const [pageSize, setPageSize] = useState<number>(20);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [keyword, setKeyword] = useState<string>('');

  useEffect(() => {
    loadNotifications();
  }, [page, pageSize, keyword]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      // Convert to 0-based for API
      const apiPage = page - 1;
      const response = await NotificationService.getNotifications(apiPage, pageSize, keyword);
      setNotifications(response.content || []);
      setTotalElements(response.totalElements || 0);
    } catch (error) {
      console.error('Error loading notifications:', error);
      message.error('Không thể tải thông báo. Vui lòng thử lại.');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = useCallback((value: string) => {
    setKeyword(value);
    setPage(1); // Reset to first page when searching
  }, []);

  const handlePageChange = (newPage: number, newPageSize?: number) => {
    setPage(newPage);
    if (newPageSize && newPageSize !== pageSize) {
      setPageSize(newPageSize);
    }
  };

  const handleNotificationClick = async (notification: StoreNotification) => {
    try {
      // Mark as read if not already read
      if (!notification.read) {
        await NotificationService.markAsRead(notification.id);
        // Update local state
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
        );
        message.success('Đã đánh dấu đã đọc');
      }

      // Navigate to action URL if available
      if (notification.actionUrl) {
        let route = notification.actionUrl;
        
        if (route.startsWith('/seller/orders/')) {
          route = '/seller/dashboard/orders';
        } else if (route.startsWith('/seller/dashboard')) {
          // Use as is
        } else if (route.startsWith('/seller/')) {
          route = `/seller/dashboard${route.substring(7)}`;
        } else {
          route = `/seller/dashboard${route}`;
        }
        
        navigate(route);
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
      message.error('Không thể xử lý thông báo. Vui lòng thử lại.');
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      if (unreadNotifications.length === 0) {
        message.info('Tất cả thông báo đã được đánh dấu đã đọc');
        return;
      }
      
      await Promise.all(unreadNotifications.map(n => NotificationService.markAsRead(n.id)));
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      message.success(`Đã đánh dấu ${unreadNotifications.length} thông báo đã đọc`);
    } catch (error) {
      console.error('Error marking all as read:', error);
      message.error('Không thể đánh dấu tất cả đã đọc. Vui lòng thử lại.');
    }
  };

  const formatNotificationTime = (dateString: string): string => {
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
      
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch {
      return dateString;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'NEW_ORDER':
        return <ShoppingCartOutlined style={{ fontSize: '20px' }} />;
      case 'ORDER_CANCELLED':
        return <CloseCircleOutlined style={{ fontSize: '20px' }} />;
      case 'ORDER_CONFIRMED':
        return <InboxOutlined style={{ fontSize: '20px' }} />;
      case 'ORDER_SHIPPED':
        return <TruckOutlined style={{ fontSize: '20px' }} />;
      case 'ORDER_DELIVERED':
        return <CheckCircleOutlined style={{ fontSize: '20px' }} />;
      default:
        return <BellOutlined style={{ fontSize: '20px' }} />;
    }
  };

  const getNotificationColor = (type: string, read: boolean): string => {
    if (read) return '#8c8c8c';
    
    switch (type) {
      case 'NEW_ORDER':
        return '#1890ff'; // blue
      case 'ORDER_CANCELLED':
        return '#ff4d4f'; // red
      case 'ORDER_CONFIRMED':
        return '#52c41a'; // green
      case 'ORDER_SHIPPED':
        return '#fa8c16'; // orange
      case 'ORDER_DELIVERED':
        return '#52c41a'; // green
      default:
        return '#595959';
    }
  };

  const getNotificationTagColor = (type: string): string => {
    switch (type) {
      case 'NEW_ORDER':
        return 'blue';
      case 'ORDER_CANCELLED':
        return 'red';
      case 'ORDER_CONFIRMED':
        return 'green';
      case 'ORDER_SHIPPED':
        return 'orange';
      case 'ORDER_DELIVERED':
        return 'green';
      default:
        return 'default';
    }
  };

  const getNotificationTypeLabel = (type: string): string => {
    switch (type) {
      case 'NEW_ORDER':
        return 'Đơn hàng mới';
      case 'ORDER_CANCELLED':
        return 'Đơn hàng bị hủy';
      case 'ORDER_CONFIRMED':
        return 'Đơn hàng đã xác nhận';
      case 'ORDER_SHIPPED':
        return 'Đơn hàng đã gửi';
      case 'ORDER_DELIVERED':
        return 'Đơn hàng đã giao';
      default:
        return 'Thông báo';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Thông báo</h1>
          <p className="text-gray-600 mt-1">
            {totalElements > 0 ? `${totalElements} thông báo` : 'Không có thông báo'}
            {unreadCount > 0 && ` • ${unreadCount} chưa đọc`}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            type="primary"
            onClick={markAllAsRead}
            className="bg-orange-500 hover:bg-orange-600 border-orange-500"
          >
            Đánh dấu tất cả đã đọc
          </Button>
        )}
      </div>

      {/* Search Bar */}
      <Card>
        <Input.Search
          placeholder="Tìm kiếm thông báo (tiêu đề, nội dung)..."
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          onSearch={handleSearch}
          onChange={(e) => {
            if (!e.target.value) {
              handleSearch('');
            }
          }}
          className="w-full"
        />
      </Card>

      {/* Notifications List */}
      <Spin spinning={loading}>
        {!loading && notifications.length === 0 ? (
          <Card>
            <Empty
              image={<BellOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
              description={
                <span>
                  {keyword ? 'Không tìm thấy thông báo nào' : 'Không có thông báo'}
                  {keyword && (
                    <div className="mt-2 text-sm text-gray-500">
                      Thử tìm kiếm với từ khóa khác
                    </div>
                  )}
                </span>
              }
            >
              {!keyword && (
                <p className="text-gray-400 text-sm mt-2">
                  Bạn sẽ nhận được thông báo khi có đơn hàng mới hoặc cập nhật
                </p>
              )}
            </Empty>
          </Card>
        ) : (
          <Space direction="vertical" size="middle" className="w-full">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                hoverable
                onClick={() => handleNotificationClick(notification)}
                className={`cursor-pointer transition-all ${
                  !notification.read ? 'border-l-4' : ''
                }`}
                style={{
                  borderLeftColor: !notification.read ? getNotificationColor(notification.type, false) : undefined,
                  borderLeftWidth: !notification.read ? '4px' : undefined,
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div
                    style={{
                      color: getNotificationColor(notification.type, notification.read),
                      flexShrink: 0,
                    }}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <div className="flex-1">
                        <Space size="small" className="mb-2">
                          <Tag color={getNotificationTagColor(notification.type)}>
                            {getNotificationTypeLabel(notification.type)}
                          </Tag>
                          {!notification.read && (
                            <Tag color="blue" className="rounded-full">
                              Mới
                            </Tag>
                          )}
                        </Space>
                        <h3
                          className={`text-base font-semibold mb-2 ${
                            notification.read ? 'text-gray-600' : 'text-gray-900'
                          }`}
                        >
                          {notification.title}
                        </h3>
                      </div>
                    </div>
                    
                    <p
                      className={`text-sm mb-3 ${
                        notification.read ? 'text-gray-500' : 'text-gray-700'
                      }`}
                    >
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Clock size={14} />
                      <span>{formatNotificationTime(notification.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </Space>
        )}
      </Spin>

      {/* Pagination */}
      {totalElements > 0 && (
        <div className="flex justify-center pt-4">
          <Pagination
            current={page}
            pageSize={pageSize}
            total={totalElements}
            onChange={handlePageChange}
            onShowSizeChange={handlePageChange}
            showSizeChanger
            showQuickJumper
            showTotal={(total, range) =>
              `${range[0]}-${range[1]} của ${total} thông báo`
            }
            pageSizeOptions={['10', '20', '50', '100']}
            className="text-center"
          />
        </div>
      )}
    </div>
  );
};

export default NotificationPage;

