import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Store, 
  ShoppingCart, 
  BarChart3, 
  Settings,
  ChevronRight,
  LogOut,
  Zap,
  Image,
  FileText
} from 'lucide-react';
import { AdminAuthService } from '../../services/admin/AdminAuthService';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  permission?: string;
  children?: NavigationItem[];
}

const AdminSidebar: React.FC = () => {
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const currentUser = AdminAuthService.getCurrentUser();

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(item => item !== itemName)
        : [...prev, itemName]
    );
  };

  const handleLogout = () => {
    AdminAuthService.logout();
    navigate('/admin/login');
  };

  // Navigation items with permissions
  const navigationItems: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: <LayoutDashboard className="w-6 h-6" />
    },
    {
      name: 'Quản lý người dùng',
      href: '/admin/users',
      permission: 'manage_users',
      icon: <Users className="w-6 h-6" />,
      children: [
        { name: 'Khách hàng', href: '/admin/users/customers', icon: null },
        { name: 'Người bán', href: '/admin/users/sellers', icon: null },
        { name: 'Admin', href: '/admin/users/admins', icon: null, permission: 'manage_system' }
      ]
    },
    {
      name: 'Quản lý cửa hàng',
      href: '/admin/stores',
      permission: 'manage_products',
      icon: <Store className="w-6 h-6" />,
      children: [
        { name: 'Mục lục sản phẩm', href: '/admin/categories', icon: null },
        { name: 'Tất cả cửa hàng', href: '/admin/stores/all', icon: null },
        { name: 'Yêu cầu KYC', href: '/admin/stores/kyc', icon: null },
        { name: 'Cửa hàng đã duyệt', href: '/admin/stores/approved', icon: null },
        { name: 'Cửa hàng bị khóa', href: '/admin/stores/blocked', icon: null }
      ]
    },
    {
      name: 'Quản lý đơn hàng',
      href: '/admin/orders',
      icon: <ShoppingCart className="w-6 h-6" />,
      children: [
        { name: 'Tất cả đơn hàng', href: '/admin/orders/all', icon: null },
        { name: 'Chờ xử lý', href: '/admin/orders/pending', icon: null },
        { name: 'Đang giao', href: '/admin/orders/shipping', icon: null },
        { name: 'Hoàn thành', href: '/admin/orders/completed', icon: null },
        { name: 'Đã hủy', href: '/admin/orders/cancelled', icon: null }
      ]
    },
    {
      name: 'Chiến dịch khuyến mãi',
      href: '/admin/campaigns',
      icon: <Zap className="w-6 h-6" />,
      children: [
        { name: 'Tất cả chiến dịch', href: '/admin/campaigns', icon: null },
        { name: 'Tạo chiến dịch mới', href: '/admin/campaigns/create', icon: null },
        { name: 'Duyệt sản phẩm chiến dịch', href: '/admin/campaigns/products/approval', icon: null }
      ]
    },
    {
      name: 'Quản lý Banner',
      href: '/admin/banners',
      icon: <Image className="w-6 h-6" />,
      children: [
        { name: 'Tất cả banner', href: '/admin/banners', icon: null },
        { name: 'Tạo banner mới', href: '/admin/banners/create', icon: null }
      ]
    },
    {
      name: 'Quản lý Chính Sách',
      href: '/admin/policies',
      icon: <FileText className="w-6 h-6" />
    },
    {
      name: 'Báo cáo & Thống kê',
      href: '/admin/reports',
      icon: <BarChart3 className="w-6 h-6" />,
      children: [
        { name: 'Doanh thu', href: '/admin/reports/revenue', icon: null },
        { name: 'Thanh toán cửa hàng', href: '/admin/reports/payout', icon: null },
        { name: 'Sản phẩm bán chạy', href: '/admin/reports/bestsellers', icon: null },
        { name: 'Khách hàng', href: '/admin/reports/customers', icon: null },
        { name: 'Người bán', href: '/admin/reports/sellers', icon: null }
      ]
    },
    {
      name: 'Cài đặt hệ thống',
      href: '/admin/settings',
      permission: 'manage_system',
      icon: <Settings className="w-6 h-6" />,
      children: [
        { name: 'Cấu hình chung', href: '/admin/settings/general', icon: null },
        { name: 'Thanh toán', href: '/admin/settings/payment', icon: null },
        { name: 'Giao hàng', href: '/admin/settings/shipping', icon: null },
        { name: 'Email Templates', href: '/admin/settings/email', icon: null }
      ]
    }
  ];

  // Render navigation items without permission checks (simplified for now)
  const filteredNavigationItems = navigationItems;

  const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
    const isExpanded = expandedItems.includes(item.name);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.name}>
        {hasChildren ? (
          <button
            onClick={() => toggleExpanded(item.name)}
            className={`
              group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200
              ${level === 0 
                ? 'text-gray-600 hover:bg-gray-50 hover:text-gray-900' 
                : 'text-gray-500 hover:text-gray-700 pl-11'
              }
            `}
          >
            {level === 0 && item.icon}
            <span className={level === 0 ? 'ml-3' : ''}>{item.name}</span>
            <ChevronRight
              className={`${level === 0 ? 'ml-auto' : 'ml-2'} h-5 w-5 transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
            />
          </button>
        ) : (
          <NavLink
            to={item.href}
            end
            className={({ isActive }) => `
              group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200
              ${level === 0 
                ? isActive
                  ? 'bg-blue-100 border-r-2 border-blue-500 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                : isActive
                  ? 'bg-blue-50 text-blue-600 pl-11'
                  : 'text-gray-500 hover:text-gray-700 pl-11'
              }
            `}
          >
            {level === 0 && item.icon}
            <span className={level === 0 ? 'ml-3' : ''}>{item.name}</span>
          </NavLink>
        )}
        
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderNavigationItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Logo and Brand */}
      <div className="flex items-center h-16 flex-shrink-0 px-4 bg-gray-900">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
          </div>
          <div className="ml-3">
            <h1 className="text-white text-lg font-semibold">Audio Admin</h1>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="flex items-center px-4 py-4 border-b border-gray-200">
        <div className="flex-shrink-0">
          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-medium text-sm">
              {currentUser?.fullName?.charAt(0).toUpperCase() || 'A'}
            </span>
          </div>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-900">{currentUser?.fullName}</p>
          <p className="text-xs text-gray-500 capitalize">
            {currentUser?.role || 'Admin'}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {filteredNavigationItems.map(item => renderNavigationItem(item))}
      </nav>

      {/* Logout */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
        >
          <LogOut className="w-6 h-6" />
          <span className="ml-3">Đăng xuất</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;