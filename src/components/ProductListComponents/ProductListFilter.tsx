import React, { useState } from 'react';
import { Filter, X, ChevronDown, ChevronUp, Sparkles, Tag, Star, DollarSign, Building2, Package } from 'lucide-react';
import type { ProductListFilters } from '../../types/productList';
import { PRODUCT_CATEGORIES, PRODUCT_STATUSES } from '../../types/productList';

interface ProductListFilterProps {
  filters: ProductListFilters;
  onFiltersChange: (filters: Partial<ProductListFilters>) => void;
  onReset: () => void;
  loading?: boolean;
}

const ProductListFilter: React.FC<ProductListFilterProps> = ({
  filters,
  onFiltersChange,
  onReset,
  loading = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCategoryChange = (categoryName: string) => {
    onFiltersChange({ 
      categoryName: categoryName === filters.categoryName ? undefined : categoryName 
    });
  };

  const handleStatusChange = (status: string) => {
    onFiltersChange({ 
      status: status === filters.status ? undefined : status as ProductListFilters['status']
    });
  };

  const handlePriceRangeChange = (field: 'minPrice' | 'maxPrice', value: string) => {
    const numValue = value ? parseInt(value) : undefined;
    onFiltersChange({ [field]: numValue });
  };


  const handleRatingChange = (rating: number) => {
    onFiltersChange({ 
      rating: rating === filters.rating ? undefined : rating 
    });
  };

  const handleStockToggle = () => {
    onFiltersChange({ 
      inStock: filters.inStock ? undefined : true 
    });
  };

  const hasActiveFilters = () => {
    return !!(
      filters.categoryName ||
      filters.status ||
      filters.minPrice ||
      filters.maxPrice ||
      filters.brandName ||
      filters.rating ||
      filters.inStock ||
      filters.keyword
    );
  };

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md border border-gray-100 overflow-hidden">
      {/* Enhanced Filter Toggle */}
      <div className="p-4 bg-white">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-gradient-to-br from-orange-100 to-amber-100 rounded-lg group-hover:from-orange-200 group-hover:to-amber-200 transition-all duration-300">
              <Filter className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <span className="font-semibold text-gray-900 text-base">Bộ lọc</span>
              <p className="text-xs text-gray-500">Tìm sản phẩm phù hợp</p>
            </div>
            {hasActiveFilters() && (
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-500" />
                <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-medium shadow-sm">
                  {Object.values(filters).filter(Boolean).length}
                </span>
              </div>
            )}
          </div>
          <div className="p-1.5 bg-gray-100 rounded-lg group-hover:bg-orange-100 transition-all duration-300">
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-600 group-hover:text-orange-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-600 group-hover:text-orange-600" />
            )}
          </div>
        </button>
      </div>

      {/* Enhanced Filter Content */}
      {isExpanded && (
        <div className="p-4 bg-gradient-to-br from-gray-50 to-white space-y-4">
          {/* Category Filter */}
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg">
                <Tag className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Danh mục</h3>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {PRODUCT_CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`group relative px-3 py-2 text-xs font-medium rounded-lg border transition-all duration-300 ${
                    filters.categoryName === category
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-orange-500 shadow-md'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:bg-orange-50 shadow-sm hover:shadow-md'
                  }`}
                  disabled={loading}
                >
                  <span className="relative z-10">{category}</span>
                  {filters.categoryName === category && (
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-amber-400 rounded-lg blur opacity-30"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg">
                <Package className="w-4 h-4 text-green-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Trạng thái</h3>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {PRODUCT_STATUSES.map((status) => (
                <button
                  key={status.value}
                  onClick={() => handleStatusChange(status.value)}
                  className={`group relative px-3 py-2 text-xs font-medium rounded-lg border transition-all duration-300 ${
                    filters.status === status.value
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-500 shadow-md'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-green-300 hover:bg-green-50 shadow-sm hover:shadow-md'
                  }`}
                  disabled={loading}
                >
                  <span className="relative z-10">{status.label}</span>
                  {filters.status === status.value && (
                    <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 rounded-lg blur opacity-30"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-lg">
                <DollarSign className="w-4 h-4 text-yellow-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Khoảng giá</h3>
            </div>
            <div className="flex gap-2 items-center">
              <div className="flex-1 relative group">
                <input
                  type="number"
                  placeholder="Từ"
                  value={filters.minPrice || ''}
                  onChange={(e) => handlePriceRangeChange('minPrice', e.target.value)}
                  className="w-full px-2 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-200 focus:border-yellow-400 transition-all duration-300 bg-white"
                  disabled={loading}
                />
              </div>
              <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-full">
                <span className="text-yellow-600 text-xs font-medium">-</span>
              </div>
              <div className="flex-1 relative group">
                <input
                  type="number"
                  placeholder="Đến"
                  value={filters.maxPrice || ''}
                  onChange={(e) => handlePriceRangeChange('maxPrice', e.target.value)}
                  className="w-full px-2 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-200 focus:border-yellow-400 transition-all duration-300 bg-white"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Brand Filter */}
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg">
                <Building2 className="w-4 h-4 text-purple-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Thương hiệu</h3>
            </div>
            <div className="relative group">
              <input
                type="text"
                placeholder="Nhập tên thương hiệu..."
                value={filters.brandName || ''}
                onChange={(e) => onFiltersChange({ brandName: e.target.value || undefined })}
                className="w-full px-2 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all duration-300 bg-white"
                disabled={loading}
              />
            </div>
          </div>

          {/* Rating Filter */}
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-lg">
                <Star className="w-4 h-4 text-amber-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Đánh giá</h3>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {[5, 4, 3, 2, 1].map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleRatingChange(rating)}
                  className={`group relative flex items-center justify-center gap-1 px-1 py-2 text-xs font-medium rounded-lg border transition-all duration-300 ${
                    filters.rating === rating
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white border-amber-500 shadow-md'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-amber-300 hover:bg-amber-50 shadow-sm hover:shadow-md'
                  }`}
                  disabled={loading}
                >
                  <span className="text-sm">★</span>
                  <span className="relative z-10">{rating}+</span>
                  {filters.rating === rating && (
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-lg blur opacity-30"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Stock Filter */}
          <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-gradient-to-br from-emerald-100 to-green-100 rounded-lg">
                <Package className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Tình trạng kho</h3>
            </div>
            <label className="flex items-center gap-2 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={filters.inStock || false}
                  onChange={handleStockToggle}
                  className="w-4 h-4 text-emerald-500 border border-gray-300 rounded focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 transition-all duration-300"
                  disabled={loading}
                />
              </div>
              <div className="flex-1">
                <span className="text-gray-700 text-xs font-medium">Chỉ hiển thị sản phẩm còn hàng</span>
              </div>
            </label>
          </div>

          {/* Enhanced Reset Button */}
          {hasActiveFilters() && (
            <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-3 border border-red-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gradient-to-br from-red-100 to-pink-100 rounded-lg">
                    <X className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 text-sm">Xóa tất cả bộ lọc</h4>
                  </div>
                </div>
                <button
                  onClick={onReset}
                  disabled={loading}
                  className="px-3 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-xs font-medium shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <X className="w-3 h-3" />
                  Xóa
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductListFilter;
