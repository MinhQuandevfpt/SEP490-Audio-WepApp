import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReviewResponse } from '../types/api';
import { ProductReviewService } from '../services/customer/ProductReviewService';

interface UseProductReviewsState {
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  reviews: ReviewResponse[];
  loading: boolean;
  error: string | null;
}

export const useProductReviews = (initialSize: number = 10) => {
  const [state, setState] = useState<UseProductReviewsState>({
    page: 0,
    size: initialSize,
    totalPages: 0,
    totalElements: 0,
    reviews: [],
    loading: false,
    error: null,
  });

  const fetchReviews = useCallback(
    async (page: number = 0, size: number = state.size) => {
      setState(prev => ({
        ...prev,
        loading: true,
        error: null,
      }));

      try {
        const response = await ProductReviewService.getMyReviews(page, size);
        const visibleReviews = (response.content ?? []).filter(
          (review) => review.status !== 'HIDDEN' && review.status !== 'DELETED'
        );
        setState(prev => ({
          ...prev,
          page: response.number ?? page,
          size,
          totalPages: response.totalPages ?? 0,
          totalElements: response.totalElements ?? 0,
          reviews: visibleReviews,
          loading: false,
        }));
      } catch (error: any) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error?.message || 'Không thể tải danh sách đánh giá',
        }));
      }
    },
    [state.size]
  );

  const setPage = useCallback(
    (page: number) => {
      fetchReviews(page, state.size);
    },
    [state.size, fetchReviews]
  );

  const setPageSize = useCallback(
    (size: number) => {
      fetchReviews(0, size);
    },
    [fetchReviews]
  );

  const reset = useCallback(() => {
    setState({
      page: 0,
      size: initialSize,
      totalPages: 0,
      totalElements: 0,
      reviews: [],
      loading: false,
      error: null,
    });
  }, [initialSize]);

  useEffect(() => {
    fetchReviews(0, initialSize);
  }, [fetchReviews, initialSize]);

  return useMemo(
    () => ({
      ...state,
      fetchReviews,
      setPage,
      setPageSize,
      reset,
      updateReview: ProductReviewService.updateReview,
      deleteReview: ProductReviewService.deleteReview,
    }),
    [state, fetchReviews, setPage, setPageSize, reset]
  );
};

export default useProductReviews;

