import { useState, useEffect, useCallback, useRef } from 'react';
import { ProductListService, type Product } from '../services/customer/ProductListService';
import type { ProductListParams, ProductListResponse } from '../services/customer/ProductListService';
import type { ProductListFilters, ProductListPagination, ProductListSort, ProductListState, ProductListActions } from '../types/productList';
import { showError } from '../utils/notification';
import { applyDiscountToProduct } from '../utils/productPriceCalculator';

const initialFilters: ProductListFilters = {
  categoryName: undefined,
  storeId: undefined,
  keyword: undefined,
  status: undefined, // Don't set default status to avoid API errors
  minPrice: undefined,
  maxPrice: undefined,
  brandName: undefined,
  rating: undefined,
  minRating: undefined,
  inStock: undefined,
  provinceCode: undefined,
  districtCode: undefined,
  wardCode: undefined,
};

const initialPagination: ProductListPagination = {
  page: 0,
  size: 20,
  totalPages: 0,
  totalElements: 0,
  hasNext: false,
  hasPrevious: false,
};

const initialSort: ProductListSort = {
  field: 'createdAt',
  direction: 'desc',
  sortBy: undefined,
  sortDir: undefined,
};

export const useProductList = () => {
  const [state, setState] = useState<ProductListState>({
    products: [],
    loading: false,
    error: null,
    filters: initialFilters,
    pagination: initialPagination,
    sort: initialSort,
  });

  // Debounce timer ref
  const debounceTimerRef = useRef<number | null>(null);
  // Abort controller ref for request cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch products từ API
  const fetchProducts = useCallback(async () => {
    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const params: ProductListParams = {
        page: state.pagination.page,
        size: state.pagination.size,
        // Use categoryId if available, otherwise fallback to categoryName
        ...(state.filters.categoryId ? { categoryId: state.filters.categoryId } : {}),
        ...(state.filters.categoryName && !state.filters.categoryId ? { categoryName: state.filters.categoryName } : {}),
        storeId: state.filters.storeId,
        keyword: state.filters.keyword,
        // Only send status if it's explicitly set and not undefined
        ...(state.filters.status !== undefined && { status: state.filters.status }),
        // Add price range filters (allow 0)
        ...(state.filters.minPrice !== undefined && state.filters.minPrice >= 0 && { minPrice: state.filters.minPrice }),
        ...(state.filters.maxPrice !== undefined && state.filters.maxPrice >= 0 && { maxPrice: state.filters.maxPrice }),
        // Add minRating filter
        ...(state.filters.minRating !== undefined && state.filters.minRating >= 0 && { minRating: state.filters.minRating }),
        // Add location filters
        ...(state.filters.provinceCode && { provinceCode: state.filters.provinceCode }),
        ...(state.filters.districtCode && { districtCode: state.filters.districtCode }),
        ...(state.filters.wardCode && { wardCode: state.filters.wardCode }),
        // Add sorting params (use sortBy/sortDir if available, otherwise convert from field/direction)
        ...(state.sort.sortBy ? { sortBy: state.sort.sortBy } : {}),
        ...(state.sort.sortDir ? { sortDir: state.sort.sortDir } : {}),
        // Fallback: convert field/direction to sortBy/sortDir for backward compatibility
        ...(!state.sort.sortBy && state.sort.field === 'name' && { sortBy: 'name' as const }),
        ...(!state.sort.sortBy && state.sort.field === 'price' && { sortBy: 'price' as const }),
        ...(!state.sort.sortDir && state.sort.direction && { sortDir: state.sort.direction }),
      };

      const response: ProductListResponse = await ProductListService.getProducts(params);
      
      // Handle different response structures
      let responseData: {
        content: Product[];
        totalPages: number;
        totalElements: number;
        last: boolean;
        first: boolean;
      };
      
      if (Array.isArray(response.data)) {
        // Array response
        responseData = {
          content: response.data,
          totalPages: 1,
          totalElements: response.data.length,
          last: true,
          first: true,
        };
      } else if ('data' in response.data && 'page' in response.data) {
        // New API structure: { data: Product[], page: {...} }
        const pageInfo = response.data.page;
        responseData = {
          content: response.data.data,
          totalPages: pageInfo.totalPages,
          totalElements: pageInfo.totalElements,
          last: pageInfo.pageNumber >= pageInfo.totalPages - 1,
          first: pageInfo.pageNumber === 0,
        };
      } else {
        // Old pagination structure: { content: Product[], ... }
        responseData = {
          content: response.data.content,
          totalPages: response.data.totalPages,
          totalElements: response.data.totalElements,
          last: response.data.last,
          first: response.data.first,
        };
      }
      
      // Apply discount calculation to products (from platform vouchers)
      const productsWithDiscount = responseData.content.map(applyDiscountToProduct);

      setState(prev => ({
        ...prev,
        products: productsWithDiscount,
        pagination: {
          ...prev.pagination,
          totalPages: responseData.totalPages,
          totalElements: responseData.totalElements,
          hasNext: !responseData.last,
          hasPrevious: !responseData.first,
        },
        loading: false,
      }));
    } catch (error) {
      console.error('Error fetching products:', error);
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải danh sách sản phẩm';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }));
      showError('Lỗi', errorMessage);
    }
  }, [state.filters, state.pagination.page, state.pagination.size, state.sort]);

  // Set filters
  const setFilters = useCallback((newFilters: Partial<ProductListFilters>) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, ...newFilters },
      pagination: { ...prev.pagination, page: 0 }, // Reset về trang đầu khi filter
    }));
  }, []);

  // Set pagination
  const setPagination = useCallback((newPagination: Partial<ProductListPagination>) => {
    setState(prev => ({
      ...prev,
      pagination: { ...prev.pagination, ...newPagination },
    }));
  }, []);

  // Set sort
  const setSort = useCallback((newSort: ProductListSort) => {
    setState(prev => ({
      ...prev,
      sort: newSort,
      pagination: { ...prev.pagination, page: 0 }, // Reset về trang đầu khi sort
    }));
  }, []);

  // Reset filters
  const resetFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filters: initialFilters,
      pagination: { ...prev.pagination, page: 0 },
    }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Go to next page
  const goToNextPage = useCallback(() => {
    if (state.pagination.hasNext) {
      setPagination({ page: state.pagination.page + 1 });
    }
  }, [state.pagination.hasNext, state.pagination.page, setPagination]);

  // Go to previous page
  const goToPreviousPage = useCallback(() => {
    if (state.pagination.hasPrevious) {
      setPagination({ page: state.pagination.page - 1 });
    }
  }, [state.pagination.hasPrevious, state.pagination.page, setPagination]);

  // Go to specific page
  const goToPage = useCallback((page: number) => {
    if (page >= 0 && page < state.pagination.totalPages) {
      setPagination({ page });
    }
  }, [state.pagination.totalPages, setPagination]);

  // Change page size
  const changePageSize = useCallback((size: number) => {
    setPagination({ size, page: 0 });
  }, [setPagination]);

  // Search products
  const searchProducts = useCallback((keyword: string) => {
    setFilters({ keyword });
  }, [setFilters]);

  // Filter by category
  const filterByCategory = useCallback((categoryName: string) => {
    setFilters({ categoryName });
  }, [setFilters]);

  // Filter by status
  const filterByStatus = useCallback((status: ProductListFilters['status']) => {
    setFilters({ status });
  }, [setFilters]);

  // Filter by price range
  const filterByPriceRange = useCallback((minPrice?: number, maxPrice?: number) => {
    setFilters({ minPrice, maxPrice });
  }, [setFilters]);

  // Filter by brand
  const filterByBrand = useCallback((brandName: string) => {
    setFilters({ brandName });
  }, [setFilters]);

  // Filter by rating
  const filterByRating = useCallback((rating: number) => {
    setFilters({ rating });
  }, [setFilters]);

  // Toggle stock filter
  const toggleStockFilter = useCallback(() => {
    setFilters({ inStock: state.filters.inStock ? undefined : true });
  }, [state.filters.inStock, setFilters]);

  // Debounced fetch function
  const debouncedFetchProducts = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = window.setTimeout(() => {
      fetchProducts();
    }, 300); // 300ms debounce
  }, [fetchProducts]);

  // Auto fetch khi dependencies thay đổi
  useEffect(() => {
    debouncedFetchProducts();
    
    // Cleanup timer and abort controller on unmount
    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedFetchProducts]);

  const actions: ProductListActions = {
    setFilters,
    setPagination,
    setSort,
    fetchProducts,
    resetFilters,
    clearError,
  };

  return {
    // State
    products: state.products,
    loading: state.loading,
    error: state.error,
    filters: state.filters,
    pagination: state.pagination,
    sort: state.sort,
    
    // Actions
    ...actions,
    
    // Convenience methods
    goToNextPage,
    goToPreviousPage,
    goToPage,
    changePageSize,
    searchProducts,
    filterByCategory,
    filterByStatus,
    filterByPriceRange,
    filterByBrand,
    filterByRating,
    toggleStockFilter,
  };
};
