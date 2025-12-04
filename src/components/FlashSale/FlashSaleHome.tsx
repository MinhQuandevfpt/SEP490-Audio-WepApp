import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Empty, Button } from 'antd';
import { FireOutlined, RightOutlined } from '@ant-design/icons';
import { FlashSaleService } from '../../services/customer/FlashSaleService';
import type { CurrentFlashSaleSlot } from '../../types/flashsale';

/**
 * FlashSaleHome Component
 * Hiển thị Flash Sale hiện tại trên trang Home
 * - Đồng hồ đếm ngược
 * - 15 sản phẩm đầu tiên
 * - Nút "Xem tất cả"
 */
const FlashSaleHome: React.FC = () => {
  const navigate = useNavigate();
  const [flashSale, setFlashSale] = useState<CurrentFlashSaleSlot | null>(null);
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });

  // Fetch Flash Sale hiện tại
  useEffect(() => {
    const fetchFlashSale = async () => {
      try {
        const data = await FlashSaleService.getCurrentFlashSale();
        setFlashSale(data);
      } catch (error) {
        console.error('Error loading flash sale:', error);
      }
    };

    fetchFlashSale();
  }, []);

  // Đếm ngược thời gian
  useEffect(() => {
    if (!flashSale?.slot.closeTime) return;

    const updateCountdown = () => {
      const remaining = FlashSaleService.calculateTimeRemaining(flashSale.slot.closeTime);
      
      if (!remaining || remaining.totalSeconds <= 0) {
        // Reload sau 1s để lấy slot tiếp theo
        setTimeout(() => window.location.reload(), 1000);
        setCountdown({ hours: 0, minutes: 0, seconds: 0 });
      } else {
        setCountdown({
          hours: remaining.hours,
          minutes: remaining.minutes,
          seconds: remaining.seconds
        });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [flashSale]);

  // Navigate đến trang detail
  const handleViewAll = () => {
    if (!flashSale) return;
    navigate(`/flash-sale/${flashSale.campaign.id}`, {
      state: { slotId: flashSale.slot.id }
    });
  };

  // Navigate đến product detail
  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  // Không hiển thị loading spinner - render ngay
  if (!flashSale || flashSale.products.length === 0) {
    return null; // Không hiển thị gì nếu không có Flash Sale
  }

  return (
    <section className="my-8 bg-white">
      <div className="container mx-auto px-4">
        {/* Header với countdown */}
        <div className="bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 rounded-t-lg px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Title */}
            <div className="flex items-center gap-3">
              <FireOutlined className="text-white text-3xl animate-pulse" />
              <div>
                <h2 className="text-white text-2xl font-bold m-0 flex items-center gap-2">
                  Flash Sale
                  {flashSale.campaign.badgeIconUrl && (
                    <img 
                      src={flashSale.campaign.badgeIconUrl} 
                      alt="badge" 
                      className="w-8 h-8 object-contain"
                    />
                  )}
                </h2>
              </div>
            </div>

            {/* Center: Countdown Timer */}
            <div className="flex items-center gap-3">
              <span className="text-white text-base font-medium">Kết thúc trong</span>
              <div className="flex items-center gap-2">
                <TimeBox value={String(countdown.hours).padStart(2, '0')} />
                <span className="text-white text-xl font-bold">:</span>
                <TimeBox value={String(countdown.minutes).padStart(2, '0')} />
                <span className="text-white text-xl font-bold">:</span>
                <TimeBox value={String(countdown.seconds).padStart(2, '0')} />
              </div>
            </div>

            {/* Right: View All Button */}
            <Button
              type="text"
              size="large"
              onClick={handleViewAll}
              className="text-white hover:text-white hover:bg-white/20 border-0 font-semibold flex items-center gap-2"
            >
              Xem tất cả
              <RightOutlined />
            </Button>
          </div>
        </div>

        {/* Products Grid */}
        <div className="bg-white border border-t-0 border-gray-200 rounded-b-lg p-4">
          {flashSale.products.length === 0 ? (
            <Empty description="Chưa có sản phẩm trong khung giờ này" />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {flashSale.products.map((product) => {
                return (
                  <div
                    key={product.campaignProductId}
                    onClick={() => handleProductClick(product.productId)}
                    className="cursor-pointer group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-red-300"
                  >
                    {/* Product Image */}
                    <div className="relative aspect-square bg-gray-50 overflow-hidden">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.productName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                          No Image
                        </div>
                      )}
                      
                      {/* Discount Badge */}
                      {product.discountPercent > 0 && (
                        <div className="absolute top-0 left-0 bg-red-500 text-white px-2 py-1 text-xs font-bold rounded-br-lg">
                          -{product.discountPercent}%
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-3">
                      {/* Price */}
                      <div className="mb-2">
                        {product.discountedPrice && product.discountedPrice > 0 ? (
                          <>
                            <div className="text-red-600 font-bold text-lg">
                              {product.discountedPrice.toLocaleString('vi-VN')}₫
                            </div>
                            {product.originalPrice && product.originalPrice > 0 && product.discountedPrice < product.originalPrice && (
                              <div className="text-gray-400 text-xs line-through">
                                {product.originalPrice.toLocaleString('vi-VN')}₫
                              </div>
                            )}
                          </>
                        ) : product.originalPrice && product.originalPrice > 0 ? (
                          <div className="text-red-600 font-bold text-lg">
                            {product.originalPrice.toLocaleString('vi-VN')}₫
                          </div>
                        ) : (
                          <div className="text-orange-600 font-bold text-sm">Liên hệ</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

/**
 * Time Box Component - Hiển thị từng số trong đồng hồ đếm ngược
 */
const TimeBox: React.FC<{ value: string }> = ({ value }) => {
  return (
    <div className="bg-white/20 backdrop-blur-sm rounded-md px-3 py-2 min-w-[50px] flex items-center justify-center">
      <span className="text-white text-2xl font-bold font-mono">
        {value}
      </span>
    </div>
  );
};

export default React.memo(FlashSaleHome);
