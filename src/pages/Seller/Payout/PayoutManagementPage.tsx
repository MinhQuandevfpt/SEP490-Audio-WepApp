import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  DatePicker,
  Button,
  Table,
  Tag,
  Typography,
  Spin,
  Alert,
  Empty,
  Pagination,
  Select,
  Space,
} from 'antd';
import {
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';
import { FinanceService } from '../../../services/seller/FinanceService';
import type { PayoutSummary, PayoutItem, PayoutBucket } from '../../../types/seller';
import { formatCurrency } from '../../../utils/orderStatus';
import dayjs, { type Dayjs } from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const PayoutManagementPage: React.FC = () => {
  const [summary, setSummary] = useState<PayoutSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  
  const [items, setItems] = useState<PayoutItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState<string | null>(null);
  
  const [selectedBucket, setSelectedBucket] = useState<PayoutBucket>('PENDING');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalElements, setTotalElements] = useState(0);

  const loadSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      setSummaryError(null);
      
      const params: { from?: string; to?: string } = {};
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.from = dateRange[0].toISOString();
        params.to = dateRange[1].toISOString();
      }
      
      const data = await FinanceService.getPayoutSummary(params);
      setSummary(data);
    } catch (error: any) {
      setSummaryError(error.message || 'Không thể tải tổng quan chi trả');
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }, [dateRange]);

  const loadItems = useCallback(async () => {
    try {
      setItemsLoading(true);
      setItemsError(null);
      
      const params: {
        bucket: PayoutBucket;
        from?: string;
        to?: string;
        page: number;
        size: number;
      } = {
        bucket: selectedBucket,
        page,
        size: pageSize,
      };
      
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.from = dateRange[0].toISOString();
        params.to = dateRange[1].toISOString();
      }
      
      const data = await FinanceService.getPayoutItems(params);
      setItems(data.items);
      setTotalElements(data.totalElements);
    } catch (error: any) {
      setItemsError(error.message || 'Không thể tải danh sách chi trả');
      setItems([]);
    } finally {
      setItemsLoading(false);
    }
  }, [selectedBucket, dateRange, page, pageSize]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setDateRange(dates);
    setPage(0); // Reset to first page when filter changes
  };

  const handleBucketChange = (value: PayoutBucket) => {
    setSelectedBucket(value);
    setPage(0); // Reset to first page when bucket changes
  };

  const handleRefresh = () => {
    loadSummary();
    loadItems();
  };

  const getBucketLabel = (bucket: PayoutBucket): string => {
    switch (bucket) {
      case 'PENDING':
        return 'Đang chờ';
      case 'ELIGIBLE_NOT_PAYOUT':
        return 'Đủ điều kiện chưa chi trả';
      case 'PAYOUT_DONE':
        return 'Đã chi trả';
      default:
        return bucket;
    }
  };

  const getBucketColor = (bucket: PayoutBucket): string => {
    switch (bucket) {
      case 'PENDING':
        return 'orange';
      case 'ELIGIBLE_NOT_PAYOUT':
        return 'blue';
      case 'PAYOUT_DONE':
        return 'green';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: 'Mã đơn hàng',
      dataIndex: 'orderCode',
      key: 'orderCode',
      render: (text: string) => <Text code>{text}</Text>,
    },
    {
      title: 'Giá trị đơn hàng',
      dataIndex: 'finalLineTotal',
      key: 'finalLineTotal',
      render: (value: number) => (
        <Text strong className="text-blue-600">
          {formatCurrency(value)}
        </Text>
      ),
    },
    {
      title: 'Phí nền tảng',
      dataIndex: 'platformFeeAmount',
      key: 'platformFeeAmount',
      render: (value: number, record: PayoutItem) => (
        <div>
          <Text className="text-red-600">{formatCurrency(value)}</Text>
          <Text type="secondary" className="text-xs ml-1">
            ({record.platformFeePercentage}%)
          </Text>
        </div>
      ),
    },
    {
      title: 'Thực nhận',
      dataIndex: 'netAfterFee',
      key: 'netAfterFee',
      render: (value: number) => (
        <Text strong className="text-green-600">
          {formatCurrency(value)}
        </Text>
      ),
    },
    {
      title: 'Ngày giao hàng',
      dataIndex: 'deliveredAt',
      key: 'deliveredAt',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: (_: any, record: PayoutItem) => (
        <Space direction="vertical" size="small">
          <Tag color={record.eligibleForPayout ? 'green' : 'orange'}>
            {record.eligibleForPayout ? 'Đủ điều kiện' : 'Chưa đủ điều kiện'}
          </Tag>
          {record.isPayout && (
            <Tag color="green">Đã chi trả</Tag>
          )}
          {record.isReturned && (
            <Tag color="red">Đã trả hàng</Tag>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <DollarSign className="w-8 h-8 text-blue-600" />
          <Title level={2} className="!mb-0">
            Quản lý chi trả
          </Title>
        </div>
        <Text type="secondary">Theo dõi và quản lý các khoản chi trả từ đơn hàng</Text>
      </div>

      {/* Filters */}
      <Card title="Bộ lọc" className="shadow-sm">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <div>
              <Text strong className="block mb-2">Khoảng thời gian</Text>
              <RangePicker
                className="w-full"
                format="DD/MM/YYYY"
                value={dateRange}
                onChange={handleDateRangeChange}
                placeholder={['Từ ngày', 'Đến ngày']}
              />
            </div>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <div>
              <Text strong className="block mb-2">Nhóm chi trả</Text>
              <Select
                className="w-full"
                value={selectedBucket}
                onChange={handleBucketChange}
              >
                <Select.Option value="PENDING">Đang chờ</Select.Option>
                <Select.Option value="ELIGIBLE_NOT_PAYOUT">Đủ điều kiện chưa chi trả</Select.Option>
                <Select.Option value="PAYOUT_DONE">Đã chi trả</Select.Option>
              </Select>
            </div>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <div className="flex items-end h-full">
              <Button
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={handleRefresh}
                loading={summaryLoading || itemsLoading}
              >
                Làm mới
              </Button>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Summary Cards */}
      <Card title="Tổng quan chi trả" className="shadow-sm">
        {summaryLoading ? (
          <div className="py-8 text-center">
            <Spin size="large" />
            <div className="mt-4 text-gray-500">Đang tải dữ liệu...</div>
          </div>
        ) : summaryError ? (
          <Alert type="error" message="Lỗi tải tổng quan" description={summaryError} showIcon />
        ) : summary ? (
          <Row gutter={[16, 16]}>
            {/* Pending Balance */}
            <Col xs={24} sm={12} lg={8}>
              <Card className="h-full border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
                <Statistic
                  title={
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-orange-600" />
                      <span className="text-gray-700 font-medium">Tiền đang chờ</span>
                    </div>
                  }
                  value={summary.pendingGross || 0}
                  formatter={(value) => formatCurrency(Number(value))}
                  valueStyle={{ color: '#fa8c16', fontSize: '20px', fontWeight: 'bold' }}
                />
                <div className="mt-2 text-xs text-gray-500">
                  {summary.pendingCount || 0} đơn hàng đang bị giữ
                </div>
              </Card>
            </Col>

            {/* Platform Fee Payable */}
            <Col xs={24} sm={12} lg={8}>
              <Card className="h-full border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                <Statistic
                  title={
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-blue-600" />
                      <span className="text-gray-700 font-medium">Phí nền tảng phải thu</span>
                    </div>
                  }
                  value={summary.platformFeePayable || 0}
                  formatter={(value) => formatCurrency(Number(value))}
                  valueStyle={{ color: '#1890ff', fontSize: '20px', fontWeight: 'bold' }}
                />
                <div className="mt-2 text-xs text-gray-500">
                  {summary.eligibleNotPayoutCount || 0} đơn đã đủ điều kiện 
                </div>
              </Card>
            </Col>

            {/* Available Balance */}
            <Col xs={24} sm={12} lg={8}>
              <Card className="h-full border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
                <Statistic
                  title={
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700 font-medium">Tiền có thể rút</span>
                    </div>
                  }
                  value={summary.availableNet || 0}
                  formatter={(value) => formatCurrency(Number(value))}
                  valueStyle={{ color: '#52c41a', fontSize: '20px', fontWeight: 'bold' }}
                />
                <div className="mt-2 text-xs text-gray-500">
                  {summary.payoutDoneCount || 0} đơn đã chi trả
                </div>
              </Card>
            </Col>

            {/* Additional Info Row */}
            <Col xs={24}>
              <Card className="bg-gray-50">
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12} md={6}>
                    <div>
                      <Text className="text-xs text-gray-500">Tổng tiền gốc đã đủ điều kiện:</Text>
                      <Text strong className="block text-base">
                        {formatCurrency(summary.eligibleNotPayoutGross || 0)}
                      </Text>
                    </div>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <div>
                      <Text className="text-xs text-gray-500">Tổng tiền gốc đã thanh toán:</Text>
                      <Text strong className="block text-base text-green-600">
                        {formatCurrency(summary.availableGross || 0)}
                      </Text>
                    </div>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <div>
                      <Text className="text-xs text-gray-500">Phí nền tảng:</Text>
                      <Text strong className="block text-base text-red-600">
                        {formatCurrency(summary.platformFeePaid || 0)}
                      </Text>
                    </div>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <div>
                      <Text className="text-xs text-gray-500">Tổng tiền thực nhận:</Text>
                      <Text strong className="block text-base text-green-600">
                        {formatCurrency(summary.availableNet || 0)}
                      </Text>
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        ) : (
          <Empty description="Không có dữ liệu tổng quan" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>

      {/* Items Table */}
      <Card 
        title={
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            <span>Chi tiết đơn hàng - {getBucketLabel(selectedBucket)}</span>
            <Tag color={getBucketColor(selectedBucket)} className="ml-2">
              {totalElements} đơn
            </Tag>
          </div>
        }
        className="shadow-sm"
      >
        {itemsLoading ? (
          <div className="py-8 text-center">
            <Spin size="large" />
            <div className="mt-4 text-gray-500">Đang tải danh sách...</div>
          </div>
        ) : itemsError ? (
          <Alert type="error" message="Lỗi tải danh sách" description={itemsError} showIcon />
        ) : items.length > 0 ? (
          <>
            <Table
              columns={columns}
              dataSource={items}
              rowKey="itemId"
              pagination={false}
              scroll={{ x: 'max-content' }}
            />
            <div className="mt-4 flex justify-end">
              <Pagination
                current={page + 1}
                pageSize={pageSize}
                total={totalElements}
                showSizeChanger
                showTotal={(total) => `Tổng ${total} đơn hàng`}
                pageSizeOptions={['10', '20', '50', '100']}
                onChange={(newPage, newSize) => {
                  setPage(newPage - 1);
                  if (newSize !== pageSize) {
                    setPageSize(newSize);
                  }
                }}
              />
            </div>
          </>
        ) : (
          <Empty description="Không có đơn hàng nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Card>
    </div>
  );
};

export default PayoutManagementPage;

