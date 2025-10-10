import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { flashSaleProducts } from '../../data/products';

// Simple Flash Sale Product Card
const FlashSaleCard: React.FC<{ product: any }> = ({ product }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  return (
    <div className="relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      {/* Discount Badge */}
      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium z-10">
        -{product.discount}%
      </div>

      {/* Product Image */}
      <div className="aspect-square bg-gray-50">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-contain hover:scale-105 transition-transform duration-200"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
        {/* Fallback */}
        <div className="hidden w-full h-full bg-gray-100 items-center justify-center">
          <span className="text-3xl text-gray-400">🎧</span>
        </div>
      </div>

      {/* Price */}
      <div className="p-3">
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-lg font-bold text-red-500">
            {formatPrice(product.price)}
          </span>
         
        </div>

        {/* Status */}
        <div className="bg-red-50 text-red-600 text-xs px-2 py-1 rounded-full text-center font-medium">
          Vừa mở bán
        </div>
      </div>
    </div>
  );
};

const FlashSale: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState({
    hours: 1,
    minutes: 26,
    seconds: 19
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const itemsPerPage = 6; 

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Special pagination logic
  const getVisibleProducts = () => {
    const currentPage = Math.floor(currentIndex / itemsPerPage) + 1;
    
    if (currentPage === 4) {
      // Trang 4: Hiển thị sản phẩm 15-20 (4 cũ + 2 mới)
      // Index 14-19 (fs15 đến fs20)
      return flashSaleProducts.slice(14, 20);
    } else {
      // Trang 1-3: Logic thông thường
      return flashSaleProducts.slice(currentIndex, currentIndex + itemsPerPage);
    }
  };

  // Navigation logic với xử lý đặc biệt
  const nextSlide = () => {
    const currentPage = Math.floor(currentIndex / itemsPerPage) + 1;
    
    if (currentPage < 3) {
      // Trang 1-2: chuyển bình thường
      setCurrentIndex(prev => prev + itemsPerPage);
    } else if (currentPage === 3) {
      // Từ trang 3 chuyển đến trang 4 (đặc biệt)
      setCurrentIndex(18); // Đặt index để trang 4 được tính
    }
  };

  const prevSlide = () => {
    const currentPage = Math.floor(currentIndex / itemsPerPage) + 1;
    
    if (currentPage === 4) {
      // Từ trang 4 về trang 3
      setCurrentIndex(12); // Trang 3 bắt đầu từ index 12
    } else if (currentPage > 1) {
      // Trang 2-3: quay lại bình thường
      setCurrentIndex(prev => Math.max(0, prev - itemsPerPage));
    }
  };

  // Get visible products
  const visibleProducts = getVisibleProducts();

  // Check if navigation is possible
  const currentPage = Math.floor(currentIndex / itemsPerPage) + 1;
  const canGoPrev = currentPage > 1;
  const canGoNext = currentPage < 4;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900">Flash Sale</h2>
          
          {/* Countdown Timer */}
          <div className="flex items-center space-x-2">
            <div className="bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
              {String(timeLeft.hours).padStart(2, '0')}
            </div>
            <span className="text-gray-500">:</span>
            <div className="bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
              {String(timeLeft.minutes).padStart(2, '0')}
            </div>
            <span className="text-gray-500">:</span>
            <div className="bg-red-500 text-white px-2 py-1 rounded text-sm font-bold">
              {String(timeLeft.seconds).padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* View All Button */}
        <button className="text-blue-500 hover:text-blue-600 font-medium">
          Xem tất cả
        </button>
      </div>

      {/* Products Container with Overlay Navigation */}
      <div className="relative">
        {/* Products Grid */}
        <div className="grid grid-cols-6 gap-4">
          {visibleProducts.map((product) => (
            <FlashSaleCard key={product.id} product={product} />
          ))}
        </div>

        {/* Previous Button - Overlay on first product */}
        {canGoPrev && (
          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all duration-200 border border-gray-200"
          >
            <ChevronLeft className="w-5 h-5 text-blue-700" />
          </button>
        )}

        {/* Next Button - Overlay on last product */}
        {canGoNext && (
          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 z-10 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 shadow-lg transition-all duration-200 border border-gray-200"
          >
            <ChevronRight className="w-5 h-5 text-blue-700" />
          </button>
        )}
      </div>
    </div>
  );
};

export default FlashSale;