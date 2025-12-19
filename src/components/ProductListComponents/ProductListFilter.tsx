import React, { useState, useEffect } from 'react';
import type { ProductListFilters, ProductListSort as ProductListSortType } from '../../types/productList';
import { useCategories } from '../../hooks/useCategories';
import type { CategoryItem } from '../../types/api';

interface ProductListFilterProps {
  filters: ProductListFilters;
  onFiltersChange: (filters: Partial<ProductListFilters>) => void;
  onReset: () => void;
  loading?: boolean;
  sort?: ProductListSortType;
  onSortChange?: (sort: ProductListSortType) => void;
}

export const ProductListFilter: React.FC<ProductListFilterProps> = ({
  filters,
  onFiltersChange,
  onReset,
  loading = false,
  sort,
  onSortChange,
}) => {
  const { categories, loading: categoriesLoading } = useCategories();
  const [minPriceInput, setMinPriceInput] = useState<string>(
    filters.minPrice?.toString() || ''
  );
  const [maxPriceInput, setMaxPriceInput] = useState<string>(
    filters.maxPrice?.toString() || ''
  );
  const [priceError, setPriceError] = useState<string>('');
  const [minRating, setMinRating] = useState<number | undefined>(filters.minRating);

  // Sync input fields when filters change from outside (e.g., reset, URL params)
  useEffect(() => {
    setMinPriceInput(filters.minPrice?.toString() || '');
    setMaxPriceInput(filters.maxPrice?.toString() || '');
    setMinRating(filters.minRating);
    setPriceError(''); // Clear error when filters change from outside
  }, [filters.minPrice, filters.maxPrice, filters.minRating]);

  const handleSelectCategory = (categoryId: string, categoryName: string) => {
    if (loading || categoriesLoading) return;

    // If already selected, deselect it
    const nextCategoryId = filters.categoryId === categoryId ? undefined : categoryId;
    const nextCategoryName = filters.categoryId === categoryId ? undefined : categoryName;
    
    onFiltersChange({ 
      categoryId: nextCategoryId,
      categoryName: nextCategoryName, // Keep for backward compatibility and display
    });
  };

  const handleApplyPriceFilter = () => {
    if (loading) return;

    // Clear previous error
    setPriceError('');

    // Parse values (allow 0)
    const minPrice = minPriceInput ? parseFloat(minPriceInput) : undefined;
    const maxPrice = maxPriceInput ? parseFloat(maxPriceInput) : undefined;

    // Validation
    // Case 1: Both are 0
    if (minPrice === 0 && maxPrice === 0) {
      setPriceError('Vui lòng chọn khoảng giá hợp lệ');
      return;
    }

    // Case 2: Both have values and min > max
    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      setPriceError('Vui lòng chọn khoảng giá hợp lệ');
      return;
    }

    // Case 3: Both have values and both are valid (min <= max)
    // Case 4: Only one has value (also valid)
    // Apply filter
    onFiltersChange({
      minPrice: minPrice !== undefined ? minPrice : undefined,
      maxPrice: maxPrice !== undefined ? maxPrice : undefined,
    });
  };

  const handlePriceInputChange = (isMin: boolean, value: string) => {
    const formatted = formatPriceInput(value);
    if (isMin) {
      setMinPriceInput(formatted);
    } else {
      setMaxPriceInput(formatted);
    }
    // Clear error when user starts typing
    if (priceError) {
      setPriceError('');
    }
  };

  const handleMinRatingChange = (rating: number | undefined) => {
    if (loading) return;
    setMinRating(rating);
    onFiltersChange({ minRating: rating });
  };

  const handleReset = () => {
    setMinPriceInput('');
    setMaxPriceInput('');
    setMinRating(undefined);
    setPriceError('');
    
    // Reset sort to default if onSortChange is provided
    if (onSortChange) {
      onSortChange({ 
        sortBy: undefined, 
        sortDir: undefined,
        field: undefined,
        direction: undefined
      });
    }
    
    // Call parent reset handler (this will reset filters)
    onReset();
  };

  const formatPriceInput = (value: string) => {
    // Remove all non-digit characters
    const numbers = value.replace(/[^\d]/g, '');
    return numbers;
  };

  const formatPriceDisplay = (value: string) => {
    if (!value) return '';
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '';
    return numValue.toLocaleString('vi-VN');
  };

  // Sort handling
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!onSortChange) return;
    
    const value = e.target.value;
    
    if (!value || value === '') {
      // Reset to default (no sort)
      onSortChange({ 
        sortBy: undefined, 
        sortDir: undefined,
        field: undefined,
        direction: undefined
      });
      return;
    }
    
    // Parse value: "name_asc", "price_desc", etc.
    const parts = value.split('_');
    if (parts.length === 2) {
      const [sortBy, sortDir] = parts as ['name' | 'price', 'asc' | 'desc'];
      onSortChange({ 
        sortBy, 
        sortDir,
        field: undefined, // Clear old field/direction when using new format
        direction: undefined
      });
    }
  };

  // Determine current sort value
  const currentSortBy = sort?.sortBy || (sort?.field === 'price' ? 'price' : sort?.field === 'name' ? 'name' : '');
  const currentSortDir = sort?.sortDir || sort?.direction || 'asc';
  const currentSortValue = currentSortBy ? `${currentSortBy}_${currentSortDir}` : '';

  return (
    <div className="w-full">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 w-full">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Bộ lọc</h3>
          <button
            onClick={handleReset}
            disabled={loading}
            className="text-sm font-medium text-orange-600 hover:text-orange-700 disabled:opacity-50 transition-colors"
          >
            Đặt lại
          </button>
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-800 mb-4">Danh mục</p>
          {categoriesLoading ? (
            <div className="text-center py-4 text-gray-500 text-sm">Đang tải danh mục...</div>
          ) : categories.length === 0 ? (
            <div className="text-center py-4 text-gray-500 text-sm">Không có danh mục</div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {categories.map((category: CategoryItem) => {
                const isActive = filters.categoryId === category.categoryId;
                return (
                  <button
                    key={category.categoryId}
                    type="button"
                    disabled={loading || categoriesLoading}
                    onClick={() => handleSelectCategory(category.categoryId, category.name)}
                    className={`w-full px-4 py-3 text-sm font-medium rounded-lg border-2 transition-all duration-200 ${
                      isActive
                        ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-200'
                        : 'text-gray-700 border-gray-200 bg-white hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {category.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sort Section */}
      {onSortChange && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-4 w-full">
          <p className="text-sm font-semibold text-gray-800 mb-4">Sắp xếp</p>
          <select
            value={currentSortValue}
            onChange={handleSortChange}
            disabled={loading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
          >
            <option value="">Mặc định</option>
            <option value="name_asc">Tên A-Z</option>
            <option value="name_desc">Tên Z-A</option>
            <option value="price_asc">Giá tăng dần</option>
            <option value="price_desc">Giá giảm dần</option>
          </select>
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-4 w-full">
        <p className="text-sm font-semibold text-gray-800 mb-4">Khoảng Giá</p>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="₫ TỪ"
              value={formatPriceDisplay(minPriceInput)}
              onChange={(e) => handlePriceInputChange(true, e.target.value)}
              disabled={loading}
              className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <span className="text-gray-400 flex-shrink-0">-</span>
            <input
              type="text"
              placeholder="₫ ĐẾN"
              value={formatPriceDisplay(maxPriceInput)}
              onChange={(e) => handlePriceInputChange(false, e.target.value)}
              disabled={loading}
              className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          {priceError && (
            <p className="text-sm text-red-500 font-medium">{priceError}</p>
          )}
          <button
            type="button"
            onClick={handleApplyPriceFilter}
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ÁP DỤNG
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mt-4 w-full">
        <p className="text-sm font-semibold text-gray-800 mb-4">Đánh giá tối thiểu</p>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => handleMinRatingChange(minRating === rating ? undefined : rating)}
              disabled={loading}
              className={`w-full px-4 py-2.5 text-sm font-medium rounded-lg border-2 transition-all duration-200 ${
                minRating === rating
                  ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-200'
                  : 'text-gray-700 border-gray-200 bg-white hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-yellow-400">⭐</span>
                <span>{rating} sao trở lên</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductListFilter;
