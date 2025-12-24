import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Table, Tag, Input, Space, Select, DatePicker, Button } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import { AdminGhnOrderService, type GhnOrder } from '../../../services/admin/AdminGhnOrderService';
import { showCenterError, showCenterSuccess } from '../../../utils/notification';

const { RangePicker } = DatePicker;

// GHN Status mapping
const GHN_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  'READY_PICKUP': { label: 'Sẵn sàng lấy hàng', color: 'blue' },
  'CANCELED': { label: 'Đã hủy', color: 'red' },
  'ON_DELIVERY': { label: 'Đang giao hàng', color: 'cyan' },
  'READY_TO_PICK': { label: 'Sẵn sàng lấy', color: 'blue' },
  'PICKING': { label: 'Đang lấy hàng', color: 'processing' },
  'CANCEL': { label: 'Hủy', color: 'red' },
  'MONEY_COLLECT_PICKING': { label: 'Thu tiền khi lấy', color: 'gold' },
  'PICKED': { label: 'Đã lấy hàng', color: 'success' },
  'STORING': { label: 'Đang lưu kho', color: 'default' },
  'TRANSPORTING': { label: 'Đang vận chuyển', color: 'processing' },
  'SORTING': { label: 'Đang phân loại', color: 'processing' },
  'DELIVERING': { label: 'Đang giao hàng', color: 'cyan' },
  'MONEY_COLLECT_DELIVERING': { label: 'Thu tiền khi giao', color: 'gold' },
  'DELIVERED': { label: 'Đã giao hàng', color: 'green' },
  'DELIVERY_FAIL': { label: 'Giao hàng thất bại', color: 'red' },
  'WAITING_TO_RETURN': { label: 'Chờ trả hàng', color: 'orange' },
  'RETURN': { label: 'Trả hàng', color: 'default' },
  'RETURN_TRANSPORTING': { label: 'Đang vận chuyển trả', color: 'processing' },
  'RETURN_SORTING': { label: 'Đang phân loại trả', color: 'processing' },
  'RETURNING': { label: 'Đang trả hàng', color: 'default' },
  'RETURN_FAIL': { label: 'Trả hàng thất bại', color: 'red' },
  'RETURNED': { label: 'Đã trả hàng', color: 'default' },
  'EXCEPTION': { label: 'Ngoại lệ', color: 'error' },
  'DAMAGE': { label: 'Hư hỏng', color: 'red' },
  'LOST': { label: 'Thất lạc', color: 'red' },
  'GHN_CREATED': { label: 'Đã tạo GHN', color: 'blue' },
};

// All available GHN statuses
const GHN_STATUSES = [
  'READY_PICKUP',
  'CANCELED',
  'ON_DELIVERY',
  'READY_TO_PICK',
  'PICKING',
  'CANCEL',
  'MONEY_COLLECT_PICKING',
  'PICKED',
  'STORING',
  'TRANSPORTING',
  'SORTING',
  'DELIVERING',
  'MONEY_COLLECT_DELIVERING',
  'DELIVERED',
  'DELIVERY_FAIL',
  'WAITING_TO_RETURN',
  'RETURN',
  'RETURN_TRANSPORTING',
  'RETURN_SORTING',
  'RETURNING',
  'RETURN_FAIL',
  'RETURNED',
  'EXCEPTION',
  'DAMAGE',
  'LOST',
  'GHN_CREATED',
];

const GhnOrderStatusPage: React.FC = () => {
  const [ghnOrders, setGhnOrders] = useState<GhnOrder[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [storeId, setStoreId] = useState<string>('');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  
  // Pagination
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 20,
    showSizeChanger: true,
    pageSizeOptions: ['10', '20', '50', '100'],
    showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} đơn hàng GHN`,
  });

  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  
  // Track which order is being updated
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});

  // Fetch GHN orders
  const fetchGhnOrders = useCallback(async () => {
    try {
      setLoading(true);

      const params: any = {
        page: (pagination.current || 1) - 1, // Backend uses 0-based
        size: pagination.pageSize || 20,
        sortBy: sortBy,
        sortDir: sortDir,
      };

      if (storeId.trim()) {
        params.storeId = storeId.trim();
      }

      if (dateRange && dateRange[0] && dateRange[1]) {
        params.fromDate = dateRange[0].format('YYYY-MM-DD');
        params.toDate = dateRange[1].format('YYYY-MM-DD');
      }

      const response = await AdminGhnOrderService.getGhnOrders(params);
      
      setGhnOrders(response.data.content);
      setPagination(prev => ({
        ...prev,
        total: response.data.totalElements,
        current: response.data.number + 1,
      }));
    } catch (err: any) {
      const errorMessage = err?.message || 'Không thể tải danh sách đơn hàng GHN';
      showCenterError(errorMessage, 'Lỗi tải dữ liệu');
      setGhnOrders([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, pagination.pageSize, storeId, dateRange, sortBy, sortDir]);

  useEffect(() => {
    fetchGhnOrders();
  }, [fetchGhnOrders]);

  const handleTableChange = (newPagination: TablePaginationConfig, _filters: any, sorter: any) => {
    setPagination(prev => ({
      ...prev,
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    }));

    if (sorter && sorter.field) {
      setSortBy(sorter.field);
      setSortDir(sorter.order === 'ascend' ? 'asc' : 'desc');
    }
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
    // Trigger fetch immediately when search button is clicked
    // The useEffect will also trigger when dependencies change
  };

  const handleReset = () => {
    setStoreId('');
    setDateRange(null);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleStatusChange = useCallback(async (ghnOrderId: string, newStatus: string) => {
    try {
      setUpdatingStatus(prev => ({ ...prev, [ghnOrderId]: true }));
      
      // Update status via API
      const updatedOrder = await AdminGhnOrderService.updateGhnOrderStatus(ghnOrderId, newStatus);
      
      // Update local state immediately for better UX
      setGhnOrders(prev => 
        prev.map(order => 
          order.id === ghnOrderId 
            ? { ...order, status: updatedOrder.status, updatedAt: updatedOrder.updatedAt }
            : order
        )
      );
      
      showCenterSuccess('Cập nhật trạng thái thành công', 'Thành công');
      
      // Refresh the list to ensure data consistency
      await fetchGhnOrders();
    } catch (err: any) {
      const errorMessage = err?.message || 'Không thể cập nhật trạng thái';
      showCenterError(errorMessage, 'Lỗi cập nhật');
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [ghnOrderId]: false }));
    }
  }, [fetchGhnOrders]);

  const getStatusTag = (status: string) => {
    const config = GHN_STATUS_CONFIG[status] || { label: status, color: 'default' };
    return <Tag color={config.color}>{config.label}</Tag>;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return dayjs(dateString).format('DD/MM/YYYY HH:mm');
  };

  const columns: ColumnsType<GhnOrder> = useMemo(() => [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 280,
      fixed: 'left',
      render: (text: string) => (
        <span className="font-mono text-xs text-gray-500">{text}</span>
      ),
    },
    {
      title: 'Mã đơn GHN',
      dataIndex: 'orderGhn',
      key: 'orderGhn',
      width: 120,
      render: (text: string) => (
        <span className="font-mono font-semibold text-blue-600">{text}</span>
      ),
    },
    {
      title: 'ID Đơn hàng',
      dataIndex: 'storeOrderId',
      key: 'storeOrderId',
      width: 200,
      render: (text: string) => (
        <span className="font-mono text-sm text-gray-600">{text}</span>
      ),
    },
    {
      title: 'ID Cửa hàng',
      dataIndex: 'storeId',
      key: 'storeId',
      width: 200,
      render: (text: string) => (
        <span className="font-mono text-sm text-gray-600">{text}</span>
      ),
    },
    {
      title: 'Tổng phí',
      dataIndex: 'totalFee',
      key: 'totalFee',
      width: 150,
      align: 'right',
      sorter: true,
      render: (amount: number) => (
        <span className="font-semibold text-green-600">{formatCurrency(amount)}</span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      filters: Object.keys(GHN_STATUS_CONFIG).map(status => ({
        text: GHN_STATUS_CONFIG[status].label,
        value: status,
      })),
      render: (status: string) => getStatusTag(status),
    },
    {
      title: 'Thời gian dự kiến',
      dataIndex: 'expectedDeliveryTime',
      key: 'expectedDeliveryTime',
      width: 180,
      sorter: true,
      render: (dateString: string) => (
        <span className="text-gray-700">{formatDate(dateString)}</span>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      sorter: true,
      defaultSortOrder: 'descend' as const,
      render: (dateString: string) => (
        <span className="text-gray-600">{formatDate(dateString)}</span>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 250,
      fixed: 'right',
      render: (_: any, record: GhnOrder) => {
        const isUpdating = updatingStatus[record.id] || false;
        const currentStatus = record.status;
        
        return (
          <Select
            value={currentStatus}
            onChange={(newStatus) => handleStatusChange(record.id, newStatus)}
            loading={isUpdating}
            disabled={isUpdating}
            style={{ width: '100%' }}
            size="small"
            placeholder="Chọn trạng thái"
          >
            {GHN_STATUSES.map(status => {
              const config = GHN_STATUS_CONFIG[status] || { label: status, color: 'default' };
              return (
                <Select.Option key={status} value={status}>
                  {config.label}
                </Select.Option>
              );
            })}
          </Select>
        );
      },
    },
  ], [updatingStatus, handleStatusChange]);

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Cập nhật trạng thái GHN
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Quản lý và theo dõi trạng thái đơn hàng GHN
          </p>
        </div>
      </div>

      {/* Filter Section */}
      <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ID Cửa hàng
            </label>
            <Input
              placeholder="Nhập ID cửa hàng"
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              allowClear
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Khoảng thời gian
            </label>
            <RangePicker
              className="w-full"
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [Dayjs | null, Dayjs | null] | null)}
              format="DD/MM/YYYY"
              allowClear
            />
          </div>
          <div className="flex items-end">
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleSearch}
                loading={loading}
              >
                Tìm kiếm
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleReset}
              >
                Đặt lại
              </Button>
            </Space>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <Table
          columns={columns}
          dataSource={ghnOrders}
          loading={loading}
          rowKey="id"
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
          locale={{
            emptyText: (
              <div className="py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 className="mt-4 text-lg font-medium text-gray-900">Không có đơn hàng GHN</h3>
                <p className="mt-2 text-gray-500">
                  {storeId || dateRange
                    ? 'Không tìm thấy đơn hàng GHN nào phù hợp với bộ lọc của bạn.'
                    : 'Chưa có đơn hàng GHN nào trong hệ thống.'}
                </p>
              </div>
            ),
          }}
        />
      </div>
    </div>
  );
};

export default GhnOrderStatusPage;

