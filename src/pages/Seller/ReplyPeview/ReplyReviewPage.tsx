import React, { useState } from 'react';
import { Input, Alert, Empty, message } from 'antd';
import { useSellerReviews } from '../../../hooks/useSellerReviews';
import type { ReviewResponse } from '../../../types/api';
import { ReviewList, ReviewReplyDrawer, ReviewSummary } from '../../../components/SellerReviewComponents';
import { SellerReviewService } from '../../../services/seller/ReviewService';

const ReplyReviewPage: React.FC = () => {
  const {
    reviews,
    loading,
    error,
    page,
    pageSize,
    total,
    setPage,
    setPageSize,
    keyword,
    setKeyword,
    averageRating,
    ratingBreakdown,
    fetchReviews,
    productsMap,
  } = useSellerReviews();

  const [selectedReview, setSelectedReview] = useState<ReviewResponse | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleReply = (review: ReviewResponse) => {
    setSelectedReview(review);
  };

  const handleSubmitReply = async () => {
    try {
      setSubmitting(true);
      if (!selectedReview) return;
      await SellerReviewService.reply(selectedReview.id, replyContent.trim());
      message.success('Gửi phản hồi thành công');
      await fetchReviews();
      setSelectedReview(null);
      setReplyContent('');
    } catch (error: any) {
      message.error(error?.message || 'Không thể gửi phản hồi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase font-semibold text-orange-500">Phản hồi đánh giá</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Đánh giá từ khách hàng</h1>
          <p className="text-sm text-gray-500">
            Theo dõi chất lượng sản phẩm và phản hồi khách hàng ngay trong Seller Center.
          </p>
        </div>
        <div className="w-full lg:w-80">
          <Input.Search
            placeholder="Tìm theo nội dung hoặc tên khách hàng..."
            allowClear
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="rounded-full"
          />
        </div>
      </div>

      <ReviewSummary
        averageRating={averageRating}
        totalReviews={total}
        ratingBreakdown={ratingBreakdown}
      />

      {error && <Alert type="error" message={error} showIcon />}

      {!loading && !reviews.length ? (
        <Empty description="Chưa có đánh giá nào cho sản phẩm của bạn" />
      ) : (
        <ReviewList
          reviews={reviews}
          loading={loading}
          page={page}
          pageSize={pageSize}
          total={total}
          productsMap={productsMap}
          onPageChange={(nextPage, nextSize) => {
            setPage(nextPage);
            if (nextSize !== pageSize) {
              setPageSize(nextSize);
            }
          }}
          onReply={handleReply}
        />
      )}

      <ReviewReplyDrawer
        open={!!selectedReview}
        review={selectedReview}
        replyContent={replyContent}
        onReplyChange={setReplyContent}
        onClose={() => setSelectedReview(null)}
        onSubmit={handleSubmitReply}
        submitting={submitting}
      />
    </div>
  );
};

export default ReplyReviewPage;

