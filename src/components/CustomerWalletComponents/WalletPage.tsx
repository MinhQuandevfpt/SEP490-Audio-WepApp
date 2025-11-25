import React from 'react';
import { Card, Table, Tag, Empty, Spin, Alert } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { WalletTransaction } from '../../types/api';
import { useWalletTransactions } from '../../hooks/useWalletTransactions';
import { formatCurrency } from '../../utils/orderStatus';

interface WalletPageProps {
  customerId: string | null;
}

const WalletPage: React.FC<WalletPageProps> = ({ customerId }) => {
  const { transactions, loading, error, page, pageSize, total, setPage, setPageSize } =
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
        <Tag color="blue" className="uppercase">
          {value}
        </Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (value) => (
        <Tag color={value === 'COMPLETED' ? 'green' : 'default'} className="uppercase">
          {value}
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
    <Card title="Ví nền tảng" className="shadow-sm border border-gray-200">
      {!customerId ? (
        <Empty description="Không tìm thấy thông tin khách hàng" />
      ) : error ? (
        <Alert type="error" message={error} showIcon />
      ) : (
        <>
          {loading ? (
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
  );
};

export default WalletPage;

