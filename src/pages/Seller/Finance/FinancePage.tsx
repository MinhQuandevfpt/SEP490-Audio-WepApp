import React, { useState, useEffect } from 'react';
import {
  Table,
  Tag,
  Typography,
  Card,
  DatePicker,
  Select,
  Input,
  Button,
  Row,
  Col,
  Statistic,
  Empty,
  Spin,
  Pagination,
  Tabs,
  Tooltip,
  Alert,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  Wallet,
  Search,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  Info,
  TrendingUp,
  Clock,
  CheckCircle,
  Package,
} from 'lucide-react';
import { useFinance } from '../../../hooks/useFinance';
import type { WalletTransaction, TransactionType, PayoutItem } from '../../../types/seller';
import { formatCurrency } from '../../../utils/orderStatus';
import dayjs, { type Dayjs } from 'dayjs';

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

const FinancePage: React.FC = () => {
  const {
    transactions,
    isLoading,
    error,
    walletInfo,
    walletLoading,
    walletError,
    page,
    pageSize,
    totalElements,
    handlePageChange,
    handlePageSizeChange,
    filters,
    updateFilters,
    clearFilters,
    handleSortChange,
    refresh,
    payoutSummary,
    payoutSummaryLoading,
    payoutSummaryError,
    payoutItems,
    payoutItemsLoading,
    payoutItemsError,
    payoutBucket,
    handlePayoutBucketChange,
    payoutItemsPage,
    payoutItemsPageSize,
    payoutItemsTotal,
    handlePayoutItemsPageChange,
    handlePayoutItemsPageSizeChange,
  } = useFinance();

  const [transactionIdSearch, setTransactionIdSearch] = useState<string>('');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);

  // Sync dateRange with filters when filters change externally
  useEffect(() => {
    if (filters.from && filters.to) {
      const fromDate = dayjs(filters.from);
      const toDate = dayjs(filters.to);
      if (fromDate.isValid() && toDate.isValid()) {
        setDateRange([fromDate, toDate]);
      }
    } else if (!filters.from && !filters.to) {
      setDateRange(null);
    }
  }, [filters.from, filters.to]);

  const getTransactionTypeColor = (type: TransactionType): string => {
    const colorMap: Record<TransactionType, string> = {
      DEPOSIT: 'green',
      PENDING_HOLD: 'orange',
      RELEASE_PENDING: 'blue',
      WITHDRAW: 'red',
      REFUND: 'cyan',
      ADJUSTMENT: 'purple',
      REFUND_RETURN: 'cyan',
      REFUND_FORCE: 'cyan',
    };
    return colorMap[type] || 'default';
  };

  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setDateRange(dates);
    if (dates && dates[0] && dates[1]) {
      updateFilters({
        from: dates[0].toISOString(),
        to: dates[1].toISOString(),
      });
    } else {
      updateFilters({
        from: undefined,
        to: undefined,
      });
    }
  };

  const handleTypeChange = (value: TransactionType | undefined) => {
    updateFilters({ type: value });
  };

  const handleTransactionIdSearch = () => {
    updateFilters({ transactionId: transactionIdSearch || undefined });
  };

  const handleClearFilters = () => {
    setTransactionIdSearch('');
    setDateRange(null);
    clearFilters();
  };

  // Transaction columns
  const transactionColumns: ColumnsType<WalletTransaction> = [
    {
      title: 'Mã giao dịch',
      dataIndex: 'transactionId',
      key: 'transactionId',
      width: 200,
      render: (id: string) => (
        <Text code className="text-xs">
          {id.slice(0, 8).toUpperCase()}
        </Text>
      ),
    },
    {
      title: 'Loại giao dịch',
      dataIndex: 'type',
      key: 'type',
      width: 180,
      render: (type: TransactionType, record) => (
        <Tag color={getTransactionTypeColor(type)}>
          {record.displayType || type}
        </Tag>
      ),
      sorter: true,
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      align: 'right',
      render: (amount: number, record) => {
        const isPositive = ['DEPOSIT', 'RELEASE_PENDING', 'REFUND', 'REFUND_RETURN', 'REFUND_FORCE'].includes(record.type);
        return (
          <div className="flex items-center justify-end gap-1">
            {isPositive ? (
              <ArrowUpRight className="w-4 h-4 text-green-600" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-red-600" />
            )}
            <Text strong className={isPositive ? 'text-green-600' : 'text-red-600'}>
              {isPositive ? '+' : '-'}
              {formatCurrency(Math.abs(amount))}
            </Text>
          </div>
        );
      },
      sorter: true,
    },
    {
      title: 'Số dư sau giao dịch',
      dataIndex: 'balanceAfter',
      key: 'balanceAfter',
      width: 150,
      align: 'right',
      render: (balance: number) => (
        <Text strong className="text-gray-800">
          {formatCurrency(balance)}
        </Text>
      ),
      sorter: true,
    },
    {
      title: 'Mã đơn hàng',
      dataIndex: 'orderId',
      key: 'orderId',
      width: 150,
      render: (orderId: string | null) =>
        orderId ? (
          <Text code className="text-xs whitespace-nowrap">
            {orderId.slice(0, 8).toUpperCase()}
          </Text>
        ) : (
          <Text type="secondary" className="text-xs whitespace-nowrap">
            —
          </Text>
        ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      render: (desc: string) => (
        <Text className="text-sm whitespace-normal">
          {desc}
        </Text>
      ),
    },
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => (
        <div>
          <div className="text-sm text-gray-800">
            {dayjs(date).format('DD/MM/YYYY')}
          </div>
          <div className="text-xs text-gray-500">
            {dayjs(date).format('HH:mm:ss')}
          </div>
        </div>
      ),
      sorter: true,
      defaultSortOrder: 'descend',
    },
  ];

  // Payout item columns
  const payoutItemColumns: ColumnsType<PayoutItem> = [
    {
      title: 'Mã đơn hàng',
      dataIndex: 'orderCode',
      key: 'orderCode',
      width: 150,
      render: (code: string) => (
        <Text code className="text-xs whitespace-nowrap">
          {code}
        </Text>
      ),
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'productName',
      key: 'productName',
      render: (name: string) => (
        <Text className="text-sm whitespace-normal">
          {name}
        </Text>
      ),
    },
    {
      title: 'Biến thể',
      key: 'variant',
      width: 150,
      render: (_, record) => (
        <div>
          <Text className="text-xs text-gray-600">{record.variantOptionName}:</Text>
          <br />
          <Text className="text-xs">{record.variantOptionValue}</Text>
        </div>
      ),
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      align: 'center',
      render: (qty: number) => <Text>{qty}</Text>,
    },
    {
      title: 'Tổng doanh thu',
      dataIndex: 'grossAmount',
      key: 'grossAmount',
      width: 130,
      align: 'right',
      render: (amount: number) => (
        <Text strong className="text-orange-600">
          {formatCurrency(amount)}
        </Text>
      ),
    },
    {
      title: 'Phí nền tảng',
      dataIndex: 'platformFee',
      key: 'platformFee',
      width: 130,
      align: 'right',
      render: (fee: number) => (
        <Text className="text-red-600">-{formatCurrency(fee)}</Text>
      ),
    },
    {
      title: 'Phí ship chênh lệch',
      dataIndex: 'shippingExtra',
      key: 'shippingExtra',
      width: 140,
      align: 'right',
      render: (extra: number) => (
        <Text className="text-red-600">-{formatCurrency(extra)}</Text>
      ),
    },
    {
      title: 'Giá vốn',
      dataIndex: 'costOfGoods',
      key: 'costOfGoods',
      width: 130,
      align: 'right',
      render: (cost: number) => (
        <Text className="text-red-600">-{formatCurrency(cost)}</Text>
      ),
    },
    {
      title: 'Lãi ròng',
      dataIndex: 'netProfit',
      key: 'netProfit',
      width: 130,
      align: 'right',
      render: (profit: number) => (
        <Text strong className={profit >= 0 ? 'text-green-600' : 'text-red-600'}>
          {formatCurrency(profit)}
        </Text>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 120,
      render: (_, record) => (
        <div className="space-y-1">
          <Tag color={record.eligibleForPayout ? 'green' : 'orange'}>
            {record.eligibleForPayout ? 'Đủ điều kiện' : 'Chưa đủ điều kiện'}
          </Tag>
          {record.isPayout && (
            <Tag color="orange" className="mt-1">
              Đã thanh toán
            </Tag>
          )}
          {record.isReturned && (
            <Tag color="red" className="mt-1">
              Đã trả hàng
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Ngày tạo đơn',
      dataIndex: 'orderCreatedAt',
      key: 'orderCreatedAt',
      width: 150,
      render: (date: string) => (
        <div>
          <div className="text-sm text-gray-800">
            {dayjs(date).format('DD/MM/YYYY')}
          </div>
          <div className="text-xs text-gray-500">
            {dayjs(date).format('HH:mm:ss')}
          </div>
        </div>
      ),
    },
  ];

  const handleTableChange = (_pagination: any, _tableFilters: any, sorter: any) => {
    if (sorter.field) {
      const direction = sorter.order === 'ascend' ? 'asc' : 'desc';
      handleSortChange(`${sorter.field}:${direction}`);
    }
  };

  // Tooltip content for statistic cards
  const statisticTooltips = {
    availableBalance: 'Số tiền có thể sử dụng ngay, đã được giải phóng và có thể rút hoặc sử dụng cho các giao dịch.',
    pendingBalance: 'Số tiền đang bị giữ lại chờ xác nhận đơn hàng hoặc đang trong thời gian chờ giải phóng.',
    depositBalance: 'Tổng số tiền đã nạp vào ví từ các nguồn như nạp tiền thủ công hoặc các khoản hoàn tiền.',
    totalRevenue: 'Tổng doanh thu từ tất cả các đơn hàng đã được xử lý, bao gồm cả các đơn hàng đã và chưa thanh toán.',
    estimatedGross: 'Tổng doanh thu ước tính từ tất cả các sản phẩm chưa được thanh toán, bao gồm cả các đơn hàng đang chờ xử lý.',
    pendingGross: 'Tổng doanh thu đang bị giữ lại do chưa đủ điều kiện để thanh toán (ví dụ: đơn hàng chưa hoàn thành, đang trong thời gian chờ).',
    doneGross: 'Tổng doanh thu đã được thanh toán thành công, đây là số tiền thực tế đã chuyển vào ví sau khi trừ phí nền tảng và phí ship chênh lệch.',
    netProfit: 'Lãi ròng thực tế sau khi trừ tất cả các chi phí: phí nền tảng, phí ship chênh lệch, và giá vốn hàng hóa.',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Wallet className="w-8 h-8 text-orange-600" />
          <Title level={2} className="!mb-0">
            Ví cửa hàng
          </Title>
        </div>
        <Text type="secondary">Quản lý tài chính, giao dịch và doanh thu của cửa hàng</Text>
      </div>

      {/* Error Messages */}
      {walletError && (
        <Alert
          type="error"
          message="Lỗi tải thông tin ví"
          description={walletError}
          showIcon
          closable
        />
      )}
      {payoutSummaryError && (
        <Alert
          type="error"
          message="Lỗi tải tổng quan thanh toán"
          description={payoutSummaryError}
          showIcon
          closable
        />
      )}

      {/* Wallet Overview Cards */}
      <Card title="Tổng quan số dư ví" className="shadow-sm">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Card className="h-full">
              <div className="flex items-center justify-between mb-2">
                <Statistic
                  title={
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <span>Số dư khả dụng</span>
                      <Tooltip title={statisticTooltips.availableBalance}>
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      </Tooltip>
                    </div>
                  }
                  value={walletInfo?.availableBalance || 0}
                  prefix={<DollarSign className="w-4 h-4" />}
                  formatter={(value) => formatCurrency(Number(value))}
                  valueStyle={{ color: '#3f8600', fontSize: '20px', fontWeight: 'bold' }}
                  loading={walletLoading}
                />
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="h-full">
              <Statistic
                title={
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span>Số dư đang giữ</span>
                    <Tooltip title={statisticTooltips.pendingBalance}>
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    </Tooltip>
                  </div>
                }
                value={walletInfo?.pendingBalance || 0}
                prefix={<DollarSign className="w-4 h-4" />}
                formatter={(value) => formatCurrency(Number(value))}
                valueStyle={{ color: '#fa8c16', fontSize: '20px', fontWeight: 'bold' }}
                loading={walletLoading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="h-full">
              <Statistic
                title={
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span>Tổng đã nạp</span>
                    <Tooltip title={statisticTooltips.depositBalance}>
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    </Tooltip>
                  </div>
                }
                value={walletInfo?.depositBalance || 0}
                prefix={<DollarSign className="w-4 h-4" />}
                formatter={(value) => formatCurrency(Number(value))}
                valueStyle={{ color: '#1890ff', fontSize: '20px', fontWeight: 'bold' }}
                loading={walletLoading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card className="h-full">
              <Statistic
                title={
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span>Tổng doanh thu</span>
                    <Tooltip title={statisticTooltips.totalRevenue}>
                      <Info className="w-4 h-4 text-gray-400 cursor-help" />
                    </Tooltip>
                  </div>
                }
                value={walletInfo?.totalRevenue || 0}
                prefix={<DollarSign className="w-4 h-4" />}
                formatter={(value) => formatCurrency(Number(value))}
                valueStyle={{ color: '#722ed1', fontSize: '20px', fontWeight: 'bold' }}
                loading={walletLoading}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Payout Summary */}
      <Card title="Tổng quan doanh thu thanh toán" className="shadow-sm">
        {payoutSummaryError ? (
          <Alert
            type="error"
            message="Không thể tải tổng quan thanh toán"
            description={payoutSummaryError}
            showIcon
          />
        ) : (
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Card className="h-full">
                <Statistic
                  title={
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <span>Doanh thu ước tính</span>
                      <Tooltip title={statisticTooltips.estimatedGross}>
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      </Tooltip>
                    </div>
                  }
                  value={payoutSummary?.estimatedGross || 0}
                  prefix={<TrendingUp className="w-4 h-4" />}
                  formatter={(value) => formatCurrency(Number(value))}
                  valueStyle={{ color: '#1890ff', fontSize: '18px', fontWeight: 'bold' }}
                  loading={payoutSummaryLoading}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="h-full">
                <Statistic
                  title={
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <span>Doanh thu đang giữ</span>
                      <Tooltip title={statisticTooltips.pendingGross}>
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      </Tooltip>
                    </div>
                  }
                  value={payoutSummary?.pendingGross || 0}
                  prefix={<Clock className="w-4 h-4" />}
                  formatter={(value) => formatCurrency(Number(value))}
                  valueStyle={{ color: '#fa8c16', fontSize: '18px', fontWeight: 'bold' }}
                  loading={payoutSummaryLoading}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="h-full">
                <Statistic
                  title={
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <span>Doanh thu đã thanh toán</span>
                      <Tooltip title={statisticTooltips.doneGross}>
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      </Tooltip>
                    </div>
                  }
                  value={payoutSummary?.doneGross || 0}
                  prefix={<CheckCircle className="w-4 h-4" />}
                  formatter={(value) => formatCurrency(Number(value))}
                  valueStyle={{ color: '#3f8600', fontSize: '18px', fontWeight: 'bold' }}
                  loading={payoutSummaryLoading}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card className="h-full">
                <Statistic
                  title={
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <span>Lãi ròng</span>
                      <Tooltip title={statisticTooltips.netProfit}>
                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                      </Tooltip>
                    </div>
                  }
                  value={payoutSummary?.netProfit || 0}
                  prefix={<DollarSign className="w-4 h-4" />}
                  formatter={(value) => formatCurrency(Number(value))}
                  valueStyle={{ 
                    color: (payoutSummary?.netProfit || 0) >= 0 ? '#3f8600' : '#cf1322', 
                    fontSize: '18px', 
                    fontWeight: 'bold' 
                  }}
                  loading={payoutSummaryLoading}
                />
              </Card>
            </Col>
          </Row>
        )}
      </Card>

      {/* Payout Items */}
      <Card title="Chi tiết doanh thu theo sản phẩm" className="shadow-sm">
        <Tabs
          activeKey={payoutBucket}
          onChange={(key) => handlePayoutBucketChange(key as typeof payoutBucket)}
          type="card"
          style={{
            '--ant-primary-color': '#f97316',
          } as React.CSSProperties}
          className="payout-tabs"
          items={[
            {
              key: 'ESTIMATED',
              label: (
                <span className="whitespace-nowrap">
                  <Package className="w-4 h-4 inline mr-2" />
                  Doanh thu ước tính ({payoutBucket === 'ESTIMATED' ? payoutItemsTotal : '...'})
                </span>
              ),
              children: (
                <>
                  {payoutItemsError ? (
                    <Alert
                      type="error"
                      message="Không thể tải danh sách sản phẩm"
                      description={payoutItemsError}
                      showIcon
                    />
                  ) : payoutItemsLoading && payoutItems.length === 0 ? (
                    <div className="py-12 text-center">
                      <Spin size="large" />
                      <div className="mt-4 text-gray-500">Đang tải dữ liệu...</div>
                    </div>
                  ) : payoutItems.length === 0 ? (
                    <Empty
                      description="Không có sản phẩm nào trong nhóm này"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  ) : (
                    <>
                      <Table
                        rowKey="storeOrderItemId"
                        columns={payoutItemColumns}
                        dataSource={payoutItems}
                        pagination={false}
                        scroll={{ x: 1400 }}
                      />
                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Hiển thị {payoutItemsPage * payoutItemsPageSize + 1} - {Math.min((payoutItemsPage + 1) * payoutItemsPageSize, payoutItemsTotal)} của {payoutItemsTotal} sản phẩm
                        </div>
                        <Pagination
                          current={payoutItemsPage + 1}
                          pageSize={payoutItemsPageSize}
                          total={payoutItemsTotal}
                          showSizeChanger
                          showQuickJumper
                          showTotal={(total, range) =>
                            `${range[0]}-${range[1]} của ${total} sản phẩm`
                          }
                          pageSizeOptions={['10', '20', '50', '100']}
                          onChange={(newPage, newSize) => {
                            handlePayoutItemsPageChange(newPage - 1);
                            if (newSize !== payoutItemsPageSize) {
                              handlePayoutItemsPageSizeChange(newSize);
                            }
                          }}
                        />
                      </div>
                    </>
                  )}
                </>
              ),
            },
            {
              key: 'PENDING',
              label: (
                <span className="whitespace-nowrap">
                  <Clock className="w-4 h-4 inline mr-2" />
                  Đang giữ ({payoutBucket === 'PENDING' ? payoutItemsTotal : '...'})
                </span>
              ),
              children: (
                <>
                  {payoutItemsError ? (
                    <Alert
                      type="error"
                      message="Không thể tải danh sách sản phẩm"
                      description={payoutItemsError}
                      showIcon
                    />
                  ) : payoutItemsLoading && payoutItems.length === 0 ? (
                    <div className="py-12 text-center">
                      <Spin size="large" />
                      <div className="mt-4 text-gray-500">Đang tải dữ liệu...</div>
                    </div>
                  ) : payoutItems.length === 0 ? (
                    <Empty
                      description="Không có sản phẩm nào trong nhóm này"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  ) : (
                    <>
                      <Table
                        rowKey="storeOrderItemId"
                        columns={payoutItemColumns}
                        dataSource={payoutItems}
                        pagination={false}
                        scroll={{ x: 1400 }}
                      />
                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Hiển thị {payoutItemsPage * payoutItemsPageSize + 1} - {Math.min((payoutItemsPage + 1) * payoutItemsPageSize, payoutItemsTotal)} của {payoutItemsTotal} sản phẩm
                        </div>
                        <Pagination
                          current={payoutItemsPage + 1}
                          pageSize={payoutItemsPageSize}
                          total={payoutItemsTotal}
                          showSizeChanger
                          showQuickJumper
                          showTotal={(total, range) =>
                            `${range[0]}-${range[1]} của ${total} sản phẩm`
                          }
                          pageSizeOptions={['10', '20', '50', '100']}
                          onChange={(newPage, newSize) => {
                            handlePayoutItemsPageChange(newPage - 1);
                            if (newSize !== payoutItemsPageSize) {
                              handlePayoutItemsPageSizeChange(newSize);
                            }
                          }}
                        />
                      </div>
                    </>
                  )}
                </>
              ),
            },
            {
              key: 'DONE',
              label: (
                <span className="whitespace-nowrap">
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                  Đã thanh toán ({payoutBucket === 'DONE' ? payoutItemsTotal : '...'})
                </span>
              ),
              children: (
                <>
                  {payoutItemsError ? (
                    <Alert
                      type="error"
                      message="Không thể tải danh sách sản phẩm"
                      description={payoutItemsError}
                      showIcon
                    />
                  ) : payoutItemsLoading && payoutItems.length === 0 ? (
                    <div className="py-12 text-center">
                      <Spin size="large" />
                      <div className="mt-4 text-gray-500">Đang tải dữ liệu...</div>
                    </div>
                  ) : payoutItems.length === 0 ? (
                    <Empty
                      description="Không có sản phẩm nào trong nhóm này"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  ) : (
                    <>
                      <Table
                        rowKey="storeOrderItemId"
                        columns={payoutItemColumns}
                        dataSource={payoutItems}
                        pagination={false}
                        scroll={{ x: 1400 }}
                      />
                      <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Hiển thị {payoutItemsPage * payoutItemsPageSize + 1} - {Math.min((payoutItemsPage + 1) * payoutItemsPageSize, payoutItemsTotal)} của {payoutItemsTotal} sản phẩm
                        </div>
                        <Pagination
                          current={payoutItemsPage + 1}
                          pageSize={payoutItemsPageSize}
                          total={payoutItemsTotal}
                          showSizeChanger
                          showQuickJumper
                          showTotal={(total, range) =>
                            `${range[0]}-${range[1]} của ${total} sản phẩm`
                          }
                          pageSizeOptions={['10', '20', '50', '100']}
                          onChange={(newPage, newSize) => {
                            handlePayoutItemsPageChange(newPage - 1);
                            if (newSize !== payoutItemsPageSize) {
                              handlePayoutItemsPageSizeChange(newSize);
                            }
                          }}
                        />
                      </div>
                    </>
                  )}
                </>
              ),
            },
          ]}
        />
        <style>{`
          .payout-tabs .ant-tabs-tab {
            color: #1f2937 !important;
          }
          .payout-tabs .ant-tabs-tab:hover {
            color: #f97316 !important;
          }
          .payout-tabs .ant-tabs-tab.ant-tabs-tab-active {
            color: #f97316 !important;
          }
          .payout-tabs .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn {
            color: #f97316 !important;
          }
          .payout-tabs .ant-tabs-ink-bar {
            background: #f97316 !important;
          }
          .payout-tabs .ant-tabs-card > .ant-tabs-nav .ant-tabs-tab {
            border-color: #f97316 !important;
          }
          .payout-tabs .ant-tabs-card > .ant-tabs-nav .ant-tabs-tab-active {
            border-color: #f97316 !important;
            background: #fff7ed !important;
          }
        `}</style>
      </Card>

      {/* Global styles for table headers */}
      <style>{`
        .ant-table-thead > tr > th {
          white-space: nowrap !important;
        }
        .ant-statistic-title {
          white-space: nowrap !important;
        }
      `}</style>

      {/* Filters */}
      <Card title="Bộ lọc giao dịch" className="shadow-sm">
        <div className="space-y-4">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <div>
                <Text className="text-sm mb-1 block">Khoảng thời gian</Text>
                <RangePicker
                  style={{ width: '100%' }}
                  value={dateRange}
                  onChange={handleDateRangeChange}
                  format="DD/MM/YYYY"
                  placeholder={['Từ ngày', 'Đến ngày']}
                />
              </div>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <div>
                <Text className="text-sm mb-1 block">Loại giao dịch</Text>
                <Select
                  style={{ width: '100%' }}
                  placeholder="Chọn loại giao dịch"
                  allowClear
                  value={filters.type}
                  onChange={handleTypeChange}
                >
                  <Select.Option value="DEPOSIT">Nạp tiền</Select.Option>
                  <Select.Option value="PENDING_HOLD">Giữ tiền chờ xác nhận</Select.Option>
                  <Select.Option value="RELEASE_PENDING">Giải phóng tiền chờ</Select.Option>
                  <Select.Option value="WITHDRAW">Rút tiền</Select.Option>
                  <Select.Option value="REFUND">Hoàn tiền</Select.Option>
                  <Select.Option value="REFUND_RETURN">Hoàn tiền trả hàng</Select.Option>
                  <Select.Option value="REFUND_FORCE">Hoàn tiền bắt buộc</Select.Option>
                  <Select.Option value="ADJUSTMENT">Điều chỉnh thủ công</Select.Option>
                </Select>
              </div>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <div>
                <Text className="text-sm mb-1 block">Mã giao dịch</Text>
                <Input.Search
                  placeholder="Nhập mã giao dịch"
                  value={transactionIdSearch}
                  onChange={(e) => setTransactionIdSearch(e.target.value)}
                  onSearch={handleTransactionIdSearch}
                  enterButton={<Search className="w-4 h-4" />}
                />
              </div>
            </Col>
          </Row>

          <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
            <Button
              icon={<RefreshCw className="w-4 h-4" />}
              onClick={refresh}
              loading={isLoading}
            >
              Làm mới
            </Button>
            <Button onClick={handleClearFilters} disabled={!filters.type && !filters.from && !filters.transactionId}>
              Xóa bộ lọc
            </Button>
          </div>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <Alert
          type="error"
          message="Lỗi tải giao dịch"
          description={error}
          showIcon
          closable
        />
      )}

      {/* Transactions Table */}
      <Card title="Lịch sử giao dịch" className="shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <Text strong className="text-base">
              Danh sách giao dịch
            </Text>
            <Text type="secondary" className="ml-2 text-sm">
              ({totalElements} giao dịch)
            </Text>
          </div>
        </div>

        {isLoading && transactions.length === 0 ? (
          <div className="py-12 text-center">
            <Spin size="large" />
            <div className="mt-4 text-gray-500">Đang tải dữ liệu...</div>
          </div>
        ) : transactions.length === 0 ? (
          <Empty
            description="Không có giao dịch nào"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <>
            <Table
              rowKey="transactionId"
              columns={transactionColumns}
              dataSource={transactions}
              pagination={false}
              onChange={handleTableChange}
              scroll={{ x: 1200 }}
            />

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Hiển thị {page * pageSize + 1} - {Math.min((page + 1) * pageSize, totalElements)} của {totalElements} giao dịch
              </div>
              <Pagination
                current={page + 1}
                pageSize={pageSize}
                total={totalElements}
                showSizeChanger
                showQuickJumper
                showTotal={(total, range) =>
                  `${range[0]}-${range[1]} của ${total} giao dịch`
                }
                pageSizeOptions={['10', '20', '50', '100']}
                onChange={(newPage, newSize) => {
                  handlePageChange(newPage - 1);
                  if (newSize !== pageSize) {
                    handlePageSizeChange(newSize);
                  }
                }}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
};

export default FinancePage;
