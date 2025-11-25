import React from 'react';
import { Table, Tag, Button, Rate, Image, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ReviewResponse } from '../../types/api';

interface ReviewListProps {
  reviews: ReviewResponse[];
  loading: boolean;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number, pageSize: number) => void;
  onReply: (review: ReviewResponse) => void;
}

const ReviewList: React.FC<ReviewListProps> = ({
  reviews,
  loading,
  page,
  pageSize,
  total,
  onPageChange,
  onReply,
}) => {
  const statusLabel: Record<string, { label: string; color: string }> = {
    VISIBLE: { label: 'Hiển thị', color: 'green' },
    HIDDEN: { label: 'Đã ẩn', color: 'orange' },
    DELETED: { label: 'Đã xóa', color: 'red' },
  };

  const columns: ColumnsType<ReviewResponse> = [
    {
      title: 'Khách hàng',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (text, record) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-sm font-semibold text-orange-600">
            {text?.charAt(0) ?? 'U'}
          </div>
          <div>
            <p className="font-medium text-gray-900">{text}</p>
            <p className="text-xs text-gray-500">{record.createdAt ? new Date(record.createdAt).toLocaleString('vi-VN') : ''}</p>
          </div>
        </div>
      ),
    },
    {
      title: 'Đánh giá',
      dataIndex: 'rating',
      key: 'rating',
      width: 160,
      render: (value) => <Rate disabled defaultValue={value} allowHalf={false} style={{ color: '#fa8c16' }} />,
    },
    {
      title: 'Nội dung',
      dataIndex: 'content',
      key: 'content',
      render: (value, record) => (
        <div className="space-y-2">
          <p className="text-gray-800">{value}</p>
          {(record.variantOptionName || record.variantOptionValue) && (
            <p className="text-xs text-gray-500">
              {record.variantOptionName}: {record.variantOptionValue}
            </p>
          )}
          {record.media && record.media.length > 0 && (
            <Space size="small">
              {record.media.map((item, index) => (
                <Image
                  key={`${record.id}-${index}`}
                  src={item.url}
                  width={60}
                  height={60}
                  className="rounded-lg object-cover border border-gray-100"
                  alt="media"
                />
              ))}
            </Space>
          )}
          {record.replies && record.replies.length > 0 && (
            <div className="mt-2 border border-gray-100 rounded-lg bg-gray-50 p-2 space-y-2">
              {record.replies.map((reply, idx) => (
                <div key={`${record.id}-reply-${idx}`}>
                  <p className="text-xs font-semibold text-gray-700">{reply.storeName || 'Cửa hàng'}</p>
                  <p className="text-[11px] text-gray-500 mb-1">
                    {new Date(reply.createdAt).toLocaleString('vi-VN')}
                  </p>
                  <p className="text-sm text-gray-700">{reply.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (value) => {
        const info = statusLabel[value as keyof typeof statusLabel] || { label: value, color: 'default' };
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 160,
      render: (_, record) => (
        <Button type="default" onClick={() => onReply(record)}>
          Phản hồi
        </Button>
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={reviews}
      loading={loading}
      pagination={{
        current: page,
        pageSize,
        total,
        showSizeChanger: true,
        onChange: onPageChange,
      }}
      className="shadow-sm border border-gray-100 rounded-xl"
    />
  );
};

export default ReviewList;

