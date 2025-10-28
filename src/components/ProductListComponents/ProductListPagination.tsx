import React from 'react';

interface ProductListPaginationProps {
  pagination: {
    page: number;
    size: number;
    totalPages: number;
    totalElements: number;
  };
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  loading?: boolean;
}

export const ProductListPagination: React.FC<ProductListPaginationProps> = ({
  pagination,
  onPageChange,
  onPageSizeChange,
  loading = false,
}) => {
  const { page, totalPages, size } = pagination;

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
      {/* Page size selector */}
      {onPageSizeChange && (
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Hiển thị:</label>
          <select
            value={size}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            disabled={loading}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            <option value={12}>12</option>
            <option value={24}>24</option>
            <option value={48}>48</option>
          </select>
        </div>
      )}

      {/* Page navigation */}
      <div className="flex justify-center items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 0 || loading}
          className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Trước
        </button>
        
        <span className="px-4 py-2">
          Trang {page + 1} / {totalPages}
        </span>
        
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1 || loading}
          className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Sau
        </button>
      </div>
    </div>
  );
};

export default ProductListPagination;
