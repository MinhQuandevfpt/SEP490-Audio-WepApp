import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Layout from '../../../components/Layout';
import {
  ProductListFilter,
  ProductListSearchBar,
  ProductListSort,
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
    const categoryName = searchParams.get('category');
    const keyword = searchParams.get('search');
    const page = searchParams.get('page');
    const size = searchParams.get('size');
    const status = searchParams.get('status');
    const brandName = searchParams.get('brandName');

    if (categoryName || keyword || page || size || status || brandName) {
      setFilters({
        categoryName: categoryName || undefined,
        keyword: keyword || undefined,
        status: status ? (status.toUpperCase() as any) : undefined, // Convert to uppercase
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
    
    if (filters.categoryName) params.set('category', filters.categoryName);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header - simple and consistent with other pages */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">
            {filters.categoryName || 'Sản phẩm'}
          </h1>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <ProductListSearchBar
            onSearch={(keyword) => {
              setSearchKeyword(keyword);
              setFilters({ keyword: keyword || undefined });
            }}
            loading={loading}
            initialKeyword={searchKeyword || filters.keyword || ''}
          />
        </div>

        {/* Main Content Layout */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Left Sidebar - Filters */}
          <aside className="lg:w-64 flex-shrink-0 order-2 lg:order-1">
            <div className="lg:sticky lg:top-6">
              <ProductListFilter
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onReset={resetFilters}
                loading={loading}
              />
            </div>
          </aside>

          {/* Right Content - Products */}
          <main className="flex-1 min-w-0 order-1 lg:order-2">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              {/* Results Count */}
              <div className="text-sm text-gray-600">
                {loading ? (
                  'Đang tải...'
                ) : (
                  `Tìm thấy ${pagination.totalElements.toLocaleString()} sản phẩm`
                )}
              </div>

              {/* Sort and View Toggle */}
              <div className="flex items-center gap-4">
                <ProductListSort
                  sort={sort}
                  onSortChange={handleSortChange}
                  loading={loading}
                />
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

            {/* Pagination */}
            {!loading && products.length > 0 && (
              <div className="mt-8">
                <ProductListPagination
                  pagination={pagination}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                  loading={loading}
                />
              </div>
            )}
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
