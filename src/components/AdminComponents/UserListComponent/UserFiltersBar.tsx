import React from 'react';

interface UserFiltersBarProps {
  searchKeyword: string;
  statusFilter?: string;
  sortBy: string;
  onSearch: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onClearAll: () => void;
}

const UserFiltersBar: React.FC<UserFiltersBarProps> = ({
  searchKeyword,
  statusFilter,
  sortBy,
  onSearch,
  onStatusChange,
  onSortChange,
  onClearAll
}) => {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email..."
              value={searchKeyword}
              onChange={(e) => onSearch(e.target.value)}
              className="block w-full sm:w-80 pl-10 pr-4 py-3 border border-blue-200 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm shadow-sm transition-all duration-200"
            />
          </div>

          <div className="relative">
            <select 
              value={statusFilter || 'Tất cả trạng thái'}
              onChange={(e) => onStatusChange(e.target.value)}
              className="block w-full sm:w-48 px-4 py-3 border border-blue-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white transition-all duration-200"
            >
              <option>Tất cả trạng thái</option>
              <option value="ACTIVE">🟢 Hoạt động</option>
              <option value="INACTIVE">🟡 Không hoạt động</option>
              <option value="SUSPENDED">🔴 Bị khóa</option>
              <option value="DELETED">⚫ Đã xóa</option>
            </select>
          </div>

          <div className="relative">
            <select 
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="block w-full sm:w-48 px-4 py-3 border border-blue-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white transition-all duration-200"
            >
              <option value="createdAt,desc">📅 Mới nhất</option>
              <option value="createdAt,asc">📅 Cũ nhất</option>
              <option value="fullName,asc">🔤 Tên A-Z</option>
              <option value="fullName,desc">🔤 Tên Z-A</option>
              <option value="orderCount,desc">📦 Đơn hàng nhiều</option>
              <option value="dateOfBirth,desc">🎂 Tuổi cao</option>
              <option value="dateOfBirth,asc">🎂 Tuổi thấp</option>
              <option value="gender,asc">👥 Giới tính</option>
            </select>
          </div>
        </div>

        <div className="flex space-x-3">
          <button className="inline-flex items-center px-4 py-3 border border-blue-300 rounded-lg shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200">
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
            </svg>
            Lọc nâng cao
          </button>
          <button className="inline-flex items-center px-4 py-3 border border-green-300 rounded-lg shadow-sm text-sm font-medium text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200">
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Xuất Excel
          </button>
        </div>
      </div>

      {(searchKeyword || statusFilter) && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-600">Bộ lọc đang áp dụng:</span>
          {searchKeyword && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              🔍 "{searchKeyword}"
              <button onClick={onClearAll} className="ml-2 text-blue-600 hover:text-blue-800">×</button>
            </span>
          )}
          {statusFilter && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              📊 {statusFilter}
              <button onClick={onClearAll} className="ml-2 text-green-600 hover:text-green-800">×</button>
            </span>
          )}
          <button onClick={onClearAll} className="text-sm text-gray-500 hover:text-gray-700 underline">Xóa tất cả</button>
        </div>
      )}
    </div>
  );
};

export default UserFiltersBar;


