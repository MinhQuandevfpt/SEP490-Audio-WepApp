import React, { useMemo, useState } from 'react';
import { Empty, Pagination, Spin, Alert, message } from 'antd';
import { ReviewFilters, ReviewItemCard, ReviewEditModal } from '../../../components/CustomerReviewProductComponents';
import useProductReviews from '../../../hooks/useProductReviews';
import type { ReviewMediaPayload, ReviewResponse } from '../../../types/api';

type ReviewFormValues = {
  rating: number;
  content: string;
  media: ReviewMediaPayload[];
};

const ReviewProductPage: React.FC = () => {
  const {
    reviews,
    loading,
    error,
    page,
    size,
    totalElements,
    fetchReviews,
    setPage,
    setPageSize,
    updateReview,
    deleteReview,
  } = useProductReviews();

  const [editingReview, setEditingReview] = useState<ReviewResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalLabel = useMemo(
    () => `Tổng ${totalElements} đánh giá · Trang ${page + 1}`,
    [totalElements, page]
  );

  const handleRefresh = () => {
    fetchReviews(page, size);
  };

  const handleOpenEdit = (review: ReviewResponse) => {
    setEditingReview(review);
  };

  const handleCloseModal = () => {
    setEditingReview(null);
  };

  const handleSubmitEdit = async (values: ReviewFormValues) => {
    if (!editingReview) return;
    try {
      setIsSubmitting(true);
      await updateReview(editingReview.id, {
        rating: values.rating,
        content: values.content,
        media: values.media,
      });
      message.success('Cập nhật đánh giá thành công');
      setEditingReview(null);
      fetchReviews(page, size);
    } catch (err: any) {
      message.error(err?.message || 'Không thể cập nhật đánh giá');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async (review: ReviewResponse) => {
    try {
      message.loading({ content: 'Đang xoá đánh giá...', key: review.id });
      await deleteReview(review.id);
      message.success({ content: 'Xoá đánh giá thành công', key: review.id });
      fetchReviews(page, size);
    } catch (err: any) {
      message.error({ content: err?.message || 'Không thể xoá đánh giá', key: review.id });
    }
  };

  return (
    <div className="space-y-4">
      <ReviewFilters
        loading={loading}
        pageSize={size}
        onChangePageSize={(nextSize) => setPageSize(nextSize)}
        onRefresh={handleRefresh}
      />

      {error && (
        <Alert message={error} type="error" showIcon className="bg-red-50 border-red-200" />
      )}

      {loading && reviews.length === 0 ? (
        <div className="flex justify-center py-12">
          <Spin size="large" />
        </div>
      ) : reviews.length === 0 ? (
        <Empty description="Chưa có đánh giá nào" className="bg-white rounded-xl py-10" />
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewItemCard
              key={review.id}
              review={review}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteReview}
              disabled={loading}
            />
          ))}
        </div>
      )}

      {reviews.length > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-3 bg-white border border-gray-200 rounded-xl p-3">
          <p className="text-sm text-gray-500">{totalLabel}</p>
          <Pagination
            current={page + 1}
            pageSize={size}
            total={totalElements}
            onChange={(nextPage, nextSize) => {
              if (nextSize !== size) {
                setPageSize(nextSize);
              } else {
                setPage(nextPage - 1);
              }
            }}
            showSizeChanger
            pageSizeOptions={['5', '10', '20']}
          />
        </div>
      )}

      <ReviewEditModal
        open={Boolean(editingReview)}
        review={editingReview}
        loading={isSubmitting}
        onClose={handleCloseModal}
        onSubmit={handleSubmitEdit}
      />
    </div>
  );
};

export default ReviewProductPage;
