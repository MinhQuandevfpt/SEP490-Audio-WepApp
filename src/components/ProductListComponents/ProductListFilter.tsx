import React from 'react';

interface ProductListFilterProps {
  filters: any;
  onFiltersChange: (filters: any) => void;
  onReset: () => void;
  loading?: boolean;
}

export const ProductListFilter: React.FC<ProductListFilterProps> = ({
  onReset,
  loading = false,
}) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Bộ lọc</h3>
        <button
          onClick={onReset}
          disabled={loading}
          className="text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50"
        >
          Đặt lại
        </button>
      </div>
      {/* Add filter options here */}
      <p className="text-sm text-gray-500">Bộ lọc sẽ được thêm sau</p>
    </div>
  );
};

export default ProductListFilter;
