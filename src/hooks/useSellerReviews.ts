import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReviewResponse } from '../types/api';
import { SellerReviewService } from '../services/seller/ReviewService';
import { ProductService } from '../services/seller/ProductService';

interface UseSellerReviewsState {
  reviews: ReviewResponse[];
  loading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  total: number;
  keyword: string;
}

interface ProductInfo {
  productId: string;
  name: string;
  image: string | null;
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
  const [productsMap, setProductsMap] = useState<Record<string, ProductInfo>>({});
  const [productsLoading, setProductsLoading] = useState<Record<string, boolean>>({});
  const fetchingRef = useRef<Set<string>>(new Set());

  const fetchReviews = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      const response = await SellerReviewService.list({
        page: state.page - 1,
        size: state.pageSize,
        keyword: state.keyword || undefined,
      });

      const reviews = response.content ?? [];
      setState((prev) => ({
        ...prev,
        reviews,
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

  // Fetch product info when reviews change
  useEffect(() => {
    const uniqueProductIds = Array.from(new Set(state.reviews.map((r) => r.productId).filter(Boolean)));
    
    uniqueProductIds.forEach((productId) => {
      // Skip if already in map or currently fetching
      if (productsMap[productId] || fetchingRef.current.has(productId)) {
        return;
      }

      // Mark as fetching
      fetchingRef.current.add(productId);
      setProductsLoading((prev) => ({ ...prev, [productId]: true }));

      ProductService.getProductById(productId)
        .then((product) => {
          const productInfo: ProductInfo = {
            productId: product.productId,
            name: product.name,
            image: product.images?.[0] || product.variants?.[0]?.variantUrl || null,
          };
          setProductsMap((prev) => ({ ...prev, [productId]: productInfo }));
        })
        .catch((error) => {
          console.error(`Failed to fetch product ${productId}:`, error);
          // Set a fallback product info
          setProductsMap((prev) => ({
            ...prev,
            [productId]: {
              productId,
              name: 'Không tìm thấy sản phẩm',
              image: null,
            },
          }));
        })
        .finally(() => {
          fetchingRef.current.delete(productId);
          setProductsLoading((prev) => {
            const next = { ...prev };
            delete next[productId];
            return next;
          });
        });
    });
  }, [state.reviews, productsMap]);

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
    productsMap,
    productsLoading,
  };
};

export default useSellerReviews;

