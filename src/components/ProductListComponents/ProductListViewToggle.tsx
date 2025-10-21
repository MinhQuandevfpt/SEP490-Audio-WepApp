import React from 'react';
import { Grid3X3, List } from 'lucide-react';

interface ProductListViewToggleProps {
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  loading?: boolean;
}

const ProductListViewToggle: React.FC<ProductListViewToggleProps> = ({
  viewMode,
  onViewModeChange,
  loading = false,
}) => {
  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => onViewModeChange('grid')}
        disabled={loading}
        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          viewMode === 'grid'
            ? 'bg-white text-orange-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title="Xem dạng lưới"
      >
        <Grid3X3 className="w-4 h-4" />
        <span className="hidden sm:inline">Lưới</span>
      </button>
      <button
        onClick={() => onViewModeChange('list')}
        disabled={loading}
        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
          viewMode === 'list'
            ? 'bg-white text-orange-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title="Xem dạng danh sách"
      >
        <List className="w-4 h-4" />
        <span className="hidden sm:inline">Danh sách</span>
      </button>
    </div>
  );
};

export default ProductListViewToggle;
