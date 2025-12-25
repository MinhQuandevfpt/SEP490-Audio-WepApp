import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Tag, Button, Input, Space, Select, Tooltip, Modal } from 'antd';
import { EyeOutlined, SearchOutlined, UserOutlined, LockOutlined, UnlockOutlined, ShoppingCartOutlined, StopOutlined } from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { useUsers, useCustomerStats } from '../../../hooks/useUsers';
import { showCenterError, showCenterSuccess } from '../../../utils/notification';
import type { CustomerStatus, CustomerProfileResponse } from '../../../types/api';
import { AdminUserService } from '../../../services/admin/AdminUserService';

const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | 'ALL'>('ALL');
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 15,
    showSizeChanger: true,
    pageSizeOptions: ['10', '15', '20', '50'],
    showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} người dùng`,
  });

  const [togglingBuyable, setTogglingBuyable] = useState<string | null>(null);
  const [localCustomers, setLocalCustomers] = useState<CustomerProfileResponse[]>([]);

  // API hooks
  const {
    customers,
    loading: customersLoading,
    error: customersError,
    setPage,
    setPageSize,
    setSearchKeyword: setSearch,
    setStatusFilter: setStatus,
    setSort,
    refreshCustomers,
  } = useUsers({
    page: 0,
    size: 15,
    sort: 'createdAt,desc'
  });

  // Sync local customers with API customers
  useEffect(() => {
    setLocalCustomers(customers);
  }, [customers]);

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
        title: 'Tổng tài khoản',
        value: stats.totalCustomers,
        color: 'blue',
        icon: <UserOutlined className="text-2xl" />
      },
      {
        title: 'Tài khoản hoạt động',
        value: stats.activeCustomers,
        color: 'green',
        icon: <UnlockOutlined className="text-2xl" />
      },
      {
        title: 'Tài khoản bị cấm',
        value: stats.suspendedCustomers,
        color: 'red',
        icon: <LockOutlined className="text-2xl" />
      }
    ];
  }, [stats]);

  // Event handlers
  const handleSearch = useCallback((value: string) => {
    setSearchKeyword(value);
    setSearch(value);
    setPagination(prev => ({ ...prev, current: 1 }));
  }, [setSearch]);

  const handleStatusFilter = useCallback((status: CustomerStatus | 'ALL') => {
    setStatusFilter(status);
    setStatus(status === 'ALL' ? undefined : status);
    setPagination(prev => ({ ...prev, current: 1 }));
  }, [setStatus]);

  const handleViewDetail = useCallback((customerId: string) => {
    navigate(`/admin/users/${customerId}`);
  }, [navigate]);

  const handleTableChange = useCallback((newPagination: TablePaginationConfig) => {
    setPagination(newPagination);
    setPage((newPagination.current || 1) - 1);
    setPageSize(newPagination.pageSize || 15);
  }, [setPage, setPageSize]);

  const handleToggleBuyable = useCallback(async (customerId: string, customerName: string, currentBuyable: boolean = true) => {
    const newBuyable = !currentBuyable;
    const action = newBuyable ? 'cho phép' : 'cấm';
    
    Modal.confirm({
      title: `${action === 'cấm' ? 'Cấm' : 'Cho phép'} mua hàng`,
      content: `Bạn có chắc chắn muốn ${action} tài khoản "${customerName}" ${action === 'cấm' ? 'không' : ''} được mua hàng?`,
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      okType: action === 'cấm' ? 'danger' : 'primary',
      onOk: async () => {
        try {
          setTogglingBuyable(customerId);
          const response = await AdminUserService.toggleCustomerBuyable(customerId, newBuyable);
          
          // Update local state immediately
          setLocalCustomers(prev => prev.map(customer => {
            if (customer.id === customerId) {
              return { ...customer, buyable: response?.buyable ?? newBuyable } as CustomerProfileResponse;
            }
            return customer;
          }));
          
          showCenterSuccess(`Đã ${action} mua hàng cho tài khoản "${customerName}"`, 'Thành công');
          
          // Refresh customer list to get latest data
          await refreshCustomers();
        } catch (error: any) {
          console.error('Error toggling buyable:', error);
          const errorMessage = AdminUserService.formatApiError(error);
          showCenterError(errorMessage || `Không thể ${action} mua hàng cho tài khoản`, 'Lỗi');
        } finally {
          setTogglingBuyable(null);
        }
      }
    });
  }, [refreshCustomers]);

  const getStatusTag = useCallback((status: CustomerStatus) => {
    const statusConfig: Record<CustomerStatus, { color: string; text: string }> = {
      'ACTIVE': { color: 'success', text: 'Hoạt động' },
      'INACTIVE': { color: 'warning', text: 'Không hoạt động' },
      'SUSPENDED': { color: 'error', text: 'Bị khóa' },
      'DELETED': { color: 'default', text: 'Đã xóa' },
      'NONE': { color: 'default', text: 'Chưa xác định' }
    };
    const config = statusConfig[status] || statusConfig['INACTIVE'];
    return <Tag color={config.color}>{config.text}</Tag>;
  }, []);

  // Define table columns
  const columns: ColumnsType<CustomerProfileResponse> = useMemo(() => [
    {
      title: 'Người dùng',
      key: 'user',
      width: 250,
      fixed: 'left',
      render: (_: any, record: CustomerProfileResponse) => (
        <div>
          <div className="font-medium text-gray-900">{record.fullName}</div>
          <div className="text-xs text-gray-500">{record.email}</div>
        </div>
      ),
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phoneNumber',
      key: 'phoneNumber',
      width: 140,
      render: (phone: string) => (
        <span className="text-sm text-gray-900">{phone || '-'}</span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      filters: [
        { text: 'Hoạt động', value: 'ACTIVE' },
        { text: 'Không hoạt động', value: 'INACTIVE' },
        { text: 'Bị khóa', value: 'SUSPENDED' },
        { text: 'Đã xóa', value: 'DELETED' },
      ],
      onFilter: (value: any, record: CustomerProfileResponse) => record.status === value,
      render: (status: CustomerStatus) => getStatusTag(status),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 200,
      fixed: 'right',
      render: (_: any, record: CustomerProfileResponse) => {
        // Get buyable status from localCustomers if available, otherwise from record, default to true
        const localCustomer = localCustomers.find(c => c.id === record.id);
        const isBuyable = localCustomer 
          ? ((localCustomer as any).buyable !== undefined ? (localCustomer as any).buyable : true)
          : ((record as any).buyable !== undefined ? (record as any).buyable : true);
        const isToggling = togglingBuyable === record.id;
        
        return (
          <Space size="small">
            <Tooltip title={isBuyable ? "Cấm mua hàng" : "Cho phép mua hàng"}>
              <Button
                type={isBuyable ? "default" : "primary"}
                danger={isBuyable}
                size="small"
                icon={isBuyable ? <StopOutlined /> : <ShoppingCartOutlined />}
                onClick={() => handleToggleBuyable(record.id, record.fullName, isBuyable)}
                loading={isToggling}
                disabled={isToggling}
              >
                {isBuyable ? 'Cấm mua' : 'Cho mua'}
              </Button>
            </Tooltip>
            <Tooltip title="Xem chi tiết">
              <Button
                type="primary"
                ghost
                size="small"
                icon={<EyeOutlined />}
                onClick={() => handleViewDetail(record.id)}
              >
                Chi tiết
              </Button>
            </Tooltip>
          </Space>
        );
      },
    },
  ], [getStatusTag, handleViewDetail, handleToggleBuyable, togglingBuyable]);

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
    <div className="p-6">
      {/* Page Header */}
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Quản lý người dùng
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Quản lý tài khoản người dùng của hệ thống
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {userStats.map((stat, index) => {
          const colorClasses = {
            blue: 'bg-blue-500',
            green: 'bg-green-500',
            purple: 'bg-purple-500',
            red: 'bg-red-500'
          };
          
          return (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600 mb-3 truncate">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {statsLoading ? (
                      <span className="inline-block w-20 h-9 bg-gray-200 rounded animate-pulse"></span>
                    ) : (
                      stat.value.toLocaleString()
                    )}
                  </p>
                </div>
                <div className={`flex-shrink-0 w-14 h-14 rounded-lg ${colorClasses[stat.color as keyof typeof colorClasses]} flex items-center justify-center text-white ml-4`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2 border-b border-gray-200">
        {(['ALL', 'ACTIVE', 'INACTIVE', 'SUSPENDED'] as const).map((status) => {
          const statusLabels = {
            ALL: 'Tất cả',
            ACTIVE: 'Hoạt động',
            INACTIVE: 'Không hoạt động',
            SUSPENDED: 'Bị khóa'
          };
          
          const count = status === 'ALL' 
            ? customers.length 
            : customers.filter(c => c.status === status).length;
            
          return (
            <button
              key={status}
              onClick={() => handleStatusFilter(status)}
              className={`px-4 py-2 font-medium text-sm transition-colors duration-200 border-b-2 ${
                statusFilter === status
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {statusLabels[status]}
              <span className="ml-2 px-2 py-0.5 bg-gray-100 rounded-full text-xs">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Tìm kiếm theo tên, email, số điện thoại..."
              prefix={<SearchOutlined />}
              size="large"
              value={searchKeyword}
              onChange={(e) => handleSearch(e.target.value)}
              allowClear
            />
          </div>
          <Select
            size="large"
            style={{ width: 200 }}
            placeholder="Sắp xếp"
            defaultValue="fullName,asc"
            onChange={(value) => setSort(value)}
            options={[
              { value: 'fullName,asc', label: 'Tên A-Z' },
              { value: 'fullName,desc', label: 'Tên Z-A' },
              { value: 'orderCount,desc', label: 'Nhiều đơn nhất' },
              { value: 'orderCount,asc', label: 'Ít đơn nhất' },
            ]}
          />
        </div>
      </div>

      {/* Ant Design Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <Table
          columns={columns}
          dataSource={localCustomers.length > 0 ? localCustomers : customers}
          loading={customersLoading}
          rowKey="id"
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
          locale={{
            emptyText: (
              <div className="py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Không có người dùng</h3>
                <p className="mt-2 text-gray-500">
                  {searchKeyword 
                    ? 'Không tìm thấy người dùng nào phù hợp với tìm kiếm của bạn.'
                    : 'Chưa có người dùng nào trong hệ thống.'}
                </p>
              </div>
            ),
          }}
        />
      </div>
    </div>
  );
};

export default UserManagement;