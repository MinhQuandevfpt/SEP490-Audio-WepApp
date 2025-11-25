import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReviewResponse } from '../types/api';
import { SellerReviewService } from '../services/seller/ReviewService';

interface UseSellerReviewsState {
  reviews: ReviewResponse[];
  loading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  total: number;
  keyword: string;
}

export const useSellerReviews = () => {
  const [state, setState] = useState<UseSellerReviewsState>({
    reviews: [],
    loading: false,
    error: null,
    page: 1,
    pageSize: 10,
    total: 0,
    keyword: '',
  });

  const fetchReviews = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const response = await SellerReviewService.list({
        page: state.page - 1,
        size: state.pageSize,
        keyword: state.keyword || undefined,
      });

      setState((prev) => ({
        ...prev,
        reviews: response.content ?? [],
        total: response.totalElements ?? 0,
        loading: false,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error?.message || 'Không thể tải danh sách đánh giá',
        reviews: [],
      }));
    }
  }, [state.page, state.pageSize, state.keyword]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const setPage = (page: number) => setState((prev) => ({ ...prev, page }));
  const setPageSize = (pageSize: number) =>
    setState((prev) => ({ ...prev, pageSize, page: 1 }));
  const setKeyword = (keyword: string) =>
    setState((prev) => ({ ...prev, keyword, page: 1 }));

  const averageRating = useMemo(() => {
    if (!state.reviews.length) {
      return 0;
    }
    const total = state.reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    return Number((total / state.reviews.length).toFixed(1));
  }, [state.reviews]);

  const ratingBreakdown = useMemo(() => {
    const breakdown = [0, 0, 0, 0, 0];
    state.reviews.forEach((review) => {
      if (review.rating) {
        breakdown[review.rating - 1] += 1;
      }
    });
    return breakdown;
  }, [state.reviews]);

  return {
    reviews: state.reviews,
    loading: state.loading,
    error: state.error,
    page: state.page,
    pageSize: state.pageSize,
    total: state.total,
    keyword: state.keyword,
    setPage,
    setPageSize,
    setKeyword,
    fetchReviews,
    averageRating,
    ratingBreakdown,
  };
};

export default useSellerReviews;

