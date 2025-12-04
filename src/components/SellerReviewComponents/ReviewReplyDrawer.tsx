import React, { useEffect } from 'react';
import { Drawer, Rate, Input, Button, Space, Image, Timeline } from 'antd';
import type { ReviewResponse } from '../../types/api';

const { TextArea } = Input;

interface ReviewReplyDrawerProps {
  open: boolean;
  review: ReviewResponse | null;
  replyContent: string;
  onReplyChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  submitting: boolean;
}

const ReviewReplyDrawer: React.FC<ReviewReplyDrawerProps> = ({
  open,
  review,
  replyContent,
  onReplyChange,
  onClose,
  onSubmit,
  submitting,
}) => {
  useEffect(() => {
    if (!open) {
      onReplyChange('');
    }
  }, [open, onReplyChange]);

  return (
    <Drawer
      width={520}
      open={open}
      onClose={onClose}
      title="Phản hồi đánh giá"
      destroyOnClose
      extra={
        <Button onClick={onClose} type="text">
          Đóng
        </Button>
      }
    >
      {review ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-100 p-4 bg-gray-50">
            <p className="text-sm font-semibold text-gray-900">{review.customerName}</p>
            <p className="text-xs text-gray-500 mb-2">
              {review.createdAt ? new Date(review.createdAt).toLocaleString('vi-VN') : ''}
            </p>
            <Rate disabled defaultValue={review.rating} style={{ color: '#fa8c16' }} />
            <p className="mt-3 text-gray-800">{review.content}</p>
            {review.media?.length ? (
              <Space className="mt-3">
                {review.media.map((media, index) => (
                  <Image key={`${media.url}-${index}`} src={media.url} width={80} height={80} />
                ))}
              </Space>
            ) : null}
          </div>

          <div className="space-y-4">
            {review.replies && review.replies.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Lịch sử phản hồi</p>
                <Timeline
                  items={review.replies.map((reply) => ({
                    children: (
                      <div>
                        <p className="text-sm font-medium text-gray-900">{reply.storeName}</p>
                        <p className="text-xs text-gray-500 mb-1">
                          {new Date(reply.createdAt).toLocaleString('vi-VN')}
                        </p>
                        <p className="text-sm text-gray-700">{reply.content}</p>
                      </div>
                    ),
                  }))}
                />
              </div>
            )}

            <p className="text-sm font-medium text-gray-700 mb-2">Nội dung phản hồi</p>
            <TextArea
              rows={6}
              placeholder="Nhập phản hồi cho khách hàng..."
              value={replyContent}
              onChange={(e) => onReplyChange(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <Button type="primary" onClick={onSubmit} loading={submitting} disabled={!replyContent.trim()}>
              Gửi phản hồi
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500">Chọn một đánh giá để xem chi tiết.</p>
      )}
    </Drawer>
  );
};

export default ReviewReplyDrawer;

