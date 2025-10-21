import React from 'react';
import { ChevronDown } from 'lucide-react';
import type { ProductListSort as SortType } from '../../types/productList';
import { SORT_OPTIONS } from '../../types/productList';

interface ProductListSortProps {
  sort: SortType;
  onSortChange: (sort: SortType) => void;
  loading?: boolean;
}

const ProductListSort: React.FC<ProductListSortProps> = ({
  sort,
  onSortChange,
  loading = false,
}) => {
  const handleSortChange = (sortValue: string) => {
    const [field, direction] = sortValue.split(':') as [SortType['field'], SortType['direction']];
    onSortChange({ field, direction });
  };

  const getCurrentSortValue = () => {
    return `${sort.field}:${sort.direction}`;
  };

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-600">Sắp xếp theo:</span>
      <div className="relative">
        <select
          value={getCurrentSortValue()}
          onChange={(e) => handleSortChange(e.target.value)}
          disabled={loading}
          className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );
};

export default ProductListSort;
