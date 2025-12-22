import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, X } from 'lucide-react';
import Layout from '../../../components/Layout';
import {
  ProductListFilter,
  ProductListSearchBar,
  ProductListPagination,
  ProductListGrid,
  ProductListViewToggle,
  ProductCompareBar,
  ProductCompareModal,
} from '../../../components/ProductListComponents';
import { useProductList } from '../../../hooks/useProductList';
import { useProductCompare } from '../../../hooks/useProductCompare';
import { showError } from '../../../utils/notification';

const ProductListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isFilterExpanded, setIsFilterExpanded] = useState(false); // State để quản lý collapse/expand filter trên mobile
  
  const {
    products,
    loading,
    error,
    filters,
    pagination,
    sort,
    setFilters,
    setPagination,
    setSort,
    resetFilters,
    clearError,
    goToPage,
    changePageSize,
  } = useProductList();

  const {
    selectedProducts,
    compareDetails,
    isModalOpen,
    isLoadingModal,
    toggleProduct,
    removeProduct,
    clearAll,
    openCompareModal,
    closeModal,
  } = useProductCompare();


  // Initialize filters from URL params
  React.useEffect(() => {
    const categoryId = searchParams.get('categoryId');
    const categoryName = searchParams.get('category'); // Keep for backward compatibility
    const keyword = searchParams.get('search');
    const page = searchParams.get('page');
    const size = searchParams.get('size');
    const status = searchParams.get('status');
    const brandName = searchParams.get('brandName');

    if (categoryId || categoryName || keyword || page || size || status || brandName) {
      setFilters({
        categoryId: categoryId || undefined,
        categoryName: categoryName || undefined, // Keep for backward compatibility
        keyword: keyword || undefined,
        status: status ? (status.toUpperCase() as any) : 'ACTIVE', // Default to ACTIVE if not in URL
        brandName: brandName || undefined,
      });
      
      // Set search keyword state
      if (keyword) {
        setSearchKeyword(keyword);
      }
      
      if (page) setPagination({ page: parseInt(page) - 1 }); // Convert to 0-based
      if (size) setPagination({ size: parseInt(size) });
    }
  }, [searchParams, setFilters, setPagination]);

  // Update URL when filters change
  React.useEffect(() => {
    const params = new URLSearchParams();
    
    // Use categoryId if available, otherwise fallback to categoryName for backward compatibility
    if (filters.categoryId) {
      params.set('categoryId', filters.categoryId);
    } else if (filters.categoryName) {
      params.set('category', filters.categoryName);
    }
    if (filters.keyword) params.set('search', filters.keyword);
    if (filters.status) params.set('status', filters.status);
    if (filters.brandName) params.set('brandName', filters.brandName);
    if (pagination.page > 0) params.set('page', (pagination.page + 1).toString()); // Convert to 1-based
    if (pagination.size !== 20) params.set('size', pagination.size.toString());

    setSearchParams(params, { replace: true });
  }, [filters, pagination, setSearchParams]);

  // Handle error display
  React.useEffect(() => {
    if (error) {
      showError('Lỗi', error);
      clearError();
    }
  }, [error, clearError]);

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleSortChange = (newSort: any) => {
    setSort(newSort);
  };

  const handlePageChange = (page: number) => {
    goToPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    changePageSize(size);
  };

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Page Header - simple and consistent with other pages */}
        <div className="mb-4 sm:mb-6 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-gray-900">
            {filters.categoryName || 'Sản phẩm'}
          </h1>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <ProductListSearchBar
            onSearch={(keyword) => {
              setSearchKeyword(keyword);
              setFilters({ keyword: keyword || undefined });
            }}
            loading={loading}
            initialKeyword={searchKeyword || filters.keyword || ''}
          />
        </div>

        {/* Pagination - Desktop: top, Mobile: after filters */}
        {!loading && products.length > 0 && (
          <div className="mb-6 hidden lg:block">
            <ProductListPagination
              pagination={pagination}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              loading={loading}
            />
          </div>
        )}

        {/* Mobile Filter Toggle Button */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-orange-500" />
              <span className="font-medium text-gray-900">Bộ lọc</span>
              {(filters.categoryId || filters.minPrice || filters.maxPrice || filters.minRating) && (
                <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-600 text-xs font-medium rounded-full">
                  Đã chọn
                </span>
              )}
            </div>
            {isFilterExpanded ? (
              <X className="w-5 h-5 text-gray-500" />
            ) : (
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>
        </div>

        {/* Main Content Layout */}
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          {/* Left Sidebar - Filters - Collapsible trên mobile, bên trái trên desktop */}
          <aside className={`lg:w-64 flex-shrink-0 order-1 lg:order-1 ${isFilterExpanded ? 'block' : 'hidden lg:block'}`}>
            <div className="lg:sticky lg:top-6">
              <ProductListFilter
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onReset={resetFilters}
                loading={loading}
                sort={sort}
                onSortChange={handleSortChange}
                onClose={() => setIsFilterExpanded(false)} // Đóng filter trên mobile
              />
              
              {/* Pagination - Mobile: after filters */}
              {!loading && products.length > 0 && (
                <div className="mt-4 lg:hidden">
                  <ProductListPagination
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    loading={loading}
                  />
                </div>
              )}
            </div>
          </aside>

          {/* Right Content - Products - Hiển thị sau trên mobile, bên phải trên desktop */}
          <main className="flex-1 min-w-0 order-2 lg:order-2">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
              {/* Results Count */}
              <div className="text-xs sm:text-sm text-gray-600">
                {loading ? (
                  'Đang tải...'
                ) : (
                  `Tìm thấy ${pagination.totalElements.toLocaleString()} sản phẩm`
                )}
              </div>

              {/* View Toggle */}
              <div className="flex items-center gap-3 sm:gap-4">
                <ProductListViewToggle
                  viewMode={viewMode}
                  onViewModeChange={handleViewModeChange}
                  loading={loading}
                />
              </div>
            </div>

            {/* Products Grid */}
            <ProductListGrid
              products={products}
              loading={loading}
              viewMode={viewMode}
              selectedProductIds={selectedProducts.map((item) => item.productId)}
              onToggleCompare={toggleProduct}
            />
          </main>
        </div>
      </div>

      <ProductCompareBar
        selected={selectedProducts}
        onRemove={removeProduct}
        onClear={clearAll}
        onCompare={openCompareModal}
      />

      <ProductCompareModal
        open={isModalOpen}
        loading={isLoadingModal}
        products={compareDetails}
        onClose={closeModal}
        onRemove={removeProduct}
      />
    </Layout>
  );
};

export default ProductListPage;
