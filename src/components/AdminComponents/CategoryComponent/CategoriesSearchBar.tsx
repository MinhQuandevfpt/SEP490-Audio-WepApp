import React from 'react';

interface CategoriesSearchBarProps {
  keyword: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  onClear: () => void;
}

const CategoriesSearchBar: React.FC<CategoriesSearchBarProps> = ({ keyword, onChange, onSearch, onClear }) => {
  return (
    <div className="p-6 flex flex-col sm:flex-row sm:items-center gap-4 bg-gradient-to-r from-white to-gray-50">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Tìm kiếm theo tên, slug..."
          value={keyword}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') onSearch(); }}
          className="block w-full sm:w-80 pl-10 pr-4 py-3 border border-blue-200 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm shadow-sm transition-all duration-200"
        />
      </div>
      <div className="flex items-center gap-3">
        <button onClick={onSearch} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md">Tìm kiếm</button>
        <button onClick={onClear} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md">Xóa</button>
      </div>
    </div>
  );
};

export default CategoriesSearchBar;


