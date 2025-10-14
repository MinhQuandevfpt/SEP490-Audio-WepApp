import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
        </svg>
      )
    },
    {
      name: 'Quản lý người dùng',
      href: '/admin/users',
      permission: 'manage_users',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      children: [
        { name: 'Khách hàng', href: '/admin/users/customers', icon: null },
        { name: 'Người bán', href: '/admin/users/sellers', icon: null },
        { name: 'Admin', href: '/admin/users/admins', icon: null, permission: 'manage_system' }
      ]
    },
    {
      name: 'Quản lý sản phẩm',
      href: '/admin/products',
      permission: 'manage_products',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      children: [
        { name: 'Tất cả sản phẩm', href: '/admin/products/all', icon: null },
        { name: 'Danh mục', href: '/admin/products/categories', icon: null },
        { name: 'Thương hiệu', href: '/admin/products/brands', icon: null },
        { name: 'Phê duyệt', href: '/admin/products/approval', icon: null }
      ]
    },
    {
      name: 'Quản lý đơn hàng',
      href: '/admin/orders',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      children: [
        { name: 'Tất cả đơn hàng', href: '/admin/orders/all', icon: null },
        { name: 'Chờ xử lý', href: '/admin/orders/pending', icon: null },
        { name: 'Đang giao', href: '/admin/orders/shipping', icon: null },
        { name: 'Hoàn thành', href: '/admin/orders/completed', icon: null },
        { name: 'Đã hủy', href: '/admin/orders/cancelled', icon: null }
      ]
    },
    {
      name: 'Báo cáo & Thống kê',
      href: '/admin/reports',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      children: [
        { name: 'Doanh thu', href: '/admin/reports/revenue', icon: null },
        { name: 'Sản phẩm bán chạy', href: '/admin/reports/bestsellers', icon: null },
        { name: 'Khách hàng', href: '/admin/reports/customers', icon: null },
        { name: 'Người bán', href: '/admin/reports/sellers', icon: null }
      ]
    },
    {
      name: 'Cài đặt hệ thống',
      href: '/admin/settings',
      permission: 'manage_system',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      children: [
        { name: 'Cấu hình chung', href: '/admin/settings/general', icon: null },
        { name: 'Thanh toán', href: '/admin/settings/payment', icon: null },
        { name: 'Giao hàng', href: '/admin/settings/shipping', icon: null },
        { name: 'Email Templates', href: '/admin/settings/email', icon: null }
      ]
    }
  ];

  // Filter navigation items based on permissions
  const getFilteredNavigationItems = (items: NavigationItem[]): NavigationItem[] => {
    return items.filter(item => {
      if (item.permission && !AdminAuthService.hasPermission(item.permission)) {
        return false;
      }
      return true;
    }).map(item => ({
      ...item,
      children: item.children ? getFilteredNavigationItems(item.children) : undefined
    }));
  };

  const filteredNavigationItems = getFilteredNavigationItems(navigationItems);

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
            <svg
              className={`
                ${level === 0 ? 'ml-auto' : 'ml-2'} h-5 w-5 transform transition-transform duration-200
                ${isExpanded ? 'rotate-90' : ''}
              `}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        ) : (
          <NavLink
            to={item.href}
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
              {currentUser?.name?.charAt(0).toUpperCase() || 'A'}
            </span>
          </div>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-900">{currentUser?.name}</p>
          <p className="text-xs text-gray-500 capitalize">
            {currentUser?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
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
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="ml-3">Đăng xuất</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;