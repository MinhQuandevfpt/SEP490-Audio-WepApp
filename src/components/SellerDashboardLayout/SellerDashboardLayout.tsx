import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Settings,
  Store,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Wallet,
  MessageSquare,
  HelpCircle,
  FileText,
  Tag,
  Users
} from 'lucide-react';
import { SellerAuthService } from '../../services/seller/AuthSeller';
import { StoreService } from '../../services/seller/StoreService';
import type { StoreInfo } from '../../types/seller';

const SellerDashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [sellerUserName, setSellerUserName] = useState<string>('');
  const [sellerUserEmail, setSellerUserEmail] = useState<string>('');

  useEffect(() => {
    // Prime UI with seller user info immediately (fallback while store info loads)
    const user = SellerAuthService.getCurrentUser();
    if (user) {
      setSellerUserName(user.full_name || '');
      setSellerUserEmail(user.email || '');
    }

    loadStoreInfo();
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

  const handleLogout = () => {
    SellerAuthService.logout();
    StoreService.clearStoreCache();
    navigate('/seller/login');
  };

  const menuItems = [
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
        { label: 'Sản phẩm hết hàng', path: '/seller/dashboard/products/out-of-stock' }
      ]
    },
    {
      icon: ShoppingCart,
      label: 'Quản lý đơn hàng',
      path: '/seller/dashboard/orders',
      badge: storeInfo?.id ? '5' : null, // Mock badge for demo
      subItems: [
        { label: 'Tất cả đơn hàng', path: '/seller/dashboard/orders' },
        { label: 'Chờ xác nhận', path: '/seller/dashboard/orders/pending' },
        { label: 'Chờ lấy hàng', path: '/seller/dashboard/orders/processing' },
        { label: 'Đang giao', path: '/seller/dashboard/orders/shipping' },
        { label: 'Đã giao', path: '/seller/dashboard/orders/delivered' },
        { label: 'Đơn hủy', path: '/seller/dashboard/orders/cancelled' }
      ]
    },
    {
      icon: Users,
      label: 'Quản lý nhân viên',
      path: '/seller/dashboard/staff',
      badge: null,
      subItems: [
        { label: 'Danh sách nhân viên', path: '/seller/dashboard/staff' },
        { label: 'Tạo nhân viên', path: '/seller/dashboard/staff/create' },
        { label: 'Cập nhật nhân viên', path: '/seller/dashboard/staff/update' },
        { label: 'Xóa thông tin nhân viên', path: '/seller/dashboard/staff/delete' }
      ]
    },
    {
      icon: BarChart3,
      label: 'Báo cáo & Phân tích',
      path: '/seller/dashboard/analytics',
      badge: null
    },
    {
      icon: Wallet,
      label: 'Tài chính',
      path: '/seller/dashboard/finance',
      badge: null,
      subItems: [
        { label: 'Doanh thu', path: '/seller/dashboard/finance/revenue' },
        { label: 'Lịch sử giao dịch', path: '/seller/dashboard/finance/transactions' },
        { label: 'Rút tiền', path: '/seller/dashboard/finance/withdrawal' }
      ]
    },
    {
      icon: Tag,
      label: 'Marketing',
      path: '/seller/dashboard/marketing',
      badge: null,
      subItems: [
        { label: 'Chiến dịch khuyến mãi', path: '/seller/dashboard/campaigns' },
        { label: 'Khuyến mãi', path: '/seller/dashboard/marketing/promotions' },
        { label: 'Voucher', path: '/seller/dashboard/marketing/vouchers' },
        { label: 'Flash Sale', path: '/seller/dashboard/marketing/flash-sale' }
      ]
    },
    {
      icon: MessageSquare,
      label: 'Tin nhắn',
      path: '/seller/dashboard/messages',
      badge: '12' // Mock badge for demo
    },
    {
      icon: FileText,
      label: 'Đánh giá sản phẩm',
      path: '/seller/dashboard/reviews',
      badge: null
    },
    {
      icon: Settings,
      label: 'Cài đặt cửa hàng',
      path: '/seller/dashboard/settings',
      badge: null
    }
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
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

          {/* Right: Notifications & Profile */}
          <div className="flex items-center space-x-4">
            {/* Help */}
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
              <HelpCircle className="w-5 h-5 text-gray-600" />
            </button>

            {/* Notifications */}
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
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
                    to="/seller/dashboard/settings"
                    className="flex items-center px-4 py-2 hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="w-4 h-4 mr-3 text-gray-600" />
                    <span className="text-sm text-gray-700">Cài đặt cửa hàng</span>
                  </Link>
                  
                  <Link
                    to="/seller/dashboard/profile"
                    className="flex items-center px-4 py-2 hover:bg-gray-50 transition-colors"
                  >
                    <User className="w-4 h-4 mr-3 text-gray-600" />
                    <span className="text-sm text-gray-700">Thông tin tài khoản</span>
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
              
              return (
                <div key={index}>
                  <Link
                    to={item.path}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg mb-1 transition-all ${
                      isCurrentActive
                        ? 'bg-orange-50 text-orange-600 font-medium'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-5 h-5 ${isCurrentActive ? 'text-orange-600' : 'text-gray-600'}`} />
                      {isSidebarOpen && (
                        <span className="text-sm">{item.label}</span>
                      )}
                    </div>
                    {isSidebarOpen && item.badge && (
                      <span className="bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                  
                  {/* Sub Items */}
                  {isSidebarOpen && item.subItems && isCurrentActive && (
                    <div className="ml-8 mb-2">
                      {item.subItems.map((subItem, subIndex) => (
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
          className={`flex-1 transition-all duration-300 ${
            isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'
          }`}
        >
          <div className="p-6">
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
