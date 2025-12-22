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
  loading = false,
}) => {
  const { page, totalPages } = pagination;

  return (
    <div className="flex justify-center items-center gap-3 sm:gap-4">
      {/* Page navigation */}
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 0 || loading}
        className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-gray-600 disabled:text-gray-300"
      >
        Trước
      </button>
      
      <span className="px-4 py-2 text-sm text-gray-700 font-medium">
        Trang {page + 1} / {totalPages || 1}
      </span>
      
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages - 1 || loading || totalPages === 0}
        className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-gray-600 disabled:text-gray-300"
      >
        Sau
      </button>
    </div>
  );
};

export default ProductListPagination;
