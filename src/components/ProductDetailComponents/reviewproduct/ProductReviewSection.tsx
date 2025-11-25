import React, { useEffect, useMemo, useState } from 'react';
import { Empty, Pagination, Rate, Spin, Alert } from 'antd';
import { ProductReviewService } from '../../../services/customer/ProductReviewService';
import type { ReviewResponse } from '../../../types/api';
import { formatDate } from '../../../utils/orderStatus';

interface ProductReviewSectionProps {
  productId?: string;
}

const PAGE_SIZES = [5, 10];

const ProductReviewSection: React.FC<ProductReviewSectionProps> = ({ productId }) => {
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[1]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      setReviews([]);
      return;
    }

    const fetchReviews = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await ProductReviewService.getProductReviews(
          productId,
          page - 1,
          pageSize
        );
        setReviews(response.content || []);
        setTotal(response.totalElements || 0);
      } catch (e: any) {
        console.error('Failed to load product reviews:', e);
        setError(e?.message || 'Không thể tải đánh giá sản phẩm');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [productId, page, pageSize]);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((totalRating, review) => totalRating + review.rating, 0);
    return Number((sum / reviews.length).toFixed(1));
  }, [reviews]);

  if (!productId) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Đánh giá sản phẩm</h3>
        </div>
        <div className="p-4">
          <Empty description="Không tìm thấy sản phẩm" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Đánh giá sản phẩm</h3>
          <p className="text-sm text-gray-500">
            {total > 0 ? `${total} đánh giá từ khách hàng` : 'Chưa có đánh giá'}
          </p>
        </div>
        {total > 0 && (
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold text-orange-500">{averageRating}</div>
            <Rate allowHalf disabled value={averageRating} />
          </div>
        )}
      </div>

      <div className="p-4 space-y-4">
        {error && <Alert type="error" message={error} showIcon />}

        {loading ? (
          <div className="py-10 text-center">
            <Spin size="large" />
            <p className="mt-3 text-gray-500 text-sm">Đang tải đánh giá...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-10 text-center text-gray-500">
            <svg
              className="w-16 h-16 mx-auto mb-3 text-gray-300"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
            <p className="font-medium">Chưa có đánh giá nào</p>
            <p className="text-sm mt-1">Hãy là người đầu tiên đánh giá sản phẩm này</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="border border-gray-100 rounded-xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold text-gray-900">{review.customerName}</p>
                      <p className="text-xs text-gray-400">{formatDate(review.createdAt)}</p>
                    </div>
                    <Rate disabled value={review.rating} />
                  </div>
                  {review.variantOptionName && review.variantOptionValue && (
                    <p className="text-xs text-gray-500 mb-2">
                      {review.variantOptionName}: {review.variantOptionValue}
                    </p>
                  )}
                  <p className="text-gray-700 whitespace-pre-line">{review.content}</p>
                  {review.media && review.media.length > 0 && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {review.media.map((media, idx) => (
                        <a
                          key={idx}
                          href={media.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block border border-gray-200 rounded-lg overflow-hidden"
                        >
                          {media.type === 'video' ? (
                            <video src={media.url} controls className="w-full h-24 object-cover" />
                          ) : (
                            <img src={media.url} alt="review media" className="w-full h-24 object-cover" />
                          )}
                        </a>
                      ))}
                    </div>
                  )}
                  {review.replies && review.replies.length > 0 && (
                    <div className="mt-3 space-y-2 border border-gray-100 rounded-lg bg-gray-50 p-3">
                      {review.replies.map((reply, index) => (
                        <div key={`${review.id}-reply-${index}`}>
                          <p className="text-xs font-semibold text-gray-700">{reply.storeName || 'Cửa hàng phản hồi'}</p>
                          <p className="text-[11px] text-gray-500 mb-1">
                            {formatDate(reply.createdAt)}
                          </p>
                          <p className="text-sm text-gray-700 whitespace-pre-line">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {total > pageSize && (
              <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100">
                <Pagination
                  current={page}
                  pageSize={pageSize}
                  total={total}
                  showSizeChanger
                  pageSizeOptions={PAGE_SIZES.map(String)}
                  onChange={(nextPage, nextPageSize) => {
                    setPage(nextPage);
                    if (nextPageSize && nextPageSize !== pageSize) {
                      setPageSize(nextPageSize);
                    }
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProductReviewSection;

