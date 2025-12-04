import React, { useState } from 'react';
import { Card, Table, Tag, Typography, Space, Pagination, Empty, Spin, Button, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ReturnRequestResponse } from '../../types/api';
import { formatDate, formatCurrency } from '../../utils/orderStatus';
import { StoreReturnService } from '../../services/seller/StoreReturnService';

const { Text, Title } = Typography;

export interface StoreReturnListProps {
  data: ReturnRequestResponse[];
  page: number;
  pageSize: number;
  total: number;
  isLoading: boolean;
  error?: string | null;
  onPageChange: (page: number, pageSize?: number) => void;
  onReload?: () => void;
}

const statusColorMap: Record<string, string> = {
  PENDING: 'gold',
  APPROVED: 'green',
  REJECTED: 'red',
  SHIPPING: 'blue',
  REFUNDED: 'green',
};

const reasonTypeLabel: Record<string, string> = {
  CUSTOMER_FAULT: 'Lỗi từ khách hàng',
  SHOP_FAULT: 'Lỗi từ cửa hàng',
};

const statusLabelMap: Record<string, string> = {
  PENDING: 'Đang chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  SHIPPING: 'Đang hoàn trả',
  REFUNDED: 'Đã hoàn tiền',
};

const StoreReturnList: React.FC<StoreReturnListProps> = ({
  data,
  page,
  pageSize,
  total,
  isLoading,
  error,
  onPageChange,
  onReload,
}) => {
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const handleApprove = async (record: ReturnRequestResponse) => {
    try {
      setApprovingId(record.id);
      await StoreReturnService.approve(record.id);
      message.success('Đã duyệt yêu cầu hoàn trả');
      onReload?.();
    } catch (e: any) {
      message.error(e?.message || 'Không thể duyệt yêu cầu hoàn trả');
    } finally {
      setApprovingId(null);
    }
  };
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
          <Space size={4} direction="vertical">
            {hasRealImages && (
              <Text className="text-xs">
                Ảnh: {filteredImages.join(', ')}
              </Text>
            )}
            {hasRealVideo && (
              <Text className="text-xs">
                Video: {rawVideo}
              </Text>
            )}
          </Space>
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
    {
      title: 'Thao tác',
      key: 'actions',
      width: 150,
      render: (_: any, record: ReturnRequestResponse) => {
        if (record.status !== 'PENDING') {
          return <Text type="secondary">—</Text>;
        }
        return (
          <Button
            type="primary"
            size="small"
            loading={approvingId === record.id}
            onClick={() => handleApprove(record)}
          >
            Duyệt hoàn trả
          </Button>
        );
      },
    },
  ];

  return (
    <Card
      className="border-gray-200 shadow-sm"
      style={{ borderRadius: 12 }}
      bodyStyle={{ padding: 24 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <Title level={4} className="!mb-1">
            Yêu cầu hoàn trả sản phẩm
          </Title>
          <Text type="secondary">
            Quản lý các yêu cầu hoàn trả từ khách hàng
          </Text>
        </div>
        <Space direction="vertical" size={0} className="text-right">
          <Text type="secondary" className="text-xs">
            Tổng số yêu cầu
          </Text>
          <Text strong>{total}</Text>
        </Space>
      </div>

      {isLoading ? (
        <div className="py-16 text-center">
          <Spin size="large" />
          <p className="mt-4 text-gray-500">Đang tải danh sách yêu cầu hoàn trả...</p>
        </div>
      ) : error ? (
        <div className="py-16 text-center">
          <Text type="danger">{error}</Text>
        </div>
      ) : data.length === 0 ? (
        <div className="py-16 text-center">
          <Empty description="Chưa có yêu cầu hoàn trả nào" />
        </div>
      ) : (
        <>
          <Table<ReturnRequestResponse>
            rowKey="id"
            columns={[
              {
                title: 'STT',
                key: 'index',
                width: 70,
                align: 'center',
                render: (_: any, __: ReturnRequestResponse, index: number) => (
                  <Text>{(page - 1) * pageSize + index + 1}</Text>
                ),
              },
              ...columns.map((col) =>
                col.key === 'productName'
                  ? {
                      ...col,
                      width: 250,
                    }
                  : col
              ),
            ]}
            dataSource={data}
            pagination={false}
            scroll={{ x: 900 }}
          />
          <div className="mt-4 flex justify-end">
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

export default StoreReturnList;


