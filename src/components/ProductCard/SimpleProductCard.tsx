import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../../services/customer/ProductListService';

interface SimpleProductCardProps {
  product: Product;
}

const SimpleProductCard: React.FC<SimpleProductCardProps> = ({ product }) => {
  const navigate = useNavigate();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  const handleClick = () => {
    navigate(`/product/${product.productId}`);
  };

  // Get primary image
  const primaryImage = product.images && product.images.length > 0 
    ? product.images[0] 
    : '/images/placeholder-product.png';

  return (
    <div 
      onClick={handleClick}
      className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-lg transition-shadow duration-200 cursor-pointer group h-full flex flex-col"
    >
      {/* Product Image */}
      <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden relative">
        <img 
          src={primaryImage} 
          alt={product.name} 
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/images/placeholder-product.png';
          }}
        />
      </div>

      {/* Product Info */}
      <div className="flex-1 flex flex-col">
        {/* Product Name */}
        <h3 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 flex-1 group-hover:text-orange-500 transition-colors">
          {product.name}
        </h3>

        {/* Price */}
        <div className="mt-auto">
          {product.discountPrice && product.discountPrice < product.price ? (
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-orange-500">
                  {formatPrice(product.discountPrice)}
                </span>
                {product.promotionPercent && (
                  <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                    -{product.promotionPercent}%
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(product.price)}
              </span>
            </div>
          ) : (
            <span className="text-lg font-bold text-orange-500">
              {formatPrice(product.price)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleProductCard;
