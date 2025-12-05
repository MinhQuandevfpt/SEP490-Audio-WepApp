import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Card,
  Row,
  Col,
  Statistic,
  Tabs,
  Empty,
  Input,
  Select,
  DatePicker,
  Form,
  Badge,
} from 'antd';
import { EyeOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { DollarSign } from 'lucide-react';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import { AdminPayoutService } from '../../../services/admin/AdminPayoutService';
import { AdminStoreService } from '../../../services/admin/AdminStoreService';
import type { PayoutBill, PayoutBillStatus, PayoutBillListParams } from '../../../types/admin';
import { showCenterError } from '../../../utils/notification';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface StoreOption {
  id: string;
  name: string;
}

const PayoutManagement: React.FC = () => {
  const navigate = useNavigate();
  const [payoutBills, setPayoutBills] = useState<PayoutBill[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<PayoutBillStatus | 'ALL'>('ALL');
  const [searchBillCode, setSearchBillCode] = useState<string>('');
  const [storeId, setStoreId] = useState<string>('');
  const [selectedStoreName, setSelectedStoreName] = useState<string>('');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [storeMap, setStoreMap] = useState<Map<string, StoreOption>>(new Map());
  const [storesLoading, setStoresLoading] = useState(false);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 15,
    showSizeChanger: true,
    pageSizeOptions: ['10', '15', '20', '50'],
    showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} hóa đơn`,
  });

  // Get unique store IDs from bills
  const uniqueStoreIds = useMemo(() => {
    const ids = new Set<string>();
    payoutBills.forEach(bill => {
      if (bill.shopId) {
        ids.add(bill.shopId);
      }
    });
    return Array.from(ids);
  }, [payoutBills]);

  // Load store names when bills change
  useEffect(() => {
    if (uniqueStoreIds.length === 0) return;

    const loadStoreNames = async () => {
      // Check which stores are not yet loaded
      const uncachedIds: string[] = [];
      uniqueStoreIds.forEach(id => {
        if (!storeMap.has(id)) {
          uncachedIds.push(id);
        }
      });
      
      if (uncachedIds.length === 0) return;
      
      setStoresLoading(true);
      try {
        const stores = await AdminStoreService.getStoresByIds(uncachedIds);
        
        setStoreMap(prev => {
          const newMap = new Map(prev);
          stores.forEach((storeInfo, storeId) => {
            newMap.set(storeId, {
              id: storeId,
              name: storeInfo.name || `Cửa hàng ${storeId.slice(0, 8)}`
            });
          });
          return newMap;
        });
      } catch (error) {
        // Silently fail - store names are not critical
      } finally {
        setStoresLoading(false);
      }
    };

    loadStoreNames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uniqueStoreIds.join(',')]);

  useEffect(() => {
    fetchPayoutBills();
  }, [selectedStatus, dateRange, searchBillCode, storeId]);

  const fetchPayoutBills = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: PayoutBillListParams = {};
      
      if (selectedStatus !== 'ALL') {
        params.status = selectedStatus;
      }
      
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.fromDate = dateRange[0].format('YYYY-MM-DDTHH:mm:ss');
        params.toDate = dateRange[1].format('YYYY-MM-DDTHH:mm:ss');
      }
      
      if (searchBillCode.trim()) {
        params.billCode = searchBillCode.trim();
      }
      
      if (storeId.trim()) {
        params.storeId = storeId.trim();
      }

      const bills = await AdminPayoutService.getPayoutBills(params);
      setPayoutBills(bills || []);
    } catch (error: any) {
      const errorMessage = error?.message || 'Không thể tải danh sách hóa đơn payout';
      showCenterError(errorMessage, 'Lỗi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus, dateRange, searchBillCode, storeId]);

  const handleTableChange = useCallback((newPagination: TablePaginationConfig) => {
    setPagination(newPagination);
  }, []);

  const handleViewDetail = useCallback((billId: string) => {
    navigate(`/admin/reports/payout/${billId}`);
  }, [navigate]);

  const handleResetFilters = useCallback(() => {
    setSelectedStatus('ALL');
    setSearchBillCode('');
    setStoreId('');
    setSelectedStoreName('');
    setDateRange(null);
  }, []);

  const handleStoreNameChange = useCallback((storeName: string) => {
    setSelectedStoreName(storeName);
    // Find store ID from name
    if (storeName) {
      const store = Array.from(storeMap.values()).find(s => s.name === storeName);
      if (store) {
        setStoreId(store.id);
      }
    } else {
      setStoreId('');
    }
  }, [storeMap]);

  const getStatusTag = useMemo(() => (status: PayoutBillStatus) => {
    const statusConfig = {
      PENDING: { color: 'warning', text: 'Chờ thanh toán' },
      PAID: { color: 'success', text: 'Đã thanh toán' },
      CANCELED: { color: 'error', text: 'Đã hủy' }
    };
    
    const config = statusConfig[status];
    return <Tag color={config.color}>{config.text}</Tag>;
  }, []);

  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }, []);

  const formatDateTime = useCallback((dateTime: string): string => {
    return new Date(dateTime).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);


  // Get unique stores for dropdown
  const storeOptions = useMemo(() => {
    const stores = new Map<string, StoreOption>();
    payoutBills.forEach(bill => {
      if (bill.shopId) {
        const store = storeMap.get(bill.shopId);
        if (store) {
          stores.set(bill.shopId, store);
        } else {
          stores.set(bill.shopId, {
            id: bill.shopId,
            name: `Cửa hàng ${bill.shopId.slice(0, 8)}`
          });
        }
      }
    });
    return Array.from(stores.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [payoutBills, storeMap]);

  // Stats
  const stats = useMemo(() => ({
    total: payoutBills.length,
    pending: payoutBills.filter(b => b.status === 'PENDING').length,
    paid: payoutBills.filter(b => b.status === 'PAID').length,
    canceled: payoutBills.filter(b => b.status === 'CANCELED').length,
    totalAmount: payoutBills.reduce((sum, b) => sum + b.totalNetPayout, 0),
  }), [payoutBills]);

  // Filter data based on selected status
  const filteredData = useMemo(() => {
    let filtered = payoutBills;
    
    if (selectedStatus !== 'ALL') {
      filtered = filtered.filter(bill => bill.status === selectedStatus);
    }
    
    return filtered;
  }, [selectedStatus, payoutBills]);

  const columns: ColumnsType<PayoutBill> = useMemo(() => [
    {
      title: 'Mã hóa đơn',
      dataIndex: 'billCode',
      key: 'billCode',
      width: 150,
      render: (billCode: string, record: PayoutBill) => (
        <div>
          <div className="font-medium text-blue-600">{billCode}</div>
          <div className="text-xs text-gray-500">ID: {record.id.slice(0, 8)}...</div>
        </div>
      ),
    },
    {
      title: 'Cửa hàng',
      dataIndex: 'shopId',
      key: 'shopId',
      width: 220,
      render: (shopId: string) => {
        const store = storeMap.get(shopId);
        const storeName = store?.name;
        const isRealName = storeName && !storeName.startsWith('Cửa hàng ');
        
        return (
          <div>
            {isRealName ? (
              <>
                <div className="font-medium text-gray-900">{storeName}</div>
                <div className="text-xs text-gray-500">ID: {shopId.slice(0, 8)}...</div>
              </>
            ) : (
              <div className="text-sm text-gray-600">{shopId.slice(0, 8)}...</div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Khoảng thời gian',
      key: 'dateRange',
      width: 200,
      render: (_: any, record: PayoutBill) => (
        <div className="text-sm">
          <div className="text-gray-900">
            {formatDateTime(record.fromDate)}
          </div>
          <div className="text-xs text-gray-500">
            đến {formatDateTime(record.toDate)}
          </div>
        </div>
      ),
    },
    {
      title: 'Tổng doanh thu',
      dataIndex: 'totalGross',
      key: 'totalGross',
      width: 150,
      align: 'right',
      render: (totalGross: number) => (
        <span className="font-medium text-gray-900">
          {formatCurrency(totalGross)}
        </span>
      ),
    },
    {
      title: 'Phí nền tảng',
      dataIndex: 'totalPlatformFee',
      key: 'totalPlatformFee',
      width: 150,
      align: 'right',
      render: (totalPlatformFee: number) => (
        <span className="text-orange-600">
          {formatCurrency(totalPlatformFee)}
        </span>
      ),
    },
    {
      title: 'Phí vận chuyển',
      key: 'shippingFee',
      width: 150,
      align: 'right',
      render: (_: any, record: PayoutBill) => (
        <span className="text-gray-600">
          {formatCurrency(record.totalShippingOrderFee + record.totalReturnShippingFee)}
        </span>
      ),
    },
    {
      title: 'Số tiền thanh toán',
      dataIndex: 'totalNetPayout',
      key: 'totalNetPayout',
      width: 180,
      align: 'right',
      render: (totalNetPayout: number) => (
        <span className="font-bold text-green-600 text-base">
          {formatCurrency(totalNetPayout)}
        </span>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      filters: [
        { text: 'Chờ thanh toán', value: 'PENDING' },
        { text: 'Đã thanh toán', value: 'PAID' },
        { text: 'Đã hủy', value: 'CANCELED' },
      ],
      onFilter: (value: any, record: PayoutBill) => record.status === value,
      render: (status: PayoutBillStatus) => getStatusTag(status),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      sorter: (a: PayoutBill, b: PayoutBill) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (createdAt: string) => (
        <span className="text-sm text-gray-600">
          {formatDateTime(createdAt)}
        </span>
      ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_: any, record: PayoutBill) => (
        <Space size="small">
          <Button
            type="primary"
            ghost
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record.id)}
          >
            Chi tiết
          </Button>
        </Space>
      ),
    },
  ], [getStatusTag, handleViewDetail, formatCurrency, formatDateTime, storeMap]);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%', padding: '24px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Quản lý thanh toán cho cửa hàng
          </Typography.Title>
          <Typography.Text type="secondary">
            Xem và quản lý các hóa đơn thanh toán payout cho cửa hàng
          </Typography.Text>
        </div>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tổng hóa đơn"
              value={stats.total}
              prefix={<DollarSign style={{ fontSize: '20px', color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Chờ thanh toán"
              value={stats.pending}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Đã thanh toán"
              value={stats.paid}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tổng tiền thanh toán"
              value={stats.totalAmount}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: '#1890ff', fontSize: '16px' }}
              prefix={<DollarSign />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card>
        <Form layout="vertical">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item label="Tìm mã hóa đơn" style={{ marginBottom: 0 }}>
                <Input
                  placeholder="Nhập mã hóa đơn (PB-xxxx)"
                  prefix={<SearchOutlined />}
                  value={searchBillCode}
                  onChange={(e) => setSearchBillCode(e.target.value)}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item label="Tên cửa hàng" style={{ marginBottom: 0 }}>
                <Select
                  placeholder="Chọn cửa hàng"
                  value={selectedStoreName || undefined}
                  onChange={handleStoreNameChange}
                  allowClear
                  showSearch
                  filterOption={(input, option) => {
                    const label = option?.label as string;
                    return label ? label.toLowerCase().includes(input.toLowerCase()) : false;
                  }}
                  loading={storesLoading}
                  style={{ width: '100%' }}
                >
                  {storeOptions.map(store => (
                    <Option key={store.id} value={store.name} label={store.name}>
                      {store.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item label="ID cửa hàng" style={{ marginBottom: 0 }}>
                <Input
                  placeholder="Nhập ID cửa hàng"
                  value={storeId}
                  onChange={(e) => {
                    setStoreId(e.target.value);
                    if (!e.target.value) {
                      setSelectedStoreName('');
                    }
                  }}
                  allowClear
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Form.Item label="Khoảng thời gian" style={{ marginBottom: 0 }}>
                <RangePicker
                  style={{ width: '100%' }}
                  value={dateRange}
                  onChange={(dates) => setDateRange(dates)}
                  format="DD/MM/YYYY HH:mm"
                  showTime={{ format: 'HH:mm' }}
                  placeholder={['Từ ngày', 'Đến ngày']}
                />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12} md={8} lg={4}>
              <Form.Item label=" " style={{ marginBottom: 0 }}>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleResetFilters}
                  block
                >
                  Đặt lại
                </Button>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Filter Tabs */}
      <Tabs
        activeKey={selectedStatus}
        onChange={(key) => setSelectedStatus(key as any)}
        items={(['ALL', 'PENDING', 'PAID', 'CANCELED'] as const).map((status) => ({
          key: status,
          label: (
            <Space>
              <span>
                {status === 'ALL' ? 'Tất cả' : 
                 status === 'PENDING' ? 'Chờ thanh toán' : 
                 status === 'PAID' ? 'Đã thanh toán' : 'Đã hủy'}
              </span>
              <Badge
                count={
                  status === 'ALL' ? stats.total :
                  status === 'PENDING' ? stats.pending :
                  status === 'PAID' ? stats.paid : stats.canceled
                }
                style={{ backgroundColor: '#1890ff' }}
              />
            </Space>
          ),
        }))}
      />

      {/* Ant Design Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredData}
          loading={isLoading}
          rowKey="id"
          pagination={pagination}
          onChange={handleTableChange}
          scroll={{ x: 1400 }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span>
                    Chưa có hóa đơn payout nào.
                  </span>
                }
              />
            ),
          }}
        />
      </Card>
    </Space>
  );
};

export default PayoutManagement;
