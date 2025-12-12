import { useQuery } from '@tanstack/react-query';
import { ProductService } from '../services/seller/ProductService';
import type { Product, ProductQueryParams, ProductListResponse } from '../types/seller';

export interface UseSellerProductsParams extends Omit<ProductQueryParams, 'storeId'> {
  page?: number;
  size?: number;
  keyword?: string;
  status?: string;
  categoryName?: string;
}

export interface UseSellerProductsReturn {
  products: Product[];
  totalProducts: number;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * React Query hook for fetching seller products with background polling
 * 
 * @example
 * ```tsx
 * const { products, totalProducts, isLoading, isFetching } = useSellerProducts({
 *   page: 1,
 *   size: 15,
 *   keyword: 'search term',
 *   status: 'ACTIVE',
 * });
 * ```
 */
export const useSellerProducts = (
  params: UseSellerProductsParams = {},
  options?: {
    refetchInterval?: number;
    enabled?: boolean;
  }
): UseSellerProductsReturn => {
  const {
    page = 1,
    size = 15,
    keyword = '',
    status = '',
    categoryName = '',
  } = params;

  const {
    refetchInterval = 15_000, // 15 seconds default
    enabled = true,
  } = options || {};

  const queryParams: ProductQueryParams = {
    page: page - 1, // Backend uses 0-based pagination
    size,
    ...(keyword.trim() && { keyword: keyword.trim() }),
    ...(status && { status }),
    ...(categoryName && { categoryName }),
  };

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery<ProductListResponse, Error>({
    queryKey: ['seller-products', queryParams],
    queryFn: async () => {
      const response = await ProductService.getMyProducts(queryParams);
      return response;
    },
    refetchInterval: enabled ? refetchInterval : false,
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new data (v5 compatible)
    staleTime: 0, // Always consider data stale to allow background refresh
    retry: 2,
    retryDelay: 1000,
  });

  // Parse response data
  let products: Product[] = [];
  let totalCount = 0;

  if (data?.data) {
    // Check if response.data has content property (pagination structure)
    if (data.data.content && Array.isArray(data.data.content)) {
      products = data.data.content;
      totalCount = data.data.totalElements || data.data.content.length;
    } 
    // Fallback: check if response.data is directly an array (legacy structure)
    else if (Array.isArray(data.data)) {
      products = data.data;
      totalCount = data.data.length;
    }
  }

  return {
    products,
    totalProducts: totalCount,
    isLoading,
    isFetching,
    error: error || null,
    refetch: () => {
      refetch();
    },
  };
};

export default useSellerProducts;

