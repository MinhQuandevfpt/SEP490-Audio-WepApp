import React from 'react';
import { Grid, List } from 'lucide-react';

interface ProductListViewToggleProps {
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  loading?: boolean;
}

export const ProductListViewToggle: React.FC<ProductListViewToggleProps> = ({
  viewMode,
  onViewModeChange,
  loading = false,
}) => {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onViewModeChange('grid')}
        disabled={loading}
        className={`p-2 rounded disabled:opacity-50 ${viewMode === 'grid' ? 'bg-orange-500 text-white' : 'bg-gray-100'}`}
      >
        <Grid size={20} />
      </button>
      <button
        onClick={() => onViewModeChange('list')}
        disabled={loading}
        className={`p-2 rounded disabled:opacity-50 ${viewMode === 'list' ? 'bg-orange-500 text-white' : 'bg-gray-100'}`}
      >
        <List size={20} />
      </button>
    </div>
  );
};

export default ProductListViewToggle;
