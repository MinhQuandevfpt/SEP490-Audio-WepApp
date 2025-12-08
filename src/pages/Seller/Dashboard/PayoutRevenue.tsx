import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Space,
  Typography,
  Card,
  Row,
  Col,
  Statistic,
  Empty,
  Input,
  Select,
  DatePicker,
  Badge,
  Tooltip,
} from 'antd';
import { EyeOutlined, SearchOutlined, ReloadOutlined, FileTextOutlined } from '@ant-design/icons';
import { DollarSign } from 'lucide-react';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { Dayjs } from 'dayjs';
import { PayoutRevenueService } from '../../../services/seller/PayoutRevenueService';
import type { PayoutBill, PayoutBillStatus } from '../../../types/admin';
import { showCenterError } from '../../../utils/notification';

const { RangePicker } = DatePicker;
const { Option } = Select;

const PayoutRevenue: React.FC = () => {
  const navigate = useNavigate();
  const [payoutBills, setPayoutBills] = useState<PayoutBill[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<PayoutBillStatus | 'ALL'>('ALL');
  const [searchBillCode, setSearchBillCode] = useState<string>('');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [pagination, setPagination] = useState<TablePaginationConfig>({
    current: 1,
    pageSize: 15,
    showSizeChanger: true,
    pageSizeOptions: ['10', '15', '20', '50'],
    showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} hóa đơn`,
  });

  useEffect(() => {
    fetchPayoutBills();
  }, [selectedStatus, dateRange, searchBillCode]);

  const fetchPayoutBills = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      
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

      const bills = await PayoutRevenueService.getPayoutBills(params);
      setPayoutBills(bills || []);
    } catch (error: any) {
      const errorMessage = error?.message || 'Không thể tải danh sách hóa đơn thanh toán';
      showCenterError(errorMessage, 'Lỗi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatus, dateRange, searchBillCode]);

  const handleTableChange = useCallback((newPagination: TablePaginationConfig) => {
    setPagination(newPagination);
  }, []);

  const handleViewDetail = useCallback((billId: string) => {
    // Navigate to detail page (we'll create this later if needed)
    navigate(`/seller/dashboard/revenue/${billId}`);
  }, [navigate]);

  const handleResetFilters = useCallback(() => {
    setSelectedStatus('ALL');
    setSearchBillCode('');
    setDateRange(null);
  }, []);

  // Stats
  const stats = useMemo(() => ({
    total: payoutBills.length,
    pending: payoutBills.filter(b => b.status === 'PENDING').length,
    paid: payoutBills.filter(b => b.status === 'PAID').length,
    canceled: payoutBills.filter(b => b.status === 'CANCELED').length,
    totalPayout: payoutBills
      .filter(b => b.status === 'PAID')
      .reduce((sum, b) => sum + (b.totalNetPayout || 0), 0),
  }), [payoutBills]);

  // Status Badge
  const getStatusBadge = (status: PayoutBillStatus) => {
    const statusConfig = {
      PENDING: { color: 'warning', text: 'Chờ thanh toán' },
      PAID: { color: 'success', text: 'Đã thanh toán' },
      CANCELED: { color: 'default', text: 'Đã hủy' },
    };
    const config = statusConfig[status] || { color: 'default', text: status };
    return <Badge status={config.color as any} text={config.text} />;
  };

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(value);
  };

  // Format datetime
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Table columns
  const columns: ColumnsType<PayoutBill> = [
    {
      title: 'Mã Bill',
      dataIndex: 'billCode',
      key: 'billCode',
      width: 150,
      fixed: 'left',
      render: (text) => (
        <Typography.Text strong style={{ color: '#1890ff' }}>
          {text}
        </Typography.Text>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status: PayoutBillStatus) => getStatusBadge(status),
    },
    {
      title: 'Kỳ thanh toán',
      key: 'period',
      width: 200,
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
            Từ: {record.fromDate ? new Date(record.fromDate).toLocaleDateString('vi-VN') : 'N/A'}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
            Đến: {record.toDate ? new Date(record.toDate).toLocaleDateString('vi-VN') : 'N/A'}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Tổng doanh thu',
      dataIndex: 'totalGross',
      key: 'totalGross',
      width: 150,
      align: 'right',
      render: (value) => (
        <Typography.Text strong style={{ color: '#52c41a' }}>
          {formatCurrency(value || 0)}
        </Typography.Text>
      ),
    },
    {
      title: 'Phí ship',
      dataIndex: 'totalShippingOrderFee',
      key: 'totalShippingOrderFee',
      width: 120,
      align: 'right',
      render: (value) => formatCurrency(value || 0),
    },
    {
      title: 'Phí hoàn',
      dataIndex: 'totalReturnShippingFee',
      key: 'totalReturnShippingFee',
      width: 120,
      align: 'right',
      render: (value) => (
        <Typography.Text type="danger">
          {formatCurrency(value || 0)}
        </Typography.Text>
      ),
    },
    {
      title: 'Thực nhận',
      dataIndex: 'totalNetPayout',
      key: 'totalNetPayout',
      width: 150,
      align: 'right',
      fixed: 'right',
      render: (value) => (
        <Typography.Text strong style={{ color: '#1890ff', fontSize: '15px' }}>
          {formatCurrency(value || 0)}
        </Typography.Text>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (text) => formatDateTime(text),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button
              type="primary"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleViewDetail(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Paginated data
  const paginatedData = useMemo(() => {
    const start = ((pagination.current || 1) - 1) * (pagination.pageSize || 15);
    const end = start + (pagination.pageSize || 15);
    return payoutBills.slice(start, end);
  }, [payoutBills, pagination]);

  return (
    <div style={{ padding: '24px', maxWidth: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <Typography.Title level={3} style={{ margin: 0 }}>
            Doanh thu cửa hàng
          </Typography.Title>
          <Typography.Text type="secondary">
            Xem các hóa đơn thanh toán payout của cửa hàng
          </Typography.Text>
        </div>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tổng hóa đơn"
              value={stats.total}
              prefix={<FileTextOutlined style={{ fontSize: '20px', color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Chờ thanh toán"
              value={stats.pending}
              valueStyle={{ color: '#faad14' }}
              prefix={<DollarSign style={{ fontSize: '20px', color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Đã thanh toán"
              value={stats.paid}
              valueStyle={{ color: '#52c41a' }}
              prefix={<DollarSign style={{ fontSize: '20px', color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tổng đã nhận"
              value={stats.totalPayout}
              formatter={(value) => formatCurrency(value as number)}
              valueStyle={{ color: '#1890ff' }}
              prefix={<DollarSign style={{ fontSize: '20px', color: '#1890ff' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <Typography.Text>Trạng thái:</Typography.Text>
              <Select
                value={selectedStatus}
                onChange={setSelectedStatus}
                style={{ width: '100%', marginTop: '8px' }}
              >
                <Option value="ALL">Tất cả</Option>
                <Option value="PENDING">Chờ thanh toán</Option>
                <Option value="PAID">Đã thanh toán</Option>
                <Option value="CANCELED">Đã hủy</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Typography.Text>Mã Bill:</Typography.Text>
              <Input
                placeholder="Nhập mã bill..."
                prefix={<SearchOutlined />}
                value={searchBillCode}
                onChange={(e) => setSearchBillCode(e.target.value)}
                allowClear
                style={{ marginTop: '8px' }}
              />
            </Col>
            <Col xs={24} sm={12} md={10}>
              <Typography.Text>Khoảng thời gian:</Typography.Text>
              <RangePicker
                value={dateRange}
                onChange={(dates) => setDateRange(dates as [Dayjs | null, Dayjs | null] | null)}
                format="DD/MM/YYYY"
                style={{ width: '100%', marginTop: '8px' }}
              />
            </Col>
          </Row>
          <Row gutter={[16, 16]}>
            <Col>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleResetFilters}
              >
                Đặt lại bộ lọc
              </Button>
            </Col>
          </Row>
        </Space>
      </Card>

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={paginatedData}
          rowKey="id"
          loading={isLoading}
          pagination={{
            ...pagination,
            total: payoutBills.length,
          }}
          onChange={handleTableChange}
          scroll={{ x: 1500 }}
          locale={{
            emptyText: (
              <Empty
                description="Chưa có hóa đơn thanh toán nào"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
        />
      </Card>
    </div>
  );
};

export default PayoutRevenue;
