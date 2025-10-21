import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import { topDealProducts } from '../../data/products';
import ProductCard from '../ProductCard';

const TopDeals: React.FC = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerPage = 4;

  const nextSlide = () => {
    setCurrentIndex(prev => 
      prev + itemsPerPage >= topDealProducts.length ? 0 : prev + itemsPerPage
    );
  };

  const prevSlide = () => {
    setCurrentIndex(prev => 
      prev === 0 ? Math.max(0, topDealProducts.length - itemsPerPage) : prev - itemsPerPage
    );
  };

  const visibleProducts = topDealProducts.slice(currentIndex, currentIndex + itemsPerPage);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Trophy className="w-7 h-7 text-yellow-500" />
          <h2 className="text-2xl font-bold text-gray-900">Top Deals</h2>
          <span className="bg-yellow-100 text-yellow-800 text-sm px-3 py-1 rounded-full font-medium">
            Giá tốt nhất
          </span>
        </div>

        {/* Navigation */}
        <div className="flex items-center space-x-2">
          <button
            onClick={prevSlide}
            disabled={currentIndex === 0}
            className="p-2 rounded-full border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            disabled={currentIndex + itemsPerPage >= topDealProducts.length}
            className="p-2 rounded-full border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {visibleProducts.map((product) => (
          <ProductCard 
            key={product.id} 
            product={product} 
            showDiscount={true}
          />
        ))}
      </div>

      {/* View All Button */}
      <div className="text-center mt-6">
        <button 
          onClick={() => navigate('/products?status=ACTIVE')}
          className="bg-yellow-500 text-white px-8 py-3 rounded-lg hover:bg-yellow-600 transition-colors font-medium"
        >
          Xem tất cả Top Deals
        </button>
      </div>
    </div>
  );
};

export default TopDeals;