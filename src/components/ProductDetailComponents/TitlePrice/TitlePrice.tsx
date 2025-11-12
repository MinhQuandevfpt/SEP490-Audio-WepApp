import React from 'react';
import { Star } from 'lucide-react';

interface TitlePriceProps {
  name: string;
  brand: string;
  rating: number;
  reviewsCount: number;
  soldCount: number;
  price: number;
  salePrice?: number;
  discountPercent?: number; // Override calculated discount
  campaignBadge?: { label: string; color: string } | null;
  shortDescription?: string;
}

const toVnd = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const TitlePrice: React.FC<TitlePriceProps> = ({ 
  name, 
  brand, 
  rating, 
  reviewsCount, 
  soldCount, 
  price, 
  salePrice, 
  discountPercent: providedDiscount,
  shortDescription 
}) => {
  const finalPrice = salePrice ?? price;
  const discount = providedDiscount || (salePrice ? Math.round((1 - salePrice / price) * 100) : 0);
  
  return (
    <div>
      <h1 className="text-[24px] md:text-[28px] font-bold text-gray-900 leading-snug">
        {name}
      </h1>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
        <span>
          Thương hiệu: <span className="font-medium text-gray-900">{brand}</span>
        </span>
        <span className="hidden sm:inline h-4 w-px bg-gray-300" />
        <span className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-500" /> {rating.toFixed(1)} ({reviewsCount.toLocaleString('vi-VN')}+ đánh giá)
        </span>
        <span className="hidden sm:inline h-4 w-px bg-gray-300" />
        <span className="flex items-center gap-1"><span className="text-red-500">🔥</span> Bán chạy {soldCount.toLocaleString('vi-VN')}+</span>
      </div>
      <div className="mt-3 text-sm text-gray-600 leading-relaxed">
        {shortDescription}
      </div>
      
      {/* Price Section - Horizontal aligned */}
      <div className="mt-4 flex items-center gap-4">
        {salePrice && salePrice < price ? (
          <>
            {/* Discounted Price - Red when has discount */}
            <div className="text-[32px] font-extrabold text-red-600">
              {toVnd(finalPrice)}
            </div>
            
            {/* Original Price */}
            <div className="text-[18px] text-gray-400 line-through">
              {toVnd(price)}
            </div>
            
            {/* Discount Percentage - Blue */}
            <div className="text-base font-semibold bg-blue-100 text-blue-600 px-3 py-1 rounded">
              -{discount}%
            </div>
          </>
        ) : (
          /* Original Price - Orange when no discount */
          <div className="text-[32px] font-extrabold text-orange-500">
            {toVnd(price)}
          </div>
        )}
      </div>
    </div>
  );
};

export default TitlePrice;


