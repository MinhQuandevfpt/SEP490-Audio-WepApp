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
      className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-lg transition-shadow duration-200 cursor-pointer group flex flex-col"
      style={{ height: '310px' }} // Giảm height để gọn hơn
    >
      {/* Product Image */}
      <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden relative flex-shrink-0">
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

      {/* Product Info - Fixed structure */}
      <div className="flex flex-col flex-1">
        {/* Product Name - Always 2 lines height */}
        <h3 
          className="text-sm font-medium text-gray-900 mb-2 overflow-hidden"
          style={{ 
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            minHeight: '2.5rem', // 2 lines minimum
            lineHeight: '1.25rem'
          }}
        >
          {product.name}
        </h3>

        {/* Price Section - Reduced spacing */}
        <div className="mt-1">
          {product.finalPrice && product.finalPrice < product.price ? (
            <div className="space-y-1">
              {/* Discounted Price - Red color when has discount */}
              <div className="text-xl font-bold text-red-600">
                {formatPrice(product.finalPrice)}
              </div>
              
              {/* Original Price - On same line */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 line-through">
                  {formatPrice(product.price)}
                </span>
              </div>
            </div>
          ) : (
            // Giá gốc khi không giảm - màu cam
            <div className="text-xl font-bold text-orange-500">
              {formatPrice(product.price)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleProductCard;
