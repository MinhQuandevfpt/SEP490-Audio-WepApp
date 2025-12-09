import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../../services/customer/ProductListService';

interface SimpleProductCardProps {
  product: Product;
}

const SimpleProductCard: React.FC<SimpleProductCardProps> = ({ product }) => {
  const navigate = useNavigate();

  const formatPrice = (price: number | null) => {
    if (price === null || price === undefined) return '0đ';
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
      className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer group flex flex-col h-full"
    >
      {/* Product Image */}
      <div className="aspect-square bg-gray-100 overflow-hidden relative flex-shrink-0">
        <img 
          src={primaryImage} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = '/images/placeholder-product.png';
          }}
        />
      </div>

      {/* Product Info - Fixed structure with padding */}
      <div className="flex flex-col flex-1 p-3">
        {/* Product Name - Always 2 lines height */}
        <h3 
          className="text-sm font-medium text-gray-900 mb-2 overflow-hidden"
          style={{ 
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            height: '2.5rem', // Fixed 2 lines
            lineHeight: '1.25rem'
          }}
        >
          {product.name}
        </h3>

        {/* Price Section - Compact layout */}
        <div className="mt-auto">
          {product.finalPrice !== null && product.price !== null && product.finalPrice < product.price ? (
            <div>
              {/* Discounted Price - Red color when has discount */}
              <div className="text-lg font-bold text-red-600 truncate">
                {formatPrice(product.finalPrice)}
              </div>
              
              {/* Original Price - Smaller */}
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-xs text-gray-400 line-through truncate">
                  {formatPrice(product.price)}
                </span>
              </div>
            </div>
          ) : (
            // Giá gốc khi không giảm - màu cam
            <div className="text-lg font-bold text-orange-500 truncate">
              {formatPrice(product.price ?? product.finalPrice ?? 0)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleProductCard;
