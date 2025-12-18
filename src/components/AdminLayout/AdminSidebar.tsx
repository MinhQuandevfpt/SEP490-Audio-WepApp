import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Store, 
  ShoppingCart, 
  Settings,
  ChevronRight,
  LogOut,
  Zap,
  Image,
  FileText,
  DollarSign,
  Wallet
} from 'lucide-react';
import { AdminAuthService } from '../../services/admin/AdminAuthService';
import { FlatStaffAuthService } from '../../services/admin/FlatStaffAuthService';
import { hasPermission } from '../../utils/permissionHelper';

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
  
  // Get current user from either AdminAuthService or FlatStaffAuthService
  const adminUser = AdminAuthService.getCurrentUser();
  const flatStaffUser = FlatStaffAuthService.getCurrentUser();
  const currentUser = adminUser || flatStaffUser;

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(item => item !== itemName)
        : [...prev, itemName]
    );
  };

  const handleLogout = () => {
    // Logout from both services (only one will have data, but safe to call both)
    AdminAuthService.logout();
    FlatStaffAuthService.logout();
    
    // Determine redirect path based on which service was used
    if (flatStaffUser) {
      navigate('/admin/flatstaff/login');
    } else {
      navigate('/admin/login');
    }
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
        { name: 'Khách hàng', href: '/admin/users/customers', icon: null }
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
        { name: 'Quản lý sản phẩm', href: '/admin/products', icon: null },
        { name: 'Yêu cầu KYC', href: '/admin/stores/kyc', icon: null }
      ]
    },
    {
      name: 'Quản lý đơn hàng',
      href: '/admin/orders',
      permission: 'manage_orders',
      icon: <ShoppingCart className="w-6 h-6" />,
      children: [
        { name: 'Tất cả đơn hàng', href: '/admin/orders/all', icon: null },
        { name: 'Chờ xử lý', href: '/admin/orders/pending', icon: null },
        { name: 'Đang giao', href: '/admin/orders/shipping', icon: null },
        { name: 'Hoàn thành', href: '/admin/orders/completed', icon: null },
        { name: 'Đã hủy', href: '/admin/orders/cancelled', icon: null },
        { name: 'Khiếu nại hoàn trả', href: '/admin/returns/disputes', icon: null }
      ]
    },
    {
      name: 'Chiến dịch khuyến mãi',
      href: '/admin/campaigns',
      permission: 'manage_campaigns',
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
      permission: 'manage_banners',
      icon: <Image className="w-6 h-6" />,
      children: [
        { name: 'Tất cả banner', href: '/admin/banners', icon: null },
        { name: 'Tạo banner mới', href: '/admin/banners/create', icon: null }
      ]
    },
    {
      name: 'Quản lý Chính Sách',
      href: '/admin/policies',
      permission: 'manage_policies',
      icon: <FileText className="w-6 h-6" />
    },
    {
      name: 'Phí nền tảng',
      href: '/admin/platform-fees',
      permission: 'manage_system',
      icon: <DollarSign className="w-6 h-6" />
    },
    {
      name: 'Tài chính',
      href: '/admin/finance',
      permission: 'manage_finance',
      icon: <Wallet className="w-6 h-6" />,
      children: [
        { name: 'Ví hệ thống', href: '/admin/finance/platform-wallet', icon: null },
        { name: 'Đối soát thanh toán', href: '/admin/finance/settlement-statistics', icon: null },
        { name: 'Yêu cầu rút tiền KH', href: '/admin/finance/customer-withdraw-requests', icon: null },
        { name: 'Thanh toán cửa hàng', href: '/admin/reports/payout', icon: null }
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

  // Filter navigation items based on user permissions
  const filteredNavigationItems = navigationItems.filter(item => {
    // Items without permission requirement are visible to all
    if (!item.permission) return true;
    
    // Check permission based on user role
    const userRole = currentUser?.role || '';
    return hasPermission(userRole, item.permission);
  });

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
      {/* User Info */}
      <div className="flex items-center px-4 py-4 border-b border-gray-200 bg-blue-600">
        <div className="flex-shrink-0">
          <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-medium text-sm">
              {currentUser?.fullName?.charAt(0).toUpperCase() || 'A'}
            </span>
          </div>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-white">{currentUser?.fullName}</p>
          <p className="text-xs text-blue-100 capitalize">
            {currentUser?.role === 'FLATSTAFF' || currentUser?.role === 'flatstaff' 
              ? 'Staff Admin' 
              : currentUser?.role || 'Admin'}
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
