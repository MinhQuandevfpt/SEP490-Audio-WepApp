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
  shortDescription?: string;
}

const toVnd = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

const TitlePrice: React.FC<TitlePriceProps> = ({ name, brand, rating, reviewsCount, soldCount, price, salePrice, shortDescription }) => {
  const finalPrice = salePrice ?? price;
  const discount = salePrice ? Math.round((1 - salePrice / price) * 100) : 0;
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
      <div className="mt-4 flex items-end gap-3">
        <div className="text-[28px] font-extrabold" style={{ color: '#E63946' }}>{toVnd(finalPrice)}</div>
        {salePrice && (
          <>
            <div className="text-[#888] line-through text-[16px]">{toVnd(price)}</div>
            <div className="text-xs md:text-sm font-semibold text-white px-2 py-0.5 rounded" style={{ backgroundColor: '#FF5C00' }}>-{discount}%</div>
          </>
        )}
      </div>
    </div>
  );
};

export default TitlePrice;


