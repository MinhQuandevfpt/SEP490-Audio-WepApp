import React from 'react';
import { Card, Table, Tag, Typography, Pagination, Empty, Spin } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ReturnRequestResponse } from '../../../types/api';
import { formatCurrency, formatDate } from '../../../utils/orderStatus';

const { Text } = Typography;

export interface ReturnHistoryProps {
  data: ReturnRequestResponse[];
  page: number;
  pageSize: number;
  total: number;
  isLoading: boolean;
  error?: string | null;
  onPageChange: (page: number, pageSize?: number) => void;
}

const statusColorMap: Record<string, string> = {
  PENDING: 'gold',
  APPROVED: 'green',
  REJECTED: 'red',
  SHIPPING: 'blue',
  REFUNDED: 'green',
};

const reasonTypeLabel: Record<string, string> = {
  CUSTOMER_FAULT: 'Khách hàng yêu cầu',
  SHOP_FAULT: 'Lỗi từ cửa hàng',
};

const statusLabelMap: Record<string, string> = {
  PENDING: 'Đang chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  SHIPPING: 'Đang hoàn trả',
  REFUNDED: 'Đã hoàn tiền',
};

const ReturnHistory: React.FC<ReturnHistoryProps> = ({
  data,
  page,
  pageSize,
  total,
  isLoading,
  error,
  onPageChange,
}) => {
  const columns: ColumnsType<ReturnRequestResponse> = [
    {
      title: 'Sản phẩm',
      dataIndex: 'productName',
      key: 'productName',
      render: (value: string) => <Text strong>{value}</Text>,
    },
    {
      title: 'Giá hoàn trả',
      dataIndex: 'itemPrice',
      key: 'itemPrice',
      width: 140,
      align: 'right',
      render: (value: number) => <Text>{formatCurrency(value)}</Text>,
    },
    {
      title: 'Loại lý do',
      dataIndex: 'reasonType',
      key: 'reasonType',
      width: 160,
      render: (value: string) => (
        <Tag color={value === 'SHOP_FAULT' ? 'red' : 'default'}>
          {reasonTypeLabel[value] || value}
        </Tag>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (value: string) => (
        <Tag color={statusColorMap[value] || 'default'}>
          {statusLabelMap[value] || value}
        </Tag>
      ),
    },
    {
      title: 'Hình ảnh / Video',
      key: 'media',
      width: 220,
      render: (_: any, record: ReturnRequestResponse) => {
        const rawImages = Array.isArray(record.customerImageUrls)
          ? record.customerImageUrls.filter(Boolean)
          : [];
        const filteredImages = rawImages.filter((url) => url !== 'string');
        const rawVideo = record.customerVideoUrl || '';
        const hasRealImages = filteredImages.length > 0;
        const hasRealVideo = rawVideo && rawVideo !== 'string';

        if (!hasRealImages && !hasRealVideo) {
          return <Text type="secondary">Không cung cấp</Text>;
        }

        return (
          <div className="space-y-1 text-xs">
            {hasRealImages && (
              <div>Ảnh: {filteredImages.join(', ')}</div>
            )}
            {hasRealVideo && (
              <div>Video: {rawVideo}</div>
            )}
          </div>
        );
      },
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (value: string) => <Text>{formatDate(value)}</Text>,
    },
  ];

  return (
    <Card
      title="Lịch sử hoàn trả"
      className="border-gray-200 shadow-sm"
      style={{ borderRadius: 12 }}
      bodyStyle={{ padding: 0 }}
    >
      {isLoading ? (
        <div className="py-12 text-center">
          <Spin size="large" />
          <p className="mt-4 text-gray-500">Đang tải lịch sử hoàn trả...</p>
        </div>
      ) : error ? (
        <div className="py-12 text-center">
          <Text type="danger">{error}</Text>
        </div>
      ) : data.length === 0 ? (
        <div className="py-12 text-center">
          <Empty description="Bạn chưa có yêu cầu hoàn trả nào" />
        </div>
      ) : (
        <>
          <Table<ReturnRequestResponse>
            rowKey="id"
            columns={columns}
            dataSource={data}
            pagination={false}
          />
          <div className="px-4 py-3 flex justify-end">
            <Pagination
              current={page}
              pageSize={pageSize}
              total={total}
              showSizeChanger
              pageSizeOptions={['5', '10', '20', '50']}
              onChange={onPageChange}
              showTotal={(t) => `Tổng ${t} yêu cầu`}
            />
          </div>
        </>
      )}
    </Card>
  );
};

export default ReturnHistory;


