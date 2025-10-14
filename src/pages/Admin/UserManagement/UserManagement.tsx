import React, { useState } from 'react';
import DataTable from '../../../components/AdminComponents/DataTable';
import StatCard from '../../../components/AdminComponents/StatCard';

const UserManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'customers' | 'sellers' | 'admins'>('customers');

  // Mock data for user statistics
  const userStats = [
    {
      title: 'Tổng khách hàng',
      value: 2847,
      change: '12.5%',
      changeType: 'increase' as const,
      color: 'blue' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    },
    {
      title: 'Người bán hoạt động',
      value: 156,
      change: '8.2%',
      changeType: 'increase' as const,
      color: 'green' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      title: 'Người dùng mới hôm nay',
      value: 89,
      change: '15.3%',
      changeType: 'increase' as const,
      color: 'purple' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      )
    },
    {
      title: 'Tài khoản bị khóa',
      value: 12,
      change: '2.1%',
      changeType: 'decrease' as const,
      color: 'red' as const,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    }
  ];

  // Mock data for customers
  const customers = [
    {
      id: 1,
      name: 'Nguyễn Văn A',
      email: 'nguyenvana@email.com',
      phone: '0123456789',
      status: 'Hoạt động',
      joinDate: '2024-01-15',
      totalOrders: 12,
      totalSpent: '₫25,400,000'
    },
    {
      id: 2,
      name: 'Trần Thị B',
      email: 'tranthib@email.com',
      phone: '0987654321',
      status: 'Hoạt động',
      joinDate: '2024-01-10',
      totalOrders: 8,
      totalSpent: '₫18,200,000'
    },
    {
      id: 3,
      name: 'Lê Văn C',
      email: 'levanc@email.com',
      phone: '0369852147',
      status: 'Bị khóa',
      joinDate: '2024-01-05',
      totalOrders: 3,
      totalSpent: '₫5,800,000'
    }
  ];

  // Mock data for sellers
  const sellers = [
    {
      id: 1,
      name: 'Audio Store VN',
      email: 'contact@audiostore.vn',
      phone: '0123456789',
      status: 'Đã duyệt',
      joinDate: '2023-12-01',
      totalProducts: 245,
      totalRevenue: '₫1,250,000,000'
    },
    {
      id: 2,
      name: 'Sound World',
      email: 'info@soundworld.vn',
      phone: '0987654321',
      status: 'Chờ duyệt',
      joinDate: '2024-01-08',
      totalProducts: 0,
      totalRevenue: '₫0'
    }
  ];

  // Mock data for admins
  const admins = [
    {
      id: 1,
      name: 'Admin User',
      email: 'admin@audiostore.com',
      role: 'Admin',
      status: 'Hoạt động',
      lastLogin: '2024-01-10 14:30',
      permissions: 'Toàn quyền'
    },
    {
      id: 2,
      name: 'Super Admin',
      email: 'superadmin@audiostore.com',
      role: 'Super Admin',
      status: 'Hoạt động',
      lastLogin: '2024-01-10 15:45',
      permissions: 'Toàn quyền + Hệ thống'
    }
  ];

  const customerColumns = [
    { key: 'name', label: 'Tên', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'phone', label: 'Số điện thoại' },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (status: string) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          status === 'Hoạt động' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {status}
        </span>
      )
    },
    { key: 'joinDate', label: 'Ngày tham gia', sortable: true },
    { key: 'totalOrders', label: 'Tổng đơn hàng', sortable: true },
    { key: 'totalSpent', label: 'Tổng chi tiêu', sortable: true }
  ];

  const sellerColumns = [
    { key: 'name', label: 'Tên cửa hàng', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'phone', label: 'Số điện thoại' },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (status: string) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          status === 'Đã duyệt' ? 'bg-green-100 text-green-800' : 
          status === 'Chờ duyệt' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
        }`}>
          {status}
        </span>
      )
    },
    { key: 'joinDate', label: 'Ngày đăng ký', sortable: true },
    { key: 'totalProducts', label: 'Sản phẩm', sortable: true },
    { key: 'totalRevenue', label: 'Doanh thu', sortable: true }
  ];

  const adminColumns = [
    { key: 'name', label: 'Tên', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'role', label: 'Vai trò', sortable: true },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (status: string) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          status === 'Hoạt động' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {status}
        </span>
      )
    },
    { key: 'lastLogin', label: 'Đăng nhập cuối', sortable: true },
    { key: 'permissions', label: 'Quyền hạn' }
  ];

  const getCurrentData = () => {
    switch (activeTab) {
      case 'customers':
        return customers;
      case 'sellers':
        return sellers;
      case 'admins':
        return admins;
      default:
        return customers;
    }
  };

  const getCurrentColumns = () => {
    switch (activeTab) {
      case 'customers':
        return customerColumns;
      case 'sellers':
        return sellerColumns;
      case 'admins':
        return adminColumns;
      default:
        return customerColumns;
    }
  };

  const tabs = [
    { id: 'customers', name: 'Khách hàng', count: customers.length },
    { id: 'sellers', name: 'Người bán', count: sellers.length },
    { id: 'admins', name: 'Quản trị viên', count: admins.length }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Quản lý người dùng
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Quản lý tài khoản khách hàng, người bán và quản trị viên
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Thêm người dùng
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {userStats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Tabs and Content */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'customers' | 'sellers' | 'admins')}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                {tab.name}
                <span className={`${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-900'
                } ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Filters and Search */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  className="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <select className="block w-40 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm">
                <option>Tất cả trạng thái</option>
                <option>Hoạt động</option>
                <option>Bị khóa</option>
                {activeTab === 'sellers' && <option>Chờ duyệt</option>}
              </select>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-2">
              <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                </svg>
                Lọc
              </button>
              <button className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Xuất
              </button>
            </div>
          </div>

          {/* Data Table */}
          <DataTable
            columns={getCurrentColumns()}
            data={getCurrentData()}
            onRowClick={(row) => console.log('User clicked:', row)}
          />
        </div>
      </div>
    </div>
  );
};

export default UserManagement;