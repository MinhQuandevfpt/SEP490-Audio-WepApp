import React, { useState, useEffect, useMemo } from 'react';
import DataTable from '../../../components/AdminComponents/DataTable';
import { useUsers, useCustomerStats } from '../../../hooks/useUsers';
import { showCenterError } from '../../../utils/notification';
import type { CustomerStatus, CustomerProfileResponse } from '../../../types/api';

const UserManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'customers' | 'sellers' | 'admins'>('customers');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | undefined>(undefined);
  const [sortBy, setSortBy] = useState('createdAt,desc');

  // API hooks
  const {
    customers,
    loading: customersLoading,
    error: customersError,
    pagination,
    setPage,
    setPageSize,
    setSearchKeyword: setSearch,
    setStatusFilter: setStatus,
    setSort,
    isEmpty
  } = useUsers({
    page: 0,
    size: 10,
    sort: 'createdAt,desc'
  });

  const {
    stats,
    loading: statsLoading,
    error: statsError
  } = useCustomerStats();

  // User statistics from API
  const userStats = useMemo(() => {
    if (!stats) return [];
    
    return [
    {
      title: 'Tổng khách hàng',
        value: stats.totalCustomers,
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
        title: 'Khách hàng hoạt động',
        value: stats.activeCustomers,
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
        title: 'Khách hàng mới hôm nay',
        value: stats.newCustomersToday,
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
        value: stats.suspendedCustomers,
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
  }, [stats]);

  // Event handlers
  const handleSearch = (keyword: string) => {
    setSearchKeyword(keyword);
    setSearch(keyword);
  };

  const handleStatusFilter = (status: string) => {
    const newStatus = status === 'Tất cả trạng thái' ? undefined : status as CustomerStatus;
    setStatusFilter(newStatus);
    setStatus(newStatus);
  };

  const handleSort = (sort: string) => {
    setSortBy(sort);
    setSort(sort);
  };

  // Function to handle status updates (can be used in future features)
  // const handleUpdateStatus = async (customerId: string, newStatus: CustomerStatus) => {
  //   const success = await updateCustomerStatus({ customerId, status: newStatus });
  //   if (success) {
  //     showCenterSuccess('Cập nhật trạng thái thành công!', 'Thành công');
  //     refreshStats(); // Refresh statistics
  //   } else {
  //     showCenterError('Cập nhật trạng thái thất bại!', 'Lỗi');
  //   }
  // };

  // Transform API data to table format
  const transformedCustomers = useMemo(() => {
    return customers.map((customer: CustomerProfileResponse) => ({
      id: customer.id,
      name: customer.fullName,
      email: customer.email,
      phone: customer.phoneNumber,
      status: customer.status,
      gender: customer.gender,
      dateOfBirth: customer.dateOfBirth,
      totalOrders: customer.orderCount,
      loyaltyLevel: customer.loyaltyLevel,
      kycStatus: customer.kycStatus
    }));
  }, [customers]);

  const customerColumns = [
    { key: 'name', label: 'Tên' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Số điện thoại' },
    {
      key: 'gender',
      label: 'Giới tính',
      render: (gender: string) => {
        if (!gender) return <span className="text-gray-400">Chưa cập nhật</span>;
        const genderConfig = {
          'MALE': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Nam', icon: '👨' },
          'FEMALE': { bg: 'bg-pink-100', text: 'text-pink-800', label: 'Nữ', icon: '👩' }
        };
        const config = genderConfig[gender as keyof typeof genderConfig];
        
        if (!config) return <span className="text-gray-400">Khác</span>;
        
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
            <span className="mr-1">{config.icon}</span>
            {config.label}
          </span>
        );
      }
    },
    {
      key: 'dateOfBirth',
      label: 'Ngày sinh',
      render: (dob: string) => {
        if (!dob) return <span className="text-gray-400">Chưa cập nhật</span>;
        
        // Format date from YYYY-MM-DD to DD/MM/YYYY
        const formatDate = (dateString: string) => {
          const date = new Date(dateString);
          return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          });
        };
        
        // Calculate age
        const calculateAge = (dateString: string) => {
          const today = new Date();
          const birthDate = new Date(dateString);
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          
          return age;
        };
        
        const age = calculateAge(dob);
        
        return (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">{formatDate(dob)}</span>
            <span className="text-xs text-gray-500">({age} tuổi)</span>
          </div>
        );
      }
    },
    { key: 'totalOrders', label: 'Tổng đơn hàng'},
    {
      key: 'loyaltyLevel',
      label: 'Cấp độ',
      render: (level: string) => {
        if (!level) return <span className="text-gray-400">Chưa có</span>;
        const levelConfig = {
          'BRONZE': { bg: 'bg-orange-100', text: 'text-orange-800' },
          'SILVER': { bg: 'bg-gray-100', text: 'text-gray-800' },
          'GOLD': { bg: 'bg-yellow-100', text: 'text-yellow-800' },
          'PLATINUM': { bg: 'bg-blue-100', text: 'text-blue-800' },
          'DIAMOND': { bg: 'bg-purple-100', text: 'text-purple-800' }
        };
        const config = levelConfig[level as keyof typeof levelConfig] || levelConfig['BRONZE'];
        
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.text}`}>
            {level}
          </span>
        );
      }
    },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (status: string) => {
        const statusConfig = {
          'ACTIVE': { bg: 'bg-green-100', text: 'text-green-800', label: 'Hoạt động' },
          'INACTIVE': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Không hoạt động' },
          'SUSPENDED': { bg: 'bg-red-100', text: 'text-red-800', label: 'Bị khóa' },
          'DELETED': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Đã xóa' }
        };
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['INACTIVE'];
        
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
            {config.label}
          </span>
        );
      }
    }
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
        return transformedCustomers;
      case 'sellers':
        return []; // TODO: Implement sellers API
      case 'admins':
        return []; // TODO: Implement admins API
      default:
        return transformedCustomers;
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
    { id: 'customers', name: 'Khách hàng', count: pagination.totalElements },
    { id: 'sellers', name: 'Người bán', count: 0 }, // TODO: Get from API
    { id: 'admins', name: 'Quản trị viên', count: 0 } // TODO: Get from API
  ];

  // Show error message if API fails
  useEffect(() => {
    if (customersError) {
      showCenterError(customersError, 'Lỗi tải dữ liệu');
    }
  }, [customersError]);

  useEffect(() => {
    if (statsError) {
      showCenterError(statsError, 'Lỗi tải thống kê');
    }
  }, [statsError]);

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

      {/* Enhanced Statistics Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          // Enhanced loading skeleton for stats
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
                <div className="w-16 h-16 bg-gray-200 rounded-xl"></div>
              </div>
            </div>
          ))
        ) : (
          userStats.map((stat, index) => (
            <div key={index} className="group bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-2">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value.toLocaleString()}</p>
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      stat.changeType === 'increase' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {stat.changeType === 'increase' ? '↗' : '↘'} {stat.change}
                    </span>
                    <span className="ml-2 text-xs text-gray-500">so với tháng trước</span>
                  </div>
                </div>
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                  stat.color === 'blue' ? 'bg-blue-100 text-blue-600' :
                  stat.color === 'green' ? 'bg-green-100 text-green-600' :
                  stat.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                  'bg-red-100 text-red-600'
                } group-hover:scale-110 transition-transform duration-300`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Enhanced Tabs and Content */}
      <div className="bg-white shadow-xl rounded-xl border border-gray-100 overflow-hidden">
        {/* Enhanced Tab Navigation */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200">
          <nav className="flex space-x-1 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'customers' | 'sellers' | 'admins')}
                className={`${
                  activeTab === tab.id
                    ? 'bg-white text-blue-600 border-blue-200 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                } relative flex items-center px-6 py-4 font-medium text-sm rounded-t-lg border border-b-0 transition-all duration-200 group`}
              >
                <div className="flex items-center space-x-2">
                  <span className="flex items-center">
                    {tab.id === 'customers' && '👥'}
                    {tab.id === 'sellers' && '🏪'}
                    {tab.id === 'admins' && '👨‍💼'}
                    <span className="ml-2">{tab.name}</span>
                  </span>
                  <span className={`${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-200 text-gray-600 group-hover:bg-gray-300'
                  } inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-colors duration-200`}>
                    {tab.count}
                  </span>
                </div>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-full"></div>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Enhanced Filters and Search */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                {/* Search Input */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                    placeholder="Tìm kiếm theo tên, email..."
                    value={searchKeyword}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="block w-full sm:w-80 pl-10 pr-4 py-3 border border-blue-200 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm shadow-sm transition-all duration-200"
                />
              </div>
                
                {/* Status Filter */}
                <div className="relative">
                  <select 
                    value={statusFilter || 'Tất cả trạng thái'}
                    onChange={(e) => handleStatusFilter(e.target.value)}
                    className="block w-full sm:w-48 px-4 py-3 border border-blue-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white transition-all duration-200"
                  >
                <option>Tất cả trạng thái</option>
                    <option value="ACTIVE">🟢 Hoạt động</option>
                    <option value="INACTIVE">🟡 Không hoạt động</option>
                    <option value="SUSPENDED">🔴 Bị khóa</option>
                    <option value="DELETED">⚫ Đã xóa</option>
                  </select>
                </div>
                
                {/* Sort Filter */}
                <div className="relative">
                  <select 
                    value={sortBy}
                    onChange={(e) => handleSort(e.target.value)}
                    className="block w-full sm:w-48 px-4 py-3 border border-blue-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white transition-all duration-200"
                  >
                    <option value="createdAt,desc">📅 Mới nhất</option>
                    <option value="createdAt,asc">📅 Cũ nhất</option>
                    <option value="fullName,asc">🔤 Tên A-Z</option>
                    <option value="fullName,desc">🔤 Tên Z-A</option>
                    <option value="orderCount,desc">📦 Đơn hàng nhiều</option>
                    <option value="dateOfBirth,desc">🎂 Tuổi cao</option>
                    <option value="dateOfBirth,asc">🎂 Tuổi thấp</option>
                    <option value="gender,asc">👥 Giới tính</option>
                  </select>
            </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button className="inline-flex items-center px-4 py-3 border border-blue-300 rounded-lg shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200">
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                </svg>
                  Lọc nâng cao
              </button>
                <button className="inline-flex items-center px-4 py-3 border border-green-300 rounded-lg shadow-sm text-sm font-medium text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200">
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                  Xuất Excel
              </button>
              </div>
            </div>
            
            {/* Active Filters Display */}
            {(searchKeyword || statusFilter) && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-600">Bộ lọc đang áp dụng:</span>
                {searchKeyword && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    🔍 "{searchKeyword}"
                    <button
                      onClick={() => handleSearch('')}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {statusFilter && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    📊 {statusFilter}
                    <button
                      onClick={() => handleStatusFilter('Tất cả trạng thái')}
                      className="ml-2 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                <button
                  onClick={() => {
                    handleSearch('');
                    handleStatusFilter('Tất cả trạng thái');
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Xóa tất cả
                </button>
              </div>
            )}
          </div>

          {/* Data Table */}
          {customersLoading ? (
            // Loading skeleton for table
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : isEmpty ? (
            // Empty state
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Không có dữ liệu</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchKeyword || statusFilter ? 'Không tìm thấy khách hàng phù hợp với bộ lọc.' : 'Chưa có khách hàng nào.'}
              </p>
            </div>
          ) : (
            <>
          <DataTable
            columns={getCurrentColumns()}
            data={getCurrentData()}
            onRowClick={(row) => console.log('User clicked:', row)}
          />
              
              {/* Enhanced Pagination */}
              <div className="mt-8 bg-gray-50 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                  {/* Results Info */}
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-700">
                      Hiển thị{' '}
                      <span className="font-semibold text-gray-900">
                        {pagination.totalElements > 0 ? pagination.page * pagination.size + 1 : 0}
                      </span>
                      {' '}đến{' '}
                      <span className="font-semibold text-gray-900">
                        {Math.min((pagination.page + 1) * pagination.size, pagination.totalElements)}
                      </span>
                      {' '}trong tổng số{' '}
                      <span className="font-semibold text-blue-600">{pagination.totalElements}</span>
                      {' '}kết quả
                    </div>
                    
                    {/* Page Size Selector */}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Hiển thị:</span>
                      <select
                        value={pagination.size}
                        onChange={(e) => setPageSize(Number(e.target.value))}
                        className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                      <span className="text-sm text-gray-600">/ trang</span>
                    </div>
                  </div>
                  
                  {/* Pagination Controls */}
                  {pagination.totalPages > 1 && (
                    <div className="flex items-center space-x-2">
                      {/* First Page */}
                      <button
                        onClick={() => setPage(0)}
                        disabled={pagination.first}
                        className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Trang đầu"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        </svg>
                      </button>
                      
                      {/* Previous Page */}
                      <button
                        onClick={() => setPage(pagination.page - 1)}
                        disabled={pagination.first}
                        className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Trang trước"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      
                      {/* Page Numbers */}
                      <div className="flex items-center space-x-1">
                        {(() => {
                          const pages = [];
                          const totalPages = pagination.totalPages;
                          const currentPage = pagination.page;
                          
                          // Calculate page range
                          let startPage = Math.max(0, currentPage - 2);
                          let endPage = Math.min(totalPages - 1, currentPage + 2);
                          
                          // Adjust range if we're near the beginning or end
                          if (endPage - startPage < 4) {
                            if (startPage === 0) {
                              endPage = Math.min(totalPages - 1, startPage + 4);
                            } else {
                              startPage = Math.max(0, endPage - 4);
                            }
                          }
                          
                          // Add first page and ellipsis if needed
                          if (startPage > 0) {
                            pages.push(
                              <button
                                key={0}
                                onClick={() => setPage(0)}
                                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                              >
                                1
                              </button>
                            );
                            if (startPage > 1) {
                              pages.push(
                                <span key="ellipsis1" className="px-2 text-gray-500">
                                  ...
                                </span>
                              );
                            }
                          }
                          
                          // Add page numbers in range
                          for (let i = startPage; i <= endPage; i++) {
                            pages.push(
                              <button
                                key={i}
                                onClick={() => setPage(i)}
                                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                  i === currentPage
                                    ? 'text-white bg-blue-600 border border-blue-600 shadow-sm'
                                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {i + 1}
                              </button>
                            );
                          }
                          
                          // Add last page and ellipsis if needed
                          if (endPage < totalPages - 1) {
                            if (endPage < totalPages - 2) {
                              pages.push(
                                <span key="ellipsis2" className="px-2 text-gray-500">
                                  ...
                                </span>
                              );
                            }
                            pages.push(
                              <button
                                key={totalPages - 1}
                                onClick={() => setPage(totalPages - 1)}
                                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                              >
                                {totalPages}
                              </button>
                            );
                          }
                          
                          return pages;
                        })()}
                      </div>
                      
                      {/* Next Page */}
                      <button
                        onClick={() => setPage(pagination.page + 1)}
                        disabled={pagination.last}
                        className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Trang sau"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      
                      {/* Last Page */}
                      <button
                        onClick={() => setPage(pagination.totalPages - 1)}
                        disabled={pagination.last}
                        className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Trang cuối"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;