import React, { useState, useEffect, useMemo } from 'react';
// import DataTable from '../../../components/AdminComponents/DataTable';
import { AdminStatsCards, AdminTabs, UserFiltersBar, CustomersTableSection } from '../../../components/AdminComponents/UserListComponent';
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

  const handleViewDetail = (customerId: string) => {
    console.log('View customer detail:', customerId);
    // TODO: Implement navigation to detail page or open drawer/modal
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
      kycStatus: customer.kycStatus,
      detailId: customer.id
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
    },
    {
      key: 'detailId',
      label: 'Chi tiết',
      render: (id: string) => (
        <button
          onClick={() => handleViewDetail(id)}
          className="inline-flex items-center px-3 py-1.5 border border-blue-200 text-blue-700 bg-white hover:bg-blue-50 rounded-md text-xs font-medium shadow-sm transition-colors"
        >
          Chi tiết
        </button>
      )
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

      <AdminStatsCards statsLoading={statsLoading} items={userStats} />

      <div className="bg-white shadow-xl rounded-xl border border-gray-100 overflow-hidden">
        <AdminTabs activeTab={activeTab} tabs={tabs as any} onChange={(id) => setActiveTab(id)} />

        {/* Tab Content */}
        <div className="p-6">
          <UserFiltersBar
            searchKeyword={searchKeyword}
            statusFilter={statusFilter}
            sortBy={sortBy}
            onSearch={handleSearch}
            onStatusChange={handleStatusFilter}
            onSortChange={handleSort}
            onClearAll={() => { handleSearch(''); handleStatusFilter('Tất cả trạng thái'); }}
          />

          <CustomersTableSection
            columns={getCurrentColumns() as any}
            data={getCurrentData()}
            loading={customersLoading}
            isEmpty={isEmpty}
            pagination={pagination as any}
            onPageChange={(p) => setPage(p)}
            onPageSizeChange={(s) => setPageSize(s)}
          />
        </div>
      </div>
    </div>
  );
};

export default UserManagement;