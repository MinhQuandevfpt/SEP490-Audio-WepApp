import React from 'react';
import type { ProductListFilters } from '../../types/productList';
import { PRODUCT_CATEGORIES } from '../../types/productList';

interface ProductListFilterProps {
  filters: ProductListFilters;
  onFiltersChange: (filters: Partial<ProductListFilters>) => void;
  onReset: () => void;
  loading?: boolean;
}

export const ProductListFilter: React.FC<ProductListFilterProps> = ({
  filters,
  onFiltersChange,
  onReset,
  loading = false,
}) => {
  const handleSelectCategory = (category: string) => {
    if (loading) return;

    const nextValue = filters.categoryName === category ? undefined : category;
    onFiltersChange({ categoryName: nextValue });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-900">Bộ lọc</h3>
        <button
          onClick={onReset}
          disabled={loading}
          className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
        >
          Đặt lại
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Danh mục</p>
          <div className="flex flex-wrap gap-2">
            {PRODUCT_CATEGORIES.map((category) => {
              const isActive = filters.categoryName === category;
              return (
                <button
                  key={category}
                  type="button"
                  disabled={loading}
                  onClick={() => handleSelectCategory(category)}
                  className={`px-3 py-1.5 text-sm rounded-full border transition ${
                    isActive
                      ? 'bg-orange-50 text-orange-600 border-orange-300'
                      : 'text-gray-600 border-gray-200 hover:border-orange-200 hover:text-orange-600'
                  } disabled:opacity-50`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductListFilter;
