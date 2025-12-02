import React from 'react';
import { Star, ShoppingCart } from 'lucide-react';
import type { Product } from '../../data/products';

interface ProductCardProps {
  product: Product;
  showDiscount?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, showDiscount = false }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  const renderRating = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[...Array(5)].map((_, index) => (
          <Star
            key={index}
            className={`w-4 h-4 ${
              index < Math.floor(rating)
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">({rating})</span>
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-lg transition-shadow duration-200 group relative h-full flex flex-col">
      {/* Discount Badge */}
      {showDiscount && product.discount && (
        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium z-10">
          -{product.discount}%
        </div>
      )}

      {/* Product Image */}
      <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden relative">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
          onError={(e) => {
            // Fallback to placeholder if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const placeholder = target.nextElementSibling as HTMLElement;
            if (placeholder) {
              placeholder.style.display = 'flex';
            }
          }}
        />
        {/* Fallback placeholder */}
        <div className="absolute inset-0 bg-gray-100 items-center justify-center hidden">
          <span className="text-4xl text-gray-400">🎧</span>
        </div>
      </div>

      {/* Product Info */}
      <div className="space-y-2 flex-1 flex flex-col">
        {/* Brand */}
        <p className="text-sm text-gray-500 font-medium">{product.brand}</p>

        {/* Product Name */}
        <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-orange-500 transition-colors">
          {product.name}
        </h3>

        {/* Rating */}
        {renderRating(product.rating)}

        {/* Price */}
        <div className="space-y-1">
          <div className="flex flex-col space-y-1">
            <span className="text-base font-bold text-orange-500 truncate">
              {formatPrice(product.price)}
            </span>
          </div>
        </div>

        {/* Sold Count */}
        <p className="text-sm text-gray-500">
          Đã bán {product.soldCount.toLocaleString()}
        </p>

        {/* Add to Cart Button */}
        <button className="w-full mt-auto bg-orange-500 text-white py-2 px-3 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center space-x-2 text-sm">
          <ShoppingCart className="w-4 h-4" />
          <span>Thêm vào giỏ</span>
        </button>
      </div>
    </div>
  );
};

export default ProductCard;