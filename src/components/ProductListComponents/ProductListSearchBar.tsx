import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface ProductListSearchBarProps {
  onSearch: (keyword: string) => void;
  loading?: boolean;
  initialKeyword?: string;
}

const ProductListSearchBar: React.FC<ProductListSearchBarProps> = ({
  onSearch,
  loading = false,
  initialKeyword = '',
}) => {
  const [searchKeyword, setSearchKeyword] = useState(initialKeyword);

  const handleSearch = () => {
    onSearch(searchKeyword.trim() || '');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl shadow-lg border border-orange-100 p-6 mb-6">
      <div className="flex gap-3">
        <div className="flex-1 relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-amber-400 rounded-xl blur opacity-0 group-focus-within:opacity-20 transition-opacity duration-300"></div>
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-orange-500 w-5 h-5 z-10" />
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm yêu thích..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyPress={handleKeyPress}
            className="relative w-full pl-12 pr-4 py-3 bg-white border-2 border-orange-200 rounded-xl focus:ring-4 focus:ring-orange-200 focus:border-orange-400 transition-all duration-300 shadow-sm"
            disabled={loading}
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:from-orange-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300"
        >
          <Search className="w-4 h-4" />
          Tìm kiếm
        </button>
      </div>
    </div>
  );
};

export default ProductListSearchBar;
