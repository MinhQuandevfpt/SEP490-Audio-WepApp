import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Store, 
  ShoppingCart, 
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
    
    AdminAuthService.logout();
    FlatStaffAuthService.logout();
    

    if (flatStaffUser) {
      navigate('/admin/flatstaff/login');
    } else {
      navigate('/admin/login');
    }
  };

  // Determine base URL based on user type
  const baseUrl = flatStaffUser ? '/flatstaff' : '/admin';
  
  const navigationItems: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: `${baseUrl}/dashboard`,
      permission: 'view_dashboard',
      icon: <LayoutDashboard className="w-6 h-6" />
    },
    {
      name: 'Quản lý người dùng',
      href: `${baseUrl}/users`,
      permission: 'manage_users',
      icon: <Users className="w-6 h-6" />,
      children: [
        { name: 'Tài khoản', href: `${baseUrl}/users/customers`, icon: null }
        // { name: 'Nhân viên hệ thống', href: `${baseUrl}/flatstaff`, icon: null }
      ]
    },
    {
      name: 'Quản lý cửa hàng',
      href: `${baseUrl}/stores`,
      permission: 'manage_products',
      icon: <Store className="w-6 h-6" />,
      children: [
        { name: 'Mục lục sản phẩm', href: `${baseUrl}/categories`, icon: null },
        { name: 'Tất cả cửa hàng', href: `${baseUrl}/stores/all`, icon: null },
        { name: 'Quản lý sản phẩm', href: `${baseUrl}/products`, icon: null },
        { name: 'Yêu cầu KYC', href: `${baseUrl}/stores/kyc`, icon: null }
      ]
    },
    {
      name: 'Quản lý đơn hàng',
      href: `${baseUrl}/orders`,
      permission: 'manage_orders',
      icon: <ShoppingCart className="w-6 h-6" />,
      children: [
        { name: 'Khiếu nại hoàn trả', href: `${baseUrl}/returns/disputes`, icon: null },
        { name: 'Cập nhật trạng thái GHN', href: `${baseUrl}/ghn-orders`, icon: null }
      ]
    },
    {
      name: 'Chiến dịch khuyến mãi',
      href: `${baseUrl}/campaigns`,
      permission: 'manage_campaigns',
      icon: <Zap className="w-6 h-6" />,
      children: [
        { name: 'Tất cả chiến dịch', href: `${baseUrl}/campaigns`, icon: null },
        { name: 'Tạo chiến dịch mới', href: `${baseUrl}/campaigns/create`, icon: null },
        { name: 'Duyệt sản phẩm chiến dịch', href: `${baseUrl}/campaigns/products/approval`, icon: null }
      ]
    },
    {
      name: 'Quản lý Banner',
      href: `${baseUrl}/banners`,
      permission: 'manage_banners',
      icon: <Image className="w-6 h-6" />,
      children: [
        { name: 'Tất cả banner', href: `${baseUrl}/banners`, icon: null },
        { name: 'Tạo banner mới', href: `${baseUrl}/banners/create`, icon: null }
      ]
    },
    {
      name: 'Quản lý Chính Sách',
      href: `${baseUrl}/policies`,
      permission: 'manage_policies',
      icon: <FileText className="w-6 h-6" />
    },
    {
      name: 'Phí nền tảng',
      href: `${baseUrl}/platform-fees`,
      permission: 'manage_system',
      icon: <DollarSign className="w-6 h-6" />
    },
    {
      name: 'Tài chính',
      href: `${baseUrl}/finance`,
      permission: 'manage_finance',
      icon: <Wallet className="w-6 h-6" />,
      children: [
        { name: 'Ví hệ thống', href: `${baseUrl}/finance/platform-wallet`, icon: null },
        { name: 'Yêu cầu rút tiền KH', href: `${baseUrl}/finance/customer-withdraw-requests`, icon: null }
      ]
    },
  ];

 
  const filteredNavigationItems = navigationItems.filter(item => {
    // FlatStaff cannot see Dashboard
    if (flatStaffUser && item.name === 'Dashboard') {
      return false;
    }
    
    // Check other permissions
    if (!item.permission) return true;
    
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
