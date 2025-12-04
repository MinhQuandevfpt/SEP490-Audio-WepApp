import React, { useEffect, useMemo, useState } from 'react';
import { Empty, Pagination, Rate, Spin, Alert } from 'antd';
import { ProductReviewService } from '../../../services/customer/ProductReviewService';
import type { ReviewResponse } from '../../../types/api';
import { formatDate } from '../../../utils/orderStatus';

interface ProductReviewSectionProps {
  productId?: string;
}

const PAGE_SIZES = [5, 10];
const SUMMARY_MAX_FETCH = 300;

const ratingLevels = [5, 4, 3, 2, 1] as const;

const getSentimentLabel = (rating: number) => {
  if (rating >= 4.5) return 'Cực kì hài lòng';
  if (rating >= 3.5) return 'Hài lòng';
  if (rating >= 2.5) return 'Tạm ổn';
  if (rating >= 1.5) return 'Chưa tốt';
  return 'Không hài lòng';
};

const formatCustomerName = (name: string | null | undefined) => {
  if (!name) return 'Người dùng';
  if (name.length <= 4) return name;
  return `${name.substring(0, 2)}...${name.substring(name.length - 2)}`;
};

const ProductReviewSection: React.FC<ProductReviewSectionProps> = ({ productId }) => {
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[1]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<{
    average: number;
    total: number;
    breakdown: Record<number, number>;
    mediaGallery: string[];
    withMedia: number;
    withContent: number;
  }>({
    average: 0,
    total: 0,
    breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    mediaGallery: [],
    withMedia: 0,
    withContent: 0,
  });
  const [filterOptions, setFilterOptions] = useState<
    Array<{
      key: string;
      label: string;
      predicate?: (review: ReviewResponse) => boolean;
    }>
  >([]);
  const [activeFilter, setActiveFilter] = useState<string>('all');

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

  useEffect(() => {
    if (!productId) return;

    const fetchSummary = async () => {
      try {
        const response = await ProductReviewService.getProductReviews(
          productId,
          0,
          SUMMARY_MAX_FETCH,
        );
        const summaryReviews = response.content || [];

        const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let totalScore = 0;
        const gallery: string[] = [];
        let withMedia = 0;
        let withContent = 0;

        summaryReviews.forEach((review) => {
          const rating = Math.round(review.rating) as 1 | 2 | 3 | 4 | 5;
          if (rating >= 1 && rating <= 5) {
            breakdown[rating] = (breakdown[rating] || 0) + 1;
          }
          totalScore += review.rating;
          review.media?.forEach((media) => {
            if (gallery.length < 8) {
              gallery.push(media.url);
            }
          });
          if ((review.media?.length || 0) > 0) {
            withMedia += 1;
          }
          if (review.content && review.content.trim().length > 0) {
            withContent += 1;
          }
        });

        setSummary({
          average: summaryReviews.length
            ? Number((totalScore / summaryReviews.length).toFixed(1))
            : 0,
          total: response.totalElements || summaryReviews.length,
          breakdown,
          mediaGallery: gallery,
          withMedia,
          withContent,
        });

        setFilterOptions([
          { key: 'all', label: `Tất Cả (${response.totalElements || summaryReviews.length})` },
          {
            key: 'media',
            label: `Có Hình Ảnh / Video (${withMedia})`,
            predicate: (review) => (review.media?.length || 0) > 0,
          },
          {
            key: 'content',
            label: `Có Bình Luận (${withContent})`,
            predicate: (review) => !!review.content?.trim(),
          },
          ...ratingLevels.map((level) => ({
            key: `rating-${level}`,
            label: `${level} Sao (${breakdown[level] || 0})`,
            predicate: (review: ReviewResponse) => Math.round(review.rating) === level,
          })),
        ]);
      } catch (err) {
        console.error('Failed to fetch review summary:', err);
      }
    };

    fetchSummary();
  }, [productId]);

  const filteredReviews = useMemo(() => {
    const option = filterOptions.find((item) => item.key === activeFilter);
    if (!option || !option.predicate) return reviews;
    return reviews.filter(option.predicate);
  }, [reviews, activeFilter, filterOptions]);

  const averageRating =
    summary.total > 0
      ? summary.average
      : reviews.length > 0
        ? Number(
            (reviews.reduce((sumRatings, review) => sumRatings + review.rating, 0) / reviews.length).toFixed(1),
          )
        : 0;

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
              {summary.total > 0
                ? `${summary.total.toLocaleString('vi-VN')} đánh giá từ khách hàng`
                : 'Chưa có đánh giá'}
            </p>
        </div>
          {summary.total > 0 && (
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold text-orange-500">{averageRating}</div>
              <div className="space-y-1">
                <Rate allowHalf disabled value={averageRating} />
                <p className="text-xs text-gray-500">Trung bình cộng từ đánh giá của khách</p>
              </div>
            </div>
          )}
      </div>

      <div className="p-4 space-y-4">
        {error && <Alert type="error" message={error} showIcon />}

          {summary.total > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                {ratingLevels.map((level) => {
                  const count = summary.breakdown[level] || 0;
                  const percent = summary.total
                    ? Math.round((count / summary.total) * 100)
                    : 0;
                  return (
                    <div key={level} className="flex items-center gap-3">
                      <span className="w-10 text-sm text-gray-600">{level} sao</span>
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-sm text-gray-500">{count}</span>
                    </div>
                  );
                })}
              </div>

              <div className="lg:col-span-2">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Tất cả hình ảnh ({summary.mediaGallery.length})
                </p>
                {summary.mediaGallery.length > 0 ? (
                  <div className="grid grid-cols-5 gap-2">
                    {summary.mediaGallery.map((url, index) => (
                      <a
                        key={`${url}-${index}`}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block rounded-lg overflow-hidden border border-gray-200"
                      >
                        <img src={url} alt="review" className="w-full h-20 object-cover" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Chưa có hình ảnh được chia sẻ</p>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => {
              const isActive = option.key === activeFilter;
              return (
                <button
                  key={option.key}
                  type="button"
                  className={`px-3 py-1.5 rounded-full text-sm border ${
                    isActive
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-600'
                  }`}
                  onClick={() => setActiveFilter(option.key)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

        {loading ? (
          <div className="py-10 text-center">
            <Spin size="large" />
            <p className="mt-3 text-gray-500 text-sm">Đang tải đánh giá...</p>
            </div>
          ) : filteredReviews.length === 0 ? (
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
              {filteredReviews.map((review) => (
                <div
                  key={review.id}
                  className="border border-orange-100 rounded-xl p-4 shadow-sm space-y-4 bg-white"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-semibold text-lg">
                        {review.customerName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900" title={review.customerName || 'Người dùng'}>
                          {formatCustomerName(review.customerName)}
                        </p>
                        <p className="text-xs text-gray-400">{formatDate(review.createdAt)}</p>
                        <p className="text-xs text-green-600 font-semibold mt-1">Đã mua hàng</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Rate disabled value={review.rating} />
                      <span className="text-sm font-semibold text-orange-600">
                        {getSentimentLabel(review.rating)}
                      </span>
                    </div>
                  </div>

                  {review.variantOptionName && review.variantOptionValue && (
                    <div className="text-xs text-gray-500">
                      Phân loại: {review.variantOptionName} - {review.variantOptionValue}
                    </div>
                  )}

                  <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {review.content}
                  </div>

                  {review.media && review.media.length > 0 && (
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                      {review.media.map((media, idx) => (
                        <a
                          key={idx}
                          href={media.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded-lg overflow-hidden bg-gray-50 border border-gray-200"
                        >
                          {media.type === 'video' ? (
                            <video src={media.url} controls className="w-full h-32 object-cover" />
                          ) : (
                            <img src={media.url} alt="review media" className="w-full h-32 object-cover" />
                          )}
                        </a>
                      ))}
                    </div>
                  )}

                  {review.replies && review.replies.length > 0 && (
                    <div className="space-y-2 border border-orange-100 rounded-lg bg-orange-50 p-3">
                      {review.replies.map((reply, index) => (
                        <div key={`${review.id}-reply-${index}`}>
                          <p className="text-sm font-semibold text-gray-800">
                            Phản hồi của {reply.storeName || 'Người bán'}
                          </p>
                          <p className="text-xs text-gray-500 mb-1">{formatDate(reply.createdAt)}</p>
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

