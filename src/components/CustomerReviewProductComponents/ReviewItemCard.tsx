import React from 'react';
import { Avatar, Card, Tag, Button, Popconfirm } from 'antd';
import { Star } from 'lucide-react';
import type { ReviewResponse } from '../../types/api';
import { formatDate } from '../../utils/orderStatus';

interface ReviewItemCardProps {
  review: ReviewResponse;
  onEdit?: (review: ReviewResponse) => void;
  onDelete?: (review: ReviewResponse) => void;
  disabled?: boolean;
}

const ReviewItemCard: React.FC<ReviewItemCardProps> = ({ review, onEdit, onDelete, disabled }) => {
  return (
    <Card className="border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Avatar size={48} style={{ backgroundColor: '#fde68a', color: '#92400e' }}>
              {review.customerName?.charAt(0).toUpperCase() || '?'}
            </Avatar>
            <div>
              <p className="font-semibold text-gray-900">{review.customerName}</p>
              <p className="text-xs text-gray-500">{formatDate(review.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-orange-500 font-semibold">
            <Star size={18} />
            <span>{review.rating}/5</span>
          </div>
        </div>

        <p className="text-gray-700 whitespace-pre-line">{review.content}</p>

        <div className="flex flex-wrap items-center gap-2 text-sm">
          {review.variantOptionName && review.variantOptionValue && (
            <Tag color="blue">
              {review.variantOptionName}: {review.variantOptionValue}
            </Tag>
          )}
          {review.media && review.media.length > 0 && (
            <Tag color="green">{review.media.length} media</Tag>
          )}
        </div>

        {review.replies && review.replies.length > 0 && (
          <div className="mt-3 space-y-2 bg-gray-50 border border-gray-100 rounded-lg p-3">
            {review.replies.map((reply, index) => (
              <div key={`${review.id}-reply-${index}`}>
                <p className="text-xs font-semibold text-gray-700">{reply.storeName || 'Cửa hàng phản hồi'}</p>
                <p className="text-[11px] text-gray-500 mb-1">{formatDate(reply.createdAt)}</p>
                <p className="text-sm text-gray-700 whitespace-pre-line">{reply.content}</p>
              </div>
            ))}
          </div>
        )}

        {(onEdit || onDelete) && (
          <div className="flex justify-end gap-2">
            {onDelete && (
              <Popconfirm
                title="Bạn chắc chắn muốn xoá đánh giá này?"
                okText="Xoá"
                cancelText="Huỷ"
                onConfirm={() => onDelete(review)}
                placement="topRight"
                okButtonProps={{ danger: true, disabled }}
                cancelButtonProps={{ disabled }}
              >
                <Button danger ghost size="small" disabled={disabled}>
                  Xoá
                </Button>
              </Popconfirm>
            )}
            {onEdit && (
              <Button
                type="primary"
                ghost
                size="small"
                onClick={() => onEdit(review)}
                disabled={disabled}
              >
                Chỉnh sửa đánh giá
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default ReviewItemCard;

