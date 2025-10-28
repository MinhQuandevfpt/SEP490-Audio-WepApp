import React from 'react';

interface ProductListSortProps {
  sort: any;
  onSortChange: (sort: any) => void;
  loading?: boolean;
}

export const ProductListSort: React.FC<ProductListSortProps> = ({
  sort,
  onSortChange,
  loading = false,
}) => {
  const value = sort?.sortBy || '';
  
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-600">Sắp xếp:</label>
      <select
        value={value}
        onChange={(e) => onSortChange({ sortBy: e.target.value })}
        disabled={loading}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
      >
        <option value="">Mặc định</option>
        <option value="price_asc">Giá tăng dần</option>
        <option value="price_desc">Giá giảm dần</option>
        <option value="name_asc">Tên A-Z</option>
        <option value="name_desc">Tên Z-A</option>
      </select>
    </div>
  );
};

export default ProductListSort;
