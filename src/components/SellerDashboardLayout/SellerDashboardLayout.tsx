import React, { useState, useEffect, useMemo } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  Store,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Wallet,
  MessageSquare,
  FileText,
  Tag,
  ShieldCheck,
  Building2,
  Bell,
  PackageCheck,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { SellerAuthService } from '../../services/seller/AuthSeller';
import { StoreService } from '../../services/seller/StoreService';
import { NotificationService, type StoreNotification } from '../../services/seller/NotificationService';
import { playNotificationSound, hasPlayedNotificationSound, markNotificationSoundPlayed } from '../../utils/notificationSound';
import type { StoreInfo, RiskWarningResponse } from '../../types/seller';

const SellerDashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [sellerUserName, setSellerUserName] = useState<string>('');
  const [sellerUserEmail, setSellerUserEmail] = useState<string>('');
  const [notificationCount, setNotificationCount] = useState<number>(0); // Số lượng thông báo chưa đọc
  const [notifications, setNotifications] = useState<StoreNotification[]>([]); // Danh sách thông báo
  const [notificationsLoading, setNotificationsLoading] = useState<boolean>(false); // Loading state cho notifications
  const [riskWarning, setRiskWarning] = useState<RiskWarningResponse | null>(null); // Risk warning data

  useEffect(() => {
    // Prime UI with seller user info immediately (fallback while store info loads)
    const user = SellerAuthService.getCurrentUser();
    if (user) {
      setSellerUserName(user.full_name || '');
      setSellerUserEmail(user.email || '');
    }

    loadStoreInfo();
    loadNotificationCount();
    loadRiskWarning();

    // Listen for notification read events from NotificationPage
    const handleNotificationRead = (event: CustomEvent<{ unreadCount?: number }>) => {
      if (event.detail?.unreadCount !== undefined) {
        // Update count directly if provided
        setNotificationCount(event.detail.unreadCount);
        // Also reload notifications to sync state
        loadNotifications();
      } else {
        // Otherwise refresh from API
        loadNotificationCount();
        loadNotifications();
      }
    };

    window.addEventListener('sellerNotificationRead', handleNotificationRead as EventListener);
    
    return () => {
      window.removeEventListener('sellerNotificationRead', handleNotificationRead as EventListener);
    };
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.notification-menu') && !target.closest('.profile-menu')) {
        setIsNotificationMenuOpen(false);
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadStoreInfo = async () => {
    try {
      // First try to get cached info
      const cached = StoreService.getCachedStoreInfo();
      if (cached) {
        setStoreInfo(cached);
      }

      // Then fetch fresh data
      const info = await StoreService.getStoreInfo();
      setStoreInfo(info);
    } catch (error) {
      console.error('Error loading store info:', error);
    }
  };

  const loadNotificationCount = async () => {
    try {
      const count = await NotificationService.getUnreadCount();
      setNotificationCount(count);
      
      // Phát âm thanh thông báo nếu có thông báo chưa đọc và chưa phát sau login
      if (count > 0 && !hasPlayedNotificationSound()) {
        // Delay nhỏ để đảm bảo user đã vào trang
        setTimeout(() => {
          playNotificationSound();
          markNotificationSoundPlayed();
        }, 500);
      }
    } catch (error) {
      console.error('Error loading notification count:', error);
      // Set to 0 on error instead of showing incorrect count
      setNotificationCount(0);
    }
  };

  const loadRiskWarning = async () => {
    try {
      const data = await StoreService.getRiskWarning();
      setRiskWarning(data);
    } catch (error) {
      console.error('Error loading risk warning:', error);
      // Don't set to null on error, keep previous value if any
    }
  };

  const loadNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const response = await NotificationService.getNotifications(0, 20);
      setNotifications(response.content || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
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
        // Update count
        setNotificationCount(prev => Math.max(0, prev - 1));
      }

      // Navigate to action URL if available
      if (notification.actionUrl) {
        // Parse actionUrl from API (e.g., "/seller/orders/{orderId}")
        // Convert to dashboard route
        let route = notification.actionUrl;
        
        // If actionUrl starts with /seller/orders/, convert to dashboard orders page
        if (route.startsWith('/seller/orders/')) {
          // Extract order ID from URL if needed
          route = '/seller/dashboard/orders';
        } 
        // If already starts with /seller/dashboard, use as is
        else if (route.startsWith('/seller/dashboard')) {
          // Use as is
        }
        // Otherwise, prepend /seller/dashboard
        else if (route.startsWith('/seller/')) {
          route = `/seller/dashboard${route.substring(7)}`; // Remove '/seller' prefix
        }
        else {
          route = `/seller/dashboard${route}`;
        }
        
        navigate(route);
        setIsNotificationMenuOpen(false);
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
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
      
      // Format full date for older notifications
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
        return <ShoppingCart className="w-4 h-4" />;
      case 'ORDER_CANCELLED':
        return <XCircle className="w-4 h-4" />;
      case 'ORDER_CONFIRMED':
        return <PackageCheck className="w-4 h-4" />;
      case 'ORDER_SHIPPED':
        return <Truck className="w-4 h-4" />;
      case 'ORDER_DELIVERED':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getNotificationColor = (type: string, read: boolean): string => {
    if (read) return 'text-gray-500';
    
    switch (type) {
      case 'NEW_ORDER':
        return 'text-blue-600';
      case 'ORDER_CANCELLED':
        return 'text-red-600';
      case 'ORDER_CONFIRMED':
        return 'text-green-600';
      case 'ORDER_SHIPPED':
        return 'text-orange-600';
      case 'ORDER_DELIVERED':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getNotificationBgColor = (type: string, read: boolean): string => {
    if (read) return 'bg-gray-50';
    
    switch (type) {
      case 'NEW_ORDER':
        return 'bg-blue-50 hover:bg-blue-100';
      case 'ORDER_CANCELLED':
        return 'bg-red-50 hover:bg-red-100';
      case 'ORDER_CONFIRMED':
        return 'bg-green-50 hover:bg-green-100';
      case 'ORDER_SHIPPED':
        return 'bg-orange-50 hover:bg-orange-100';
      case 'ORDER_DELIVERED':
        return 'bg-green-50 hover:bg-green-100';
      default:
        return 'bg-gray-50 hover:bg-gray-100';
    }
  };

  // Get risk warning level info
  const getRiskWarningInfo = (level: string) => {
    switch (level) {
      case 'NONE':
        return {
          text: 'An toàn',
          emoji: '🟢',
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          borderColor: 'border-green-200',
        };
      case 'NOTICE_20':
        return {
          text: 'Có nợ nhẹ',
          emoji: '🔵',
          bgColor: 'bg-blue-50',
          textColor: 'text-blue-700',
          borderColor: 'border-blue-200',
        };
      case 'WARNING_50':
        return {
          text: 'Cảnh báo',
          emoji: '🟡',
          bgColor: 'bg-yellow-50',
          textColor: 'text-yellow-700',
          borderColor: 'border-yellow-200',
        };
      case 'DANGER_80':
        return {
          text: 'Nguy hiểm',
          emoji: '🟠',
          bgColor: 'bg-orange-50',
          textColor: 'text-orange-700',
          borderColor: 'border-orange-200',
        };
      case 'BLOCK_100':
        return {
          text: 'Vượt ngưỡng',
          emoji: '🔴',
          bgColor: 'bg-red-50',
          textColor: 'text-red-700',
          borderColor: 'border-red-200',
        };
      default:
        return {
          text: 'An toàn',
          emoji: '🟢',
          bgColor: 'bg-green-50',
          textColor: 'text-green-700',
          borderColor: 'border-green-200',
        };
    }
  };

  const handleLogout = () => {
    SellerAuthService.logout();
    StoreService.clearStoreCache();
    navigate('/seller/login');
  };

  const menuItems = useMemo(() => [
    {
      icon: LayoutDashboard,
      label: 'Tổng quan',
      path: '/seller/dashboard',
      badge: null
    },
    {
      icon: Package,
      label: 'Quản lý sản phẩm',
      path: '/seller/dashboard/products',
      badge: null,
      subItems: [
        { label: 'Tất cả sản phẩm', path: '/seller/dashboard/products' },
        { label: 'Thêm sản phẩm', path: '/seller/dashboard/products/add' },
        { label: 'Cập nhật sản phẩm', path: '/seller/dashboard/products/update' }
      ]
    },
    {
      icon: Tag,
      label: 'Marketing',
      path: '/seller/dashboard/marketing',
      badge: null,
      subItems: [
        { label: 'Chiến dịch khuyến mãi', path: '/seller/dashboard/campaigns' },
        { label: 'Voucher sản phẩm', path: '/seller/dashboard/marketing/vouchers' },
        { label: 'Voucher toàn cửa hàng', path: '/seller/dashboard/shop-wide-voucher' }
      ]
    },
    {
      icon: ShoppingCart,
      label: 'Quản lý đơn hàng',
      path: '/seller/dashboard/orders',
      badge: storeInfo?.id ? '5' : null, // Mock badge for demo
      subItems: [
        { label: 'Tất cả đơn hàng', path: '/seller/dashboard/orders' },
        { label: 'Hoàn trả sản phẩm', path: '/seller/dashboard/returns' }
      ]
    },
    {
      icon: ShieldCheck,
      label: 'Bảo hành sản phẩm',
      path: '/seller/dashboard/warranty',
      badge: null
    },
    {
      icon: FileText,
      label: 'Đánh giá sản phẩm',
      path: '/seller/dashboard/reviews',
      badge: null
    },
    {
      icon: Store,
      label: 'Quản lý Shop',
      path: '/seller/dashboard/shop',
      badge: null,
      subItems: [
        { label: 'Hồ sơ shop', path: '/seller/dashboard/profile' },
        { label: 'Địa chỉ cửa hàng', path: '/seller/dashboard/store-address' },
        { label: 'Cài đặt cửa hàng', path: '/seller/dashboard/setup-store' }
      ]
    },
    {
      icon: Wallet,
      label: 'Tài chính',
      path: '/seller/dashboard/finance',
      badge: null,
      subItems: [
        { label: 'Ví cửa hàng', path: '/seller/dashboard/finance' },
        { label: 'Chi trả cho cửa hàng', path: '/seller/dashboard/store-payout-v2' }
      ]
    },
    {
      icon: MessageSquare,
      label: 'Tin nhắn',
      path: '/seller/dashboard/messages'
    },
    {
      icon: Bell,
      label: 'Thông báo',
      path: '/seller/dashboard/notifications',
      badge: notificationCount > 0 ? (notificationCount > 9 ? '9+' : String(notificationCount)) : null
    },
    {
      icon: AlertTriangle,
      label: 'Cảnh báo rủi ro',
      path: '/seller/dashboard/risk-warning',
      badge: null
    }
  ], [notificationCount, storeInfo?.id]);

  const isActive = (path: string) => {
    // Exact match only - don't highlight parent when child is active
    return location.pathname === path;
  };

  const toggleExpand = (path: string) => {
    setExpandedItems(prev => prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path]);
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      {/* Top Header */}
      <header className="bg-gradient-to-r from-white via-orange-50 to-white border-b border-orange-100 fixed top-0 left-0 right-0 z-50 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Logo & Menu Toggle */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
            >
              {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            
            <Link to="/seller/dashboard" className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 p-2 rounded-lg">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Kênh Người Bán</h1>
                <p className="text-xs text-gray-500">AudioShop Seller Center</p>
              </div>
            </Link>
          </div>

          {/* Right: Risk Warning, Notifications & Profile */}
          <div className="flex items-center space-x-4">
            {/* Risk Warning Badge */}
            {riskWarning && (
              <Link
                to="/seller/dashboard/risk-warning"
                className={`${getRiskWarningInfo(riskWarning.warningLevel).bgColor} ${getRiskWarningInfo(riskWarning.warningLevel).textColor} px-3 py-1.5 rounded-lg text-sm font-medium border ${getRiskWarningInfo(riskWarning.warningLevel).borderColor} hover:opacity-90 transition-opacity flex items-center gap-1.5`}
              >
                <span className="text-base">{getRiskWarningInfo(riskWarning.warningLevel).emoji}</span>
                <span className="hidden sm:inline">{getRiskWarningInfo(riskWarning.warningLevel).text}</span>
              </Link>
            )}

            {/* Notification Bell */}
            <div className="relative notification-menu">
              <button
                onClick={() => {
                  const willOpen = !isNotificationMenuOpen;
                  setIsNotificationMenuOpen(willOpen);
                  setIsProfileMenuOpen(false);
                  // Load notifications and count when opening dropdown
                  if (willOpen) {
                    loadNotificationCount();
                    loadNotifications();
                  }
                }}
                className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="hidden md:block text-sm font-medium text-gray-700">Thông báo</span>
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Menu */}
              {isNotificationMenuOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 max-h-96 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-800">Thông báo</h3>
                      {notificationCount > 0 && (
                        <span className="text-xs text-gray-500">{notificationCount} thông báo mới</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Notification List */}
                  <div className="py-2">
                    {notificationsLoading ? (
                      <div className="px-4 py-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
                        <p className="text-sm text-gray-500">Đang tải thông báo...</p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Bell className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Không có thông báo</p>
                      </div>
                    ) : (
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.map((notification) => (
                          <button
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`w-full text-left px-4 py-3 border-b border-gray-100 transition-colors ${getNotificationBgColor(notification.type, notification.read)}`}
                          >
                            <div className="flex items-start space-x-3">
                              {/* Icon */}
                              <div className={`flex-shrink-0 mt-0.5 ${getNotificationColor(notification.type, notification.read)}`}>
                                {getNotificationIcon(notification.type)}
                              </div>
                              
                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <p className={`text-sm font-medium ${notification.read ? 'text-gray-600' : 'text-gray-900'}`}>
                                    {notification.title}
                                  </p>
                                  {!notification.read && (
                                    <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1"></span>
                                  )}
                                </div>
                                <p className={`text-xs mt-1 ${notification.read ? 'text-gray-500' : 'text-gray-700'}`}>
                                  {notification.message}
                                </p>
                                <div className="flex items-center space-x-2 mt-2">
                                  <Clock className="w-3 h-3 text-gray-400" />
                                  <span className="text-xs text-gray-400">
                                    {formatNotificationTime(notification.createdAt)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {notificationCount > 0 && (
                    <div className="px-4 py-2 border-t border-gray-100">
                      <Link
                        to="/seller/dashboard/notifications"
                        className="block text-center text-sm text-orange-600 hover:text-orange-700 font-medium"
                        onClick={() => setIsNotificationMenuOpen(false)}
                      >
                        Xem tất cả thông báo
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative profile-menu">
              <button
                onClick={() => {
                  setIsProfileMenuOpen(!isProfileMenuOpen);
                  setIsNotificationMenuOpen(false);
                }}
                className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {/* Store Logo or Default Icon */}
                <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border-2 border-gray-200">
                  {storeInfo?.logoUrl ? (
                    <img 
                      src={storeInfo.logoUrl} 
                      alt={storeInfo.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-r from-orange-400 to-red-400 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-800">
                      {storeInfo?.name || sellerUserName || '—'}
                  </p>
                  <p className="text-xs text-gray-500">
                      {storeInfo?.email || sellerUserEmail || ''}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </button>

              {/* Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-800">{storeInfo?.name || sellerUserName || '—'}</p>
                    <p className="text-xs text-gray-500">{storeInfo?.email || sellerUserEmail || ''}</p>
                    <div className="mt-2">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                        storeInfo?.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-700'
                          : storeInfo?.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {storeInfo?.status || 'INACTIVE'}
                      </span>
                    </div>
                  </div>
                  
                  <Link
                    to="/seller/dashboard/profile"
                    className="flex items-center px-4 py-2 hover:bg-gray-50 transition-colors"
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    <Building2 className="w-4 h-4 mr-3 text-gray-600" />
                    <span className="text-sm text-gray-700">Hồ sơ shop</span>
                  </Link>
                  
                  <Link
                    to="/seller/dashboard/settings"
                    className="flex items-center px-4 py-2 hover:bg-gray-50 transition-colors"
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    <Settings className="w-4 h-4 mr-3 text-gray-600" />
                    <span className="text-sm text-gray-700">Cài đặt cửa hàng</span>
                  </Link>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2 hover:bg-gray-50 transition-colors text-left border-t border-gray-100 mt-2"
                  >
                    <LogOut className="w-4 h-4 mr-3 text-red-600" />
                    <span className="text-sm text-red-600">Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex pt-16">
        {/* Sidebar */}
        <aside
          className={`fixed left-0 top-16 bottom-0 bg-white border-r border-gray-200 transition-all duration-300 z-40 overflow-y-auto ${
            isSidebarOpen ? 'w-64' : 'w-0 lg:w-20'
          }`}
        >
          <nav className="p-2">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              const isCurrentActive = isActive(item.path);
              const isExpanded = expandedItems.includes(item.path);
              const hasSubItems = item.subItems && item.subItems.length > 0;

              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1 rounded-lg transition-all">
                    {hasSubItems ? (
                      // Parent menu item with submenu - just toggle, don't navigate, never highlight
                      <button
                        onClick={() => toggleExpand(item.path)}
                        className="flex items-center px-4 py-3 rounded-lg flex-1 transition-all text-left text-gray-700 hover:bg-gray-50"
                      >
                        <Icon className="w-5 h-5 text-gray-600" />
                        {isSidebarOpen && (
                          <span className="ml-3 text-sm">{item.label}</span>
                        )}
                      </button>
                    ) : (
                      // Regular menu item - navigate normally
                      <Link
                        to={item.path}
                        className={`flex items-center px-4 py-3 rounded-lg flex-1 transition-all ${
                          isCurrentActive ? 'text-orange-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className={`w-5 h-5 ${isCurrentActive ? 'text-orange-600' : 'text-gray-600'}`} />
                        {isSidebarOpen && (
                          <span className="ml-3 text-sm">{item.label}</span>
                        )}
                      </Link>
                    )}

                    {isSidebarOpen && hasSubItems && (
                      <button
                        onClick={() => toggleExpand(item.path)}
                        className="p-2 mr-2 rounded hover:bg-gray-100"
                        aria-label="Toggle submenu"
                      >
                        <ChevronDown className={`w-4 h-4 text-gray-500 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                    {isSidebarOpen && item.badge && (
                      <span className="bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-full mr-3">
                        {item.badge}
                      </span>
                    )}
                  </div>

                  {/* Sub Items */}
                  {isSidebarOpen && hasSubItems && isExpanded && (
                    <div className="ml-8 mb-2">
                      {item.subItems!.map((subItem, subIndex) => (
                        <Link
                          key={subIndex}
                          to={subItem.path}
                          className={`block px-4 py-2 text-sm rounded-lg transition-colors ${
                            location.pathname === subItem.path
                              ? 'text-orange-600 font-medium bg-orange-50'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main
          className={`flex-1 transition-all duration-300 overflow-x-hidden ${
            isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
          }`}
        >
          <div className="p-6 max-w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default SellerDashboardLayout;
