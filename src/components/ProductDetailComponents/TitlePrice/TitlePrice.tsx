import React from 'react';
import { Star } from 'lucide-react';
import type { ReviewResponse } from '../../../types/api';
import { ProductReviewService } from '../../../services/customer/ProductReviewService';

interface TitlePriceProps {
  name: string;
  brand: string;
  rating: number;
  reviewsCount: number;
  soldCount: number;
  price: number;
  priceRange?: string | null;
  discountedPriceRange?: string | null;
  salePrice?: number;
  discountPercent?: number;
  campaignBadge?: { label: string; color: string } | null;
  shortDescription?: string;
  productId: string;
}

const toVnd = (n: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const TitlePrice: React.FC<TitlePriceProps> = ({
  name,
  brand,
  rating,
  reviewsCount,
  soldCount,
  price,
  priceRange,
  discountedPriceRange,
  salePrice,
  discountPercent: providedDiscount,
  shortDescription,
  productId,
}) => {
  const [reviewStats, setReviewStats] = React.useState<{ avg: number; count: number } | null>(null);
  const [loadingReviews, setLoadingReviews] = React.useState(false);

  React.useEffect(() => {
    if (!productId) return;
    let isMounted = true;

    const fetchReviews = async () => {
      try {
        setLoadingReviews(true);
        const response = await ProductReviewService.getProductReviews(productId, 0, 50);
        if (!isMounted) return;

        const reviews = response.content as ReviewResponse[];
        if (reviews.length === 0) {
          setReviewStats({ avg: 0, count: 0 });
          return;
        }
        const total = reviews.reduce((sum, review) => sum + (review.rating ?? 0), 0);
        setReviewStats({
          avg: total / reviews.length,
          count: response.totalElements ?? reviews.length,
        });
      } catch (error) {
        console.error('Failed to load product reviews:', error);
      } finally {
        if (isMounted) setLoadingReviews(false);
      }
    };

    fetchReviews();

    return () => {
      isMounted = false;
    };
  }, [productId]);

  const finalPrice = salePrice ?? price;
  const discount = providedDiscount || (salePrice ? Math.round((1 - salePrice / price) * 100) : 0);

  const displayedRating =
    reviewStats && reviewStats.count > 0
      ? {
          avg: reviewStats.avg,
          count: reviewStats.count,
          text: `${reviewStats.avg.toFixed(1)} (${reviewStats.count.toLocaleString('vi-VN')} đánh giá)`,
        }
      : {
          avg: rating,
          count: reviewsCount,
          text: reviewsCount > 0
            ? `${rating.toFixed(1)} (${reviewsCount.toLocaleString('vi-VN')} đánh giá)`
            : 'Chưa có đánh giá',
        };

  return (
    <div>
      <h1 className="text-[24px] md:text-[28px] font-bold text-gray-900 leading-snug">{name}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
        <span>
          Thương hiệu: <span className="font-medium text-gray-900">{brand}</span>
        </span>
        <span className="hidden sm:inline h-4 w-px bg-gray-300" />
        <span className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-500" />
          {loadingReviews ? 'Đang tính...' : displayedRating.text}
        </span>
        <span className="hidden sm:inline h-4 w-px bg-gray-300" />
        <span className="flex items-center gap-1">
          <span className="text-red-500">🔥</span> Bán chạy {soldCount.toLocaleString('vi-VN')}+
        </span>
      </div>
      <div className="mt-3 text-sm text-gray-600 leading-relaxed">{shortDescription}</div>

      <div className="mt-4 flex items-center gap-4">
        {discountedPriceRange && priceRange ? (
          <>
            <div className="text-[32px] font-extrabold text-red-600">{discountedPriceRange}</div>
            <div className="text-[18px] text-gray-400 line-through">{priceRange}</div>
            {discount > 0 && (
              <div className="text-base font-semibold bg-blue-100 text-blue-600 px-3 py-1 rounded">
                -{discount}%
              </div>
            )}
          </>
        ) : priceRange ? (
          <div className="text-[32px] font-extrabold text-orange-500">{priceRange}</div>
        ) : salePrice && salePrice < price ? (
          <>
            <div className="text-[32px] font-extrabold text-red-600">{toVnd(finalPrice)}</div>
            <div className="text-[18px] text-gray-400 line-through">{toVnd(price)}</div>
            <div className="text-base font-semibold bg-blue-100 text-blue-600 px-3 py-1 rounded">
              -{discount}%
            </div>
          </>
        ) : (
          <div className="text-[32px] font-extrabold text-orange-500">{toVnd(price)}</div>
        )}
      </div>
    </div>
  );
};

export default TitlePrice;
