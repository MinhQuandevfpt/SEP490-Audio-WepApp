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
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  Wallet,
  Search,
  Filter,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
} from 'lucide-react';
import { useFinance } from '../../../hooks/useFinance';
import type { WalletTransaction, TransactionType } from '../../../types/seller';
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

  const columns: ColumnsType<WalletTransaction> = [
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
        const isPositive = ['DEPOSIT', 'RELEASE_PENDING', 'REFUND'].includes(record.type);
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
      title: 'Số dư sau',
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
          <Text code className="text-xs">
            {orderId.slice(0, 8).toUpperCase()}
          </Text>
        ) : (
          <Text type="secondary" className="text-xs">
            —
          </Text>
        ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (desc: string) => (
        <Text className="text-sm" title={desc}>
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

  const handleTableChange = (_pagination: any, _tableFilters: any, sorter: any) => {
    if (sorter.field) {
      const direction = sorter.order === 'ascend' ? 'asc' : 'desc';
      handleSortChange(`${sorter.field}:${direction}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Wallet className="w-8 h-8 text-orange-600" />
          <Title level={2} className="!mb-0">
            Tài chính
          </Title>
        </div>
        <Text type="secondary">Quản lý giao dịch và ví của cửa hàng</Text>
      </div>

      {/* Wallet Info Cards */}
      {walletError && (
        <div className="p-4 rounded-lg border border-red-200 bg-red-50">
          <Text type="danger">{walletError}</Text>
        </div>
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Số dư khả dụng"
              value={walletInfo?.availableBalance || 0}
              prefix={<DollarSign className="w-4 h-4" />}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: '#3f8600' }}
              loading={walletLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Số dư đang giữ"
              value={walletInfo?.pendingBalance || 0}
              prefix={<DollarSign className="w-4 h-4" />}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: '#fa8c16' }}
              loading={walletLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng đã nạp"
              value={walletInfo?.depositBalance || 0}
              prefix={<DollarSign className="w-4 h-4" />}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: '#1890ff' }}
              loading={walletLoading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tổng doanh thu"
              value={walletInfo?.totalRevenue || 0}
              prefix={<DollarSign className="w-4 h-4" />}
              formatter={(value) => formatCurrency(Number(value))}
              valueStyle={{ color: '#722ed1' }}
              loading={walletLoading}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card>
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <Text strong className="text-base">
              Bộ lọc
            </Text>
          </div>

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
                  <Select.Option value="PENDING_HOLD">Giữ tiền chờ</Select.Option>
                  <Select.Option value="RELEASE_PENDING">Giải phóng tiền chờ</Select.Option>
                  <Select.Option value="WITHDRAW">Rút tiền</Select.Option>
                  <Select.Option value="REFUND">Hoàn tiền</Select.Option>
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
        <div className="p-4 rounded-lg border border-red-200 bg-red-50">
          <Text type="danger">{error}</Text>
        </div>
      )}

      {/* Transactions Table */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <Text strong className="text-base">
              Lịch sử giao dịch
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
              columns={columns}
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

