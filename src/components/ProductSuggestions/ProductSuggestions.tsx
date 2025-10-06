import React, { useState } from 'react';
import { Lightbulb, Grid3X3, List, Filter } from 'lucide-react';
import { regularProducts } from '../../data/products';
import ProductCard from '../ProductCard';

const ProductSuggestions: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAll, setShowAll] = useState(false);
  const [sortBy, setSortBy] = useState<'popular' | 'price-low' | 'price-high' | 'rating'>('popular');

  const itemsPerPage = 8;
  const displayProducts = showAll ? regularProducts : regularProducts.slice(0, itemsPerPage);

  // Sort products based on selected option
  const sortedProducts = [...displayProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return b.rating - a.rating;
      case 'popular':
      default:
        return b.soldCount - a.soldCount;
    }
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Lightbulb className="w-7 h-7 text-yellow-500" />
          <h2 className="text-2xl font-bold text-gray-900">Gợi ý sản phẩm hôm nay</h2>
        </div>
        
        {/* View Controls */}
        <div className="flex items-center space-x-4">
          {/* Sort Dropdown */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
            >
              <option value="popular">Phổ biến</option>
              <option value="price-low">Giá thấp đến cao</option>
              <option value="price-high">Giá cao đến thấp</option>
              <option value="rating">Đánh giá cao</option>
            </select>
          </div>
          
          {/* View Mode Toggle */}
          <div className="flex items-center space-x-1 border border-gray-300 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded ${viewMode === 'grid' ? 'bg-orange-500 text-white' : 'text-gray-500'}`}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1 rounded ${viewMode === 'list' ? 'bg-orange-500 text-white' : 'text-gray-500'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Products Grid/List */}
      <div className={`${
        viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4' 
          : 'space-y-4'
      }`}>
        {sortedProducts.map((product) => (
          <div key={product.id} className={viewMode === 'list' ? 'border-b border-gray-100 pb-4 last:border-b-0' : ''}>
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {/* Load More / Show Less */}
      <div className="text-center mt-8">
        {!showAll ? (
          <button
            onClick={() => setShowAll(true)}
            className="bg-orange-500 text-white px-8 py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium"
          >
            Xem thêm sản phẩm ({regularProducts.length - itemsPerPage} sản phẩm)
          </button>
        ) : (
          <button
            onClick={() => setShowAll(false)}
            className="bg-gray-500 text-white px-8 py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium"
          >
            Thu gọn
          </button>
        )}
      </div>

      {/* Additional Info */}
      <div className="mt-6 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-4">
        <div className="text-center">
          <p className="text-gray-600 mb-2">
            Có <span className="font-bold text-orange-600">{regularProducts.length}</span> sản phẩm được gợi ý cho bạn
          </p>
          <p className="text-sm text-gray-500">
            Dựa trên sở thích và lịch sử mua hàng của bạn
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductSuggestions;