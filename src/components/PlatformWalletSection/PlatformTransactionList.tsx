import React, { useState, useEffect } from 'react';
import {
  Card,
  Select,
  DatePicker,
  Button,
  Space,
  Tag,
  Typography,
  Descriptions,
  Statistic,
  Row,
  Col,
  Empty,
  Spin,
  Pagination,
  Divider
} from 'antd';
import {
  FilterOutlined,
  ClearOutlined,
  ReloadOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  EyeInvisibleOutlined
} from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { PlatformWalletService } from '../../services/admin/PlatformWalletService';
import type {
  PlatformTransaction,
  PlatformTransactionType,
  PlatformTransactionStatus
} from '../../types/admin';
import { showCenterError } from '../../utils/notification';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const PlatformTransactionList: React.FC = () => {
  const [transactions, setTransactions] = useState<PlatformTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Filter states
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState<{
    type?: PlatformTransactionType;
    status?: PlatformTransactionStatus;
    dateRange?: [Dayjs, Dayjs];
  }>({});

  useEffect(() => {
    loadTransactions();
  }, [currentPage, pageSize]);

  const loadTransactions = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        page: currentPage - 1,
        size: pageSize
      };

      if (filters.type) params.type = filters.type;
      if (filters.status) params.status = filters.status;
      if (filters.dateRange) {
        params.from = filters.dateRange[0].toISOString();
        params.to = filters.dateRange[1].toISOString();
      }

      const data = await PlatformWalletService.getPlatformTransactions(params);
      setTransactions(data.content);
      setTotalElements(data.totalElements);
    } catch (error: any) {
      showCenterError(
        error?.message || 'Không thể tải danh sách giao dịch',
        'Lỗi'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    loadTransactions();
  };

  const handleClearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDateTime = (dateString: string): string => {
    return dayjs(dateString).format('DD/MM/YYYY HH:mm:ss');
  };

  const getTypeLabel = (type: PlatformTransactionType): string => {
    const labels: Record<PlatformTransactionType, string> = {
      HOLD: 'Giữ tiền',
      RELEASE: 'Giải phóng',
      REFUND: 'Hoàn tiền',
      TRANSFER: 'Chuyển khoản',
      WITHDRAW: 'Rút tiền',
      DEPOSIT: 'Nạp tiền',
      INITIALIZE: 'Khởi tạo',
      PAYOUT_STORE: 'Chi trả cửa hàng',
      PLATFORM_FEE: 'Phí nền tảng',
      SHIPPING_FEE_ADJUST: 'Điều chỉnh phí ship',
      REFUND_CUSTOMER_RETURN: 'Hoàn trả khách',
      DEBT_PAYMENT: 'Thanh toán nợ',
      TOPUP: 'Nạp tiền',
      COD_COLLECTED: 'Thu tiền COD'
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: PlatformTransactionType): string => {
    const colors: Record<PlatformTransactionType, string> = {
      HOLD: 'gold',
      RELEASE: 'green',
      REFUND: 'red',
      TRANSFER: 'blue',
      WITHDRAW: 'orange',
      DEPOSIT: 'cyan',
      INITIALIZE: 'purple',
      PAYOUT_STORE: 'geekblue',
      PLATFORM_FEE: 'magenta',
      SHIPPING_FEE_ADJUST: 'lime',
      REFUND_CUSTOMER_RETURN: 'volcano',
      DEBT_PAYMENT: 'cyan',
      TOPUP: 'green',
      COD_COLLECTED: 'green'
    };
    return colors[type] || 'default';
  };

  const getStatusColor = (status: PlatformTransactionStatus): string => {
    const colors = {
      PENDING: 'processing',
      DONE: 'success',
      FAILED: 'error',
      SUCCESS: 'success'
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (status: PlatformTransactionStatus): string => {
    const labels = {
      PENDING: 'Đang xử lý',
      DONE: 'Hoàn thành',
      FAILED: 'Thất bại',
      SUCCESS: 'Thành công'
    };
    return labels[status] || status;
  };

  const getChannelLabel = (channel: string): string => {
    const labels: Record<string, string> = {
      'PAYOS': 'PayOS',
      'INTERNAL': 'Nội bộ',
      'BANK_TRANSFER': 'Chuyển khoản ngân hàng'
    };
    return labels[channel] || channel;
  };

  const formatDescription = (description: string): string => {
    // Store topup via PayOS
    if (description.includes('Store topup via PayOS')) {
      return 'Cửa hàng nạp tiền qua PayOS';
    }
    
    // Store pay debt from defaultBalance
    if (description.includes('Store pay debt from defaultBalance')) {
      return 'Cửa hàng thanh toán công nợ cho nền tảng';
    }
    
    // Chi rút tiền cho cửa hàng
    if (description.includes('Chi rút tiền cho cửa hàng')) {
      return 'Chi tiền rút cho cửa hàng';
    }
    
    // Store withdraw
    if (description.includes('Store withdraw')) {
      return 'Cửa hàng yêu cầu rút tiền';
    }
    
    // INIT platform wallet ledger
    if (description.includes('INIT platform wallet ledger')) {
      return 'Khởi tạo sổ cái ví nền tảng';
    }
    
    // Customer topup/deposit
    if (description.toLowerCase().includes('customer') && (description.toLowerCase().includes('topup') || description.toLowerCase().includes('deposit'))) {
      return 'Khách hàng nạp tiền';
    }
    
    // Customer withdraw
    if (description.toLowerCase().includes('customer') && description.toLowerCase().includes('withdraw')) {
      return 'Khách hàng rút tiền';
    }
    
    // Order payment
    if (description.toLowerCase().includes('order') && description.toLowerCase().includes('payment')) {
      return 'Thanh toán đơn hàng';
    }
    
    // Refund
    if (description.toLowerCase().includes('refund')) {
      return 'Hoàn tiền cho khách hàng';
    }
    
    // Commission
    if (description.toLowerCase().includes('commission')) {
      return 'Thu phí hoa hồng';
    }
    
    // Platform fee
    if (description.toLowerCase().includes('platform fee')) {
      return 'Thu phí nền tảng';
    }
    
    // Shipping fee
    if (description.toLowerCase().includes('shipping')) {
      return 'Điều chỉnh phí vận chuyển';
    }
    
    // Payout to store
    if (description.toLowerCase().includes('payout') && description.toLowerCase().includes('store')) {
      return 'Chi trả cho cửa hàng';
    }
    
    // Default: return original if no match
    return description;
  };

  const renderTransactionItem = (transaction: PlatformTransaction) => {
    const isExpanded = expandedIds.has(transaction.id);

    return (
      <Card
        key={transaction.id}
        style={{ marginBottom: 16 }}
        hoverable
        bodyStyle={{ padding: '20px' }}
      >
        {/* Main Transaction Info */}
        <Row gutter={[16, 16]} align="middle">
          {/* Icon & Type */}
          <Col xs={24} sm={24} md={5} lg={4}>
            <Space direction="vertical" size="small">
              <Space>
                {transaction.direction === 'IN' ? (
                  <ArrowDownOutlined style={{ fontSize: 20, color: '#52c41a' }} />
                ) : (
                  <ArrowUpOutlined style={{ fontSize: 20, color: '#ff4d4f' }} />
                )}
                <Tag color={getTypeColor(transaction.type)}>
                  {getTypeLabel(transaction.type)}
                </Tag>
              </Space>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {getChannelLabel(transaction.channel)}
              </Text>
            </Space>
          </Col>

          {/* Amount */}
          <Col xs={12} sm={12} md={5} lg={4}>
            <Space direction="vertical" size={0}>
              <Text type="secondary" style={{ fontSize: 12 }}>Số tiền</Text>
              <Text
                strong
                style={{
                  fontSize: 16,
                  color: transaction.direction === 'IN' ? '#52c41a' : '#ff4d4f'
                }}
              >
                {transaction.direction === 'IN' ? '+' : '-'}
                {formatCurrency(transaction.amount)}
              </Text>
            </Space>
          </Col>

          {/* Balance */}
          <Col xs={12} sm={12} md={6} lg={5}>
            <Space direction="vertical" size={0}>
              <Text type="secondary" style={{ fontSize: 12 }}>Số dư</Text>
              <Space direction="vertical" size={0} style={{ fontSize: 13 }}>
                <Text>Trước: {formatCurrency(transaction.balanceBefore)}</Text>
                <Text strong>Sau: {formatCurrency(transaction.balanceAfter)}</Text>
              </Space>
            </Space>
          </Col>

          {/* Description & Time */}
          <Col xs={24} sm={24} md={6} lg={7}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text ellipsis style={{ fontSize: 13 }}>
                {formatDescription(transaction.description || 'Không có mô tả')}
              </Text>
              <Space size="small">
                <ClockCircleOutlined style={{ fontSize: 12, color: '#8c8c8c' }} />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {formatDateTime(transaction.createdAt)}
                </Text>
              </Space>
            </Space>
          </Col>

          {/* Status & Action */}
          <Col xs={24} sm={24} md={2} lg={4} style={{ textAlign: 'right' }}>
            <Space direction="vertical" size="small" align="end" style={{ width: '100%' }}>
              <Tag color={getStatusColor(transaction.status)}>
                {getStatusLabel(transaction.status)}
              </Tag>
              <Button
                type="link"
                size="small"
                icon={isExpanded ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                onClick={() => toggleExpand(transaction.id)}
              >
                {isExpanded ? 'Ẩn' : 'Chi tiết'}
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Expanded Details */}
        {isExpanded && (
          <>
            <Divider style={{ margin: '16px 0' }} />
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              {/* Summary Stats */}
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Card size="small">
                    <Statistic
                      title="Số tiền giao dịch"
                      value={transaction.amount}
                      precision={0}
                      valueStyle={{
                        color: transaction.direction === 'IN' ? '#3f8600' : '#cf1322',
                        fontSize: 20
                      }}
                      prefix={transaction.direction === 'IN' ? '+' : '-'}
                      suffix="đ"
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12}>
                  <Card size="small">
                    <Statistic
                      title="Số dư sau giao dịch"
                      value={transaction.balanceAfter}
                      precision={0}
                      valueStyle={{ fontSize: 20 }}
                      suffix="đ"
                    />
                  </Card>
                </Col>
              </Row>

              {/* Basic Info */}
              <Card title="Thông tin cơ bản" size="small">
                <Descriptions column={{ xs: 1, sm: 1, md: 2 }} bordered size="small">
                  <Descriptions.Item label="ID Giao dịch" span={2}>
                    <Text copyable style={{ fontSize: 11, fontFamily: 'monospace' }}>
                      {transaction.id}
                    </Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Loại giao dịch">
                    <Tag color={getTypeColor(transaction.type)}>
                      {getTypeLabel(transaction.type)}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Trạng thái">
                    <Tag color={getStatusColor(transaction.status)}>
                      {getStatusLabel(transaction.status)}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Hướng giao dịch">
                    <Tag
                      icon={transaction.direction === 'IN' ? <ArrowDownOutlined /> : <ArrowUpOutlined />}
                      color={transaction.direction === 'IN' ? 'success' : 'error'}
                    >
                      {transaction.direction === 'IN' ? 'Tiền vào' : 'Tiền ra'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Kênh thanh toán">
                    {getChannelLabel(transaction.channel)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Loại ví">
                    <Tag color={transaction.bucket === 'CASH' ? 'green' : 'gold'}>
                      {transaction.bucket === 'CASH' ? 'Tiền mặt' : 'Đang chờ'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Mô tả" span={2}>
                    {formatDescription(transaction.description || 'Không có mô tả')}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              {/* Related IDs */}
              <Card title="ID liên quan" size="small">
                <Descriptions column={1} bordered size="small">
                  <Descriptions.Item label="ID Ví">
                    <Text copyable style={{ fontSize: 11, fontFamily: 'monospace' }}>
                      {transaction.walletId}
                    </Text>
                  </Descriptions.Item>
                  {transaction.orderId && (
                    <Descriptions.Item label="ID Đơn hàng">
                      <Text copyable style={{ fontSize: 11, fontFamily: 'monospace', color: '#1890ff' }}>
                        {transaction.orderId}
                      </Text>
                    </Descriptions.Item>
                  )}
                  {transaction.storeId && (
                    <Descriptions.Item label="ID Cửa hàng">
                      <Text copyable style={{ fontSize: 11, fontFamily: 'monospace', color: '#722ed1' }}>
                        {transaction.storeId}
                      </Text>
                    </Descriptions.Item>
                  )}
                  {transaction.customerId && (
                    <Descriptions.Item label="ID Khách hàng">
                      <Text copyable style={{ fontSize: 11, fontFamily: 'monospace', color: '#52c41a' }}>
                        {transaction.customerId}
                      </Text>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>

              {/* Balance Info */}
              <Card title="Thông tin số dư" size="small">
                <Descriptions column={2} bordered size="small">
                  <Descriptions.Item label="Số dư trước">
                    {formatCurrency(transaction.balanceBefore)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Số dư sau">
                    {formatCurrency(transaction.balanceAfter)}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              {/* Financial Details */}
              {(transaction.itemAmount > 0 ||
                transaction.commissionAmount > 0 ||
                transaction.shipReal > 0) && (
                <Card title="Chi tiết tài chính" size="small">
                  <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
                    {transaction.itemAmount > 0 && (
                      <Descriptions.Item label="Giá trị hàng">
                        {formatCurrency(transaction.itemAmount)}
                      </Descriptions.Item>
                    )}
                    {transaction.shipCustomerPaid > 0 && (
                      <Descriptions.Item label="Phí ship KH trả">
                        {formatCurrency(transaction.shipCustomerPaid)}
                      </Descriptions.Item>
                    )}
                    {transaction.shipReal > 0 && (
                      <Descriptions.Item label="Phí ship thực">
                        {formatCurrency(transaction.shipReal)}
                      </Descriptions.Item>
                    )}
                    {transaction.shipDiffChargeStore !== 0 && (
                      <Descriptions.Item label="Chênh lệch ship">
                        {formatCurrency(transaction.shipDiffChargeStore)}
                      </Descriptions.Item>
                    )}
                    {transaction.commissionAmount > 0 && (
                      <Descriptions.Item label={`Hoa hồng (${transaction.commissionRate}%)`}>
                        <Text type="warning">{formatCurrency(transaction.commissionAmount)}</Text>
                      </Descriptions.Item>
                    )}
                    {transaction.payoutGross > 0 && (
                      <Descriptions.Item label="Tổng chi trả">
                        {formatCurrency(transaction.payoutGross)}
                      </Descriptions.Item>
                    )}
                    {transaction.debtDeducted > 0 && (
                      <Descriptions.Item label="Nợ đã trừ">
                        <Text type="danger">{formatCurrency(transaction.debtDeducted)}</Text>
                      </Descriptions.Item>
                    )}
                    {transaction.payoutNet > 0 && (
                      <Descriptions.Item label="Chi trả thực nhận">
                        <Text type="success">{formatCurrency(transaction.payoutNet)}</Text>
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </Card>
              )}

              {/* Reference IDs */}
              {(transaction.idempotencyKey || transaction.externalRefId || transaction.externalRefCode || transaction.payoutRequestId) && (
                <Card title="Mã tham chiếu" size="small">
                  <Descriptions column={1} bordered size="small">
                    {transaction.idempotencyKey && (
                      <Descriptions.Item label="Mã định danh duy nhất">
                        <Text copyable style={{ fontSize: 11, fontFamily: 'monospace' }}>
                          {transaction.idempotencyKey}
                        </Text>
                      </Descriptions.Item>
                    )}
                    {transaction.externalRefId && (
                      <Descriptions.Item label="Mã tham chiếu ngoài">
                        <Text copyable style={{ fontSize: 11, fontFamily: 'monospace' }}>
                          {transaction.externalRefId}
                        </Text>
                      </Descriptions.Item>
                    )}
                    {transaction.externalRefCode && (
                      <Descriptions.Item label="Mã code tham chiếu">
                        <Text copyable style={{ fontSize: 11, fontFamily: 'monospace' }}>
                          {transaction.externalRefCode}
                        </Text>
                      </Descriptions.Item>
                    )}
                    {transaction.payoutRequestId && (
                      <Descriptions.Item label="Mã yêu cầu chi trả">
                        <Text copyable style={{ fontSize: 11, fontFamily: 'monospace', color: '#1890ff' }}>
                          {transaction.payoutRequestId}
                        </Text>
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </Card>
              )}

              {/* Timestamps */}
              <Card title="Thời gian" size="small">
                <Descriptions column={2} bordered size="small">
                  <Descriptions.Item label="Ngày tạo">
                    {formatDateTime(transaction.createdAt)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày cập nhật">
                    {formatDateTime(transaction.updatedAt)}
                  </Descriptions.Item>
                </Descriptions>
              </Card>

              {/* Metadata */}
              {transaction.metadataJson && (
                <Card title="Dữ liệu bổ sung" size="small">
                  <pre
                    style={{
                      background: '#001529',
                      color: '#52c41a',
                      padding: '12px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      overflow: 'auto',
                      maxHeight: '300px',
                      margin: 0
                    }}
                  >
                    {JSON.stringify(JSON.parse(transaction.metadataJson), null, 2)}
                  </pre>
                </Card>
              )}
            </Space>
          </>
        )}
      </Card>
    );
  };

  return (
    <div style={{ padding: '0' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Filter Card */}
        <Card
          title={
            <Space>
              <FilterOutlined />
              <span>Bộ lọc giao dịch</span>
            </Space>
          }
          extra={
            <Space>
              <Button
                type="link"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
              </Button>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={loadTransactions}
                loading={isLoading}
              >
                Làm mới
              </Button>
            </Space>
          }
        >
          {showFilters && (
            <>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={6}>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    Loại giao dịch
                  </Text>
                  <Select
                    placeholder="Chọn loại giao dịch"
                    style={{ width: '100%' }}
                    allowClear
                    value={filters.type}
                    onChange={(value) => setFilters({ ...filters, type: value })}
                  >
                    <Option value="HOLD">Giữ tiền</Option>
                    <Option value="RELEASE">Giải phóng</Option>
                    <Option value="REFUND">Hoàn tiền</Option>
                    <Option value="TRANSFER">Chuyển khoản</Option>
                    <Option value="WITHDRAW">Rút tiền</Option>
                    <Option value="DEPOSIT">Nạp tiền</Option>
                    <Option value="INITIALIZE">Khởi tạo</Option>
                    <Option value="TOPUP">Nạp tiền</Option>
                    <Option value="DEBT_PAYMENT">Thanh toán nợ</Option>
                    <Option value="PAYOUT_STORE">Chi trả cửa hàng</Option>
                    <Option value="PLATFORM_FEE">Phí nền tảng</Option>
                    <Option value="SHIPPING_FEE_ADJUST">Điều chỉnh phí ship</Option>
                    <Option value="REFUND_CUSTOMER_RETURN">Hoàn trả khách</Option>
                  </Select>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    Trạng thái
                  </Text>
                  <Select
                    placeholder="Chọn trạng thái"
                    style={{ width: '100%' }}
                    allowClear
                    value={filters.status}
                    onChange={(value) => setFilters({ ...filters, status: value })}
                  >
                    <Option value="PENDING">Đang xử lý</Option>
                    <Option value="DONE">Hoàn thành</Option>
                    <Option value="SUCCESS">Thành công</Option>
                    <Option value="FAILED">Thất bại</Option>
                  </Select>
                </Col>
                <Col xs={24} sm={24} md={12}>
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>
                    Khoảng thời gian
                  </Text>
                  <RangePicker
                    style={{ width: '100%' }}
                    placeholder={['Từ ngày', 'Đến ngày']}
                    format="DD/MM/YYYY"
                    value={filters.dateRange}
                    onChange={(dates) => setFilters({ ...filters, dateRange: dates as [Dayjs, Dayjs] })}
                  />
                </Col>
              </Row>
              <Row gutter={16} style={{ marginTop: 16 }}>
                <Col>
                  <Button type="primary" icon={<FilterOutlined />} onClick={handleApplyFilters}>
                    Áp dụng
                  </Button>
                </Col>
                <Col>
                  <Button icon={<ClearOutlined />} onClick={handleClearFilters}>
                    Xóa bộ lọc
                  </Button>
                </Col>
              </Row>
            </>
          )}
        </Card>

        {/* Transaction List */}
        <Card
          title={
            <Space>
              <Title level={4} style={{ margin: 0 }}>
                Lịch sử giao dịch
              </Title>
              <Tag color="blue">{totalElements.toLocaleString('vi-VN')} giao dịch</Tag>
            </Space>
          }
        >
          <Spin spinning={isLoading}>
            {transactions.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Không có giao dịch nào"
                style={{ padding: '40px 0' }}
              />
            ) : (
              <>
                {transactions.map(renderTransactionItem)}

                {/* Pagination */}
                <div style={{ marginTop: 24, textAlign: 'center' }}>
                  <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={totalElements}
                    showSizeChanger
                    showTotal={(total) => `Tổng ${total} giao dịch`}
                    pageSizeOptions={['10', '20', '50', '100']}
                    onChange={(page, size) => {
                      setCurrentPage(page);
                      setPageSize(size);
                    }}
                  />
                </div>
              </>
            )}
          </Spin>
        </Card>
      </Space>
    </div>
  );
};

export default PlatformTransactionList;
