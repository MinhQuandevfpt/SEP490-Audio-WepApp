import React from 'react';
import { Card, Table, Tag, Empty, Spin, Alert, Row, Col, Statistic } from 'antd';
import { WalletOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { WalletTransaction } from '../../types/api';
import { useWalletTransactions } from '../../hooks/useWalletTransactions';
import { useWalletInfo } from '../../hooks/useWalletInfo';
import { formatCurrency } from '../../utils/orderStatus';

interface WalletPageProps {
  customerId: string | null;
}

// Mapping transaction types to Vietnamese
const getTransactionTypeLabel = (type: string): string => {
  const typeMap: Record<string, string> = {
    'REFUND': 'Hoàn tiền',
    'QR': 'Thanh toán QR',
    'DEPOSIT': 'Nạp tiền',
    'WITHDRAW': 'Rút tiền',
    'PENDING_HOLD': 'Giữ tiền chờ',
    'RELEASE_PENDING': 'Giải phóng tiền chờ',
    'ADJUSTMENT': 'Điều chỉnh',
    'PAYMENT': 'Thanh toán',
    'TRANSFER': 'Chuyển khoản',
  };
  return typeMap[type] || type;
};

// Mapping transaction status to Vietnamese
const getTransactionStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    'SUCCESS': 'Thành công',
    'COMPLETED': 'Hoàn thành',
    'PENDING': 'Đang xử lý',
    'FAILED': 'Thất bại',
    'CANCELLED': 'Đã hủy',
    'PROCESSING': 'Đang xử lý',
  };
  return statusMap[status] || status;
};

// Get status color
const getStatusColor = (status: string): string => {
  if (status === 'SUCCESS' || status === 'COMPLETED') return 'green';
  if (status === 'PENDING' || status === 'PROCESSING') return 'orange';
  if (status === 'FAILED' || status === 'CANCELLED') return 'red';
  return 'default';
};

// Mapping wallet status to Vietnamese
const getWalletStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    'ACTIVE': 'Đang hoạt động',
    'INACTIVE': 'Không hoạt động',
    'SUSPENDED': 'Đã tạm khóa',
  };
  return statusMap[status] || status;
};

// Get wallet status color
const getWalletStatusColor = (status: string): string => {
  if (status === 'ACTIVE') return 'green';
  if (status === 'INACTIVE') return 'default';
  if (status === 'SUSPENDED') return 'red';
  return 'default';
};

const WalletPage: React.FC<WalletPageProps> = ({ customerId }) => {
  const { walletInfo, loading: walletLoading, error: walletError } = useWalletInfo(customerId);
  const { transactions, loading: transactionsLoading, error: transactionsError, page, pageSize, total, setPage, setPageSize } =
    useWalletTransactions(customerId);

  const columns: ColumnsType<WalletTransaction> = [
    {
      title: 'Thời gian',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (value) => new Date(value).toLocaleString('vi-VN'),
    },
    {
      title: 'Loại giao dịch',
      dataIndex: 'type',
      key: 'type',
      render: (value) => (
        <Tag color="blue">
          {getTransactionTypeLabel(value)}
        </Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (value) => (
        <Tag color={getStatusColor(value)}>
          {getTransactionStatusLabel(value)}
        </Tag>
      ),
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: (value: number) => (
        <span className={value >= 0 ? 'text-green-600' : 'text-red-500'}>{formatCurrency(value)}</span>
      ),
    },
    {
      title: 'Số dư sau GD',
      dataIndex: 'balanceAfter',
      key: 'balanceAfter',
      render: (value: number) => <span>{formatCurrency(value)}</span>,
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      render: (value) => value || '—',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Wallet Overview Card */}
      <Card title="Tổng quan ví" className="shadow-sm border border-gray-200">
        {!customerId ? (
          <Empty description="Không tìm thấy thông tin khách hàng" />
        ) : walletError ? (
          <Alert type="error" message={walletError} showIcon />
        ) : walletLoading ? (
          <div className="py-8 text-center">
            <Spin size="large" />
          </div>
        ) : walletInfo ? (
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={8}>
              <Statistic
                title="Số dư hiện tại"
                value={walletInfo.balance}
                prefix={<WalletOutlined className="text-blue-500" />}
                suffix={walletInfo.currency}
                valueStyle={{ color: '#1890ff', fontSize: '24px', fontWeight: 'bold' }}
                formatter={(value) => formatCurrency(Number(value))}
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Statistic
                title="Trạng thái ví"
                value={getWalletStatusLabel(walletInfo.status)}
                prefix={
                  walletInfo.status === 'ACTIVE' ? (
                    <CheckCircleOutlined className="text-green-500" />
                  ) : (
                    <ClockCircleOutlined className="text-orange-500" />
                  )
                }
                valueStyle={{ fontSize: '18px' }}
              />
              <Tag color={getWalletStatusColor(walletInfo.status)} className="mt-2">
                {getWalletStatusLabel(walletInfo.status)}
              </Tag>
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Statistic
                title="Giao dịch cuối"
                value={walletInfo.lastTransactionAt ? new Date(walletInfo.lastTransactionAt).toLocaleString('vi-VN') : 'Chưa có'}
                valueStyle={{ fontSize: '14px', color: '#666' }}
              />
            </Col>
          </Row>
        ) : (
          <Empty description="Không có thông tin ví" />
        )}
      </Card>

      {/* Transaction History Card */}
      <Card title="Lịch sử giao dịch" className="shadow-sm border border-gray-200">
        {!customerId ? (
          <Empty description="Không tìm thấy thông tin khách hàng" />
        ) : transactionsError ? (
          <Alert type="error" message={transactionsError} showIcon />
        ) : (
          <>
            {transactionsLoading ? (
              <div className="py-8 text-center">
                <Spin size="large" />
              </div>
            ) : transactions.length === 0 ? (
              <Empty description="Chưa có giao dịch" />
            ) : (
              <Table
                rowKey="id"
                columns={columns}
                dataSource={transactions}
                pagination={{
                  current: page,
                  pageSize,
                  total,
                  onChange: (p, ps) => {
                    setPage(p);
                    setPageSize(ps || pageSize);
                  },
                  showSizeChanger: true,
                }}
              />
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default WalletPage;

