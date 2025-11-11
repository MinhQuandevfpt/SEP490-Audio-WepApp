import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Spin, Empty } from 'antd';
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
  const [isLoading, setIsLoading] = useState(true);
  const [countdown, setCountdown] = useState('00:00:00');

  // Fetch Flash Sale hiện tại
  useEffect(() => {
    const fetchFlashSale = async () => {
      setIsLoading(true);
      try {
        const data = await FlashSaleService.getCurrentFlashSale();
        setFlashSale(data);
      } catch (error) {
        console.error('Error loading flash sale:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFlashSale();
  }, []);

  // Đếm ngược thời gian
  useEffect(() => {
    if (!flashSale?.slot.closeTime) return;

    const updateCountdown = () => {
      const timeStr = FlashSaleService.formatTimeRemaining(flashSale.slot.closeTime);
      setCountdown(timeStr);

      // Kiểm tra nếu hết thời gian → refresh lại
      const remaining = FlashSaleService.calculateTimeRemaining(flashSale.slot.closeTime);
      if (!remaining || remaining.totalSeconds <= 0) {
        // Reload sau 1s để lấy slot tiếp theo
        setTimeout(() => window.location.reload(), 1000);
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spin size="large" />
      </div>
    );
  }

  if (!flashSale || flashSale.products.length === 0) {
    return null; // Không hiển thị gì nếu không có Flash Sale
  }

  return (
    <section className="my-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <Card
          className="shadow-lg"
          bodyStyle={{ padding: 0 }}
        >
          {/* Title Bar */}
          <div className="bg-gradient-to-r from-red-500 to-orange-500 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FireOutlined className="text-white text-3xl animate-pulse" />
              <div>
                <h2 className="text-white text-2xl font-bold m-0">
                  Flash Sale 🔥
                </h2>
                <p className="text-white/90 text-sm m-0">
                  {flashSale.campaign.name}
                </p>
              </div>
            </div>

            {/* Countdown */}
            <div className="flex items-center gap-3">
              <span className="text-white text-sm">Kết thúc sau</span>
              <div className="bg-white/20 backdrop-blur px-4 py-2 rounded-lg">
                <span className="text-white text-2xl font-mono font-bold tracking-wider">
                  {countdown}
                </span>
              </div>
              <Button
                type="primary"
                size="large"
                icon={<RightOutlined />}
                onClick={handleViewAll}
                className="bg-white text-red-500 hover:bg-gray-100 border-0 font-semibold"
              >
                Xem tất cả
              </Button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="p-6">
            {flashSale.products.length === 0 ? (
              <Empty description="Chưa có sản phẩm trong khung giờ này" />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {flashSale.products.map((product) => (
                  <div
                    key={product.campaignProductId}
                    onClick={() => handleProductClick(product.productId)}
                    className="cursor-pointer group"
                  >
                    <Card
                      hoverable
                      cover={
                        <div className="relative aspect-square bg-gray-100 overflow-hidden">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.productName}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              No Image
                            </div>
                          )}
                          {/* Discount Badge */}
                          {product.discountPercent > 0 && (
                            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold">
                              -{product.discountPercent}%
                            </div>
                          )}
                        </div>
                      }
                      className="border-0"
                      bodyStyle={{ padding: '12px' }}
                    >
                      {/* Product Name */}
                      <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-2 min-h-[40px]">
                        {product.productName}
                      </h3>

                      {/* Brand */}
                      <p className="text-xs text-gray-500 mb-2">{product.brandName}</p>

                      {/* Prices */}
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2">
                          <span className="text-red-600 font-bold text-lg">
                            {product.discountedPrice.toLocaleString('vi-VN')}₫
                          </span>
                        </div>
                        {product.discountedPrice < product.originalPrice && (
                          <div className="text-gray-400 text-xs line-through">
                            {product.originalPrice.toLocaleString('vi-VN')}₫
                          </div>
                        )}
                      </div>

                      {/* Progress Bar - Nếu có giới hạn số lượng */}
                      {product.totalUsageLimit > 0 && (
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Đã bán</span>
                            <span>
                              {product.totalUsageLimit - product.remainingUsage}/{product.totalUsageLimit}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all"
                              style={{
                                width: `${
                                  ((product.totalUsageLimit - product.remainingUsage) /
                                    product.totalUsageLimit) *
                                  100
                                }%`
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </section>
  );
};

export default FlashSaleHome;
