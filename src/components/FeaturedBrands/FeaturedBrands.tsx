import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { featuredBrands } from '../../data/brands';

const FeaturedBrands: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Star className="w-7 h-7 text-orange-500" />
          <h2 className="text-2xl font-bold text-gray-900">Thương hiệu nổi bật</h2>
        </div>
        
        {/* <button className="flex items-center space-x-2 text-orange-500 hover:text-orange-600 font-medium">
          <span>Xem tất cả</span>
          <ArrowRight className="w-4 h-4" />
        </button> */}
      </div>

      {/* Brands Grid - 2 rows x 6 brands */}
      <div className="grid grid-cols-6 gap-4">
        {featuredBrands.map((brand) => (
          <button
            key={brand.id}
            onClick={() => navigate(`/products?brandName=${encodeURIComponent(brand.name)}`)}
            className="group text-center"
          >
            {/* Brand Logo */}
            <div className="w-16 h-16 mx-auto mb-3 bg-white rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow overflow-hidden">
              <img 
                src={brand.logo} 
                alt={brand.name}
                className="w-full h-full object-contain hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              {/* Fallback */}
           
            </div>
            
            {/* Brand Name */}
            <span className="text-sm font-medium text-gray-700 group-hover:text-orange-500 transition-colors">
              {brand.name}
            </span>
          </button>
        ))}
      </div>

      {/* Additional Brand Info */}
      <div className="mt-6 bg-gradient-to-r from-blue-50 to-orange-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">
              Ưu đãi từ thương hiệu
            </h3>
            <p className="text-sm text-gray-600">
              Giảm giá đặc biệt từ các thương hiệu uy tín
            </p>
          </div>
          <button className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-medium">
            Khám phá
          </button>
        </div>
      </div>
    </div>
  );
};

export default FeaturedBrands;