import React, { useState, useEffect } from 'react';

interface ProductListSearchBarProps {
  onSearch: (keyword: string) => void;
  loading?: boolean;
  initialKeyword?: string;
}

export const ProductListSearchBar: React.FC<ProductListSearchBarProps> = ({
  onSearch,
  loading = false,
  initialKeyword = '',
}) => {
  const [value, setValue] = useState(initialKeyword);

  useEffect(() => {
    setValue(initialKeyword);
  }, [initialKeyword]);

  const handleSearch = () => {
    onSearch(value);
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        placeholder="Tìm kiếm sản phẩm..."
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        disabled={loading}
      />
      <button
        onClick={handleSearch}
        disabled={loading}
        className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Đang tìm...' : 'Tìm kiếm'}
      </button>
    </div>
  );
};

export default ProductListSearchBar;
