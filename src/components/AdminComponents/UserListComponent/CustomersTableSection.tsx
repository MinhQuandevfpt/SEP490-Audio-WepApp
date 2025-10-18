import React from 'react';
import DataTable from '../DataTable';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row?: any) => React.ReactNode;
}

interface PaginationInfo {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

interface CustomersTableSectionProps {
  columns: Column[];
  data: any[];
  loading: boolean;
  isEmpty: boolean;
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const CustomersTableSection: React.FC<CustomersTableSectionProps> = ({
  columns,
  data,
  loading,
  isEmpty,
  pagination,
  onPageChange,
  onPageSizeChange,
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Không có dữ liệu</h3>
        <p className="mt-1 text-sm text-gray-500">Không tìm thấy khách hàng phù hợp với bộ lọc.</p>
      </div>
    );
  }

  return (
    <>
      <DataTable
        columns={columns}
        data={data}
        onRowClick={(row) => console.log('User clicked:', row)}
      />

      <div className="mt-8 bg-gray-50 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-700">
              Hiển thị{' '}
              <span className="font-semibold text-gray-900">
                {pagination.totalElements > 0 ? pagination.page * pagination.size + 1 : 0}
              </span>
              {' '}đến{' '}
              <span className="font-semibold text-gray-900">
                {Math.min((pagination.page + 1) * pagination.size, pagination.totalElements)}
              </span>
              {' '}trong tổng số{' '}
              <span className="font-semibold text-blue-600">{pagination.totalElements}</span>
              {' '}kết quả
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Hiển thị:</span>
              <select
                value={pagination.size}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-gray-600">/ trang</span>
            </div>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onPageChange(0)}
                disabled={pagination.first}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Trang đầu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.first}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Trang trước"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center space-x-1">
                {(() => {
                  const pages: React.ReactNode[] = [];
                  const totalPages = pagination.totalPages;
                  const currentPage = pagination.page;
                  let startPage = Math.max(0, currentPage - 2);
                  let endPage = Math.min(totalPages - 1, currentPage + 2);
                  if (endPage - startPage < 4) {
                    if (startPage === 0) {
                      endPage = Math.min(totalPages - 1, startPage + 4);
                    } else {
                      startPage = Math.max(0, endPage - 4);
                    }
                  }
                  if (startPage > 0) {
                    pages.push(
                      <button key={0} onClick={() => onPageChange(0)} className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                        1
                      </button>
                    );
                    if (startPage > 1) {
                      pages.push(<span key="ellipsis1" className="px-2 text-gray-500">...</span>);
                    }
                  }
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => onPageChange(i)}
                        className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          i === currentPage ? 'text-white bg-blue-600 border border-blue-600 shadow-sm' : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {i + 1}
                      </button>
                    );
                  }
                  if (endPage < totalPages - 1) {
                    if (endPage < totalPages - 2) {
                      pages.push(<span key="ellipsis2" className="px-2 text-gray-500">...</span>);
                    }
                    pages.push(
                      <button key={totalPages - 1} onClick={() => onPageChange(totalPages - 1)} className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                        {totalPages}
                      </button>
                    );
                  }
                  return pages;
                })()}
              </div>
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.last}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Trang sau"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => onPageChange(pagination.totalPages - 1)}
                disabled={pagination.last}
                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Trang cuối"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CustomersTableSection;


