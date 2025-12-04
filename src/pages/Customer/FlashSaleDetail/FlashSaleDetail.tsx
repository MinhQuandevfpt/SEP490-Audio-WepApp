import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Card, Spin, Empty } from 'antd';
import { FlashSaleService } from '../../../services/customer/FlashSaleService';
import type { FlashSaleCampaign, FlashSaleSlot, FlashSaleProduct } from '../../../types/flashsale';
import Header from '../../../components/Header/Header';

/**
 * FlashSaleDetail Page
 * Hiển thị chi tiết Flash Sale với các khung giờ
 * Route: /flash-sale/:campaignId
 */
const FlashSaleDetail: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState<FlashSaleCampaign | null>(null);
  const [slots, setSlots] = useState<FlashSaleSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<FlashSaleSlot | null>(null);
  const [products, setProducts] = useState<FlashSaleProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [countdown, setCountdown] = useState('00:00:00');

  // Load campaign và slots
  useEffect(() => {
    const fetchCampaign = async () => {
      if (!campaignId) return;

      setIsLoading(true);
      try {
        // Lấy tất cả campaigns
        const campaigns = await FlashSaleService.getAllFlashSales();
        const foundCampaign = campaigns.find((c: FlashSaleCampaign) => c.id === campaignId);

        if (!foundCampaign) {
          throw new Error('Không tìm thấy chiến dịch Flash Sale');
        }

        setCampaign(foundCampaign);

        // Sắp xếp slots theo thời gian
        const sortedSlots = [...foundCampaign.slots].sort((a, b) => {
          return new Date(a.openTime).getTime() - new Date(b.openTime).getTime();
        });
        setSlots(sortedSlots);

        // Tự động chọn slot từ state hoặc slot đang active
        const stateSlotId = (location.state as any)?.slotId;
        let initialSlot: FlashSaleSlot | null = null;

        if (stateSlotId) {
          initialSlot = sortedSlots.find(s => s.id === stateSlotId) || null;
        }

        if (!initialSlot) {
          // Tìm slot đang active
          initialSlot = sortedSlots.find(slot => FlashSaleService.isSlotActive(slot)) || null;
        }

        if (!initialSlot && sortedSlots.length > 0) {
          // Fallback: chọn slot đầu tiên
          initialSlot = sortedSlots[0];
        }

        if (initialSlot) {
          setSelectedSlot(initialSlot);
        }
      } catch (error: any) {
        console.error('Error loading campaign:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampaign();
  }, [campaignId, location.state]);

  // Load products khi chọn slot
  useEffect(() => {
    const fetchProducts = async () => {
      if (!campaignId || !selectedSlot) return;

      setIsLoadingProducts(true);
      try {
        const productList = await FlashSaleService.getSlotProducts(
          campaignId,
          selectedSlot.id,
          'ONGOING'
        );
        // Chỉ lấy sản phẩm đã được admin duyệt
        // Status có thể là 'APPROVE' (đã duyệt) hoặc 'ACTIVE' (đã duyệt và đang chạy)
        const approvedProducts = productList.filter(product => 
          product.status === 'APPROVE' || product.status === 'ACTIVE'
        );
        
        console.log('🔍 Flash Sale Detail Products Filter:', {
          total: productList.length,
          approved: approvedProducts.length,
          statuses: productList.map(p => ({ id: p.productId, name: p.productName, status: p.status }))
        });
        // Enrich products with images (similar to FlashSaleHome)
        console.log('📦 Products before enriching:', approvedProducts.length);
        const enrichedProducts = await FlashSaleService.enrichProductsWithImages(approvedProducts);
        console.log('✅ Products after enriching:', enrichedProducts.length);
        console.log('🖼️ Sample product imageUrl:', enrichedProducts[0]?.imageUrl);
        setProducts(enrichedProducts);
      } catch (error: any) {
        console.error('Error loading products:', error);
        setProducts([]);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [campaignId, selectedSlot]);

  // Countdown cho slot đang active
  useEffect(() => {
    if (!selectedSlot || !FlashSaleService.isSlotActive(selectedSlot)) {
      setCountdown('00:00:00');
      return;
    }

    const updateCountdown = () => {
      const timeStr = FlashSaleService.formatTimeRemaining(selectedSlot.closeTime);
      setCountdown(timeStr);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [selectedSlot]);

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

  if (!campaign) {
    return (
      <div className="container mx-auto px-4 py-20">
        <Empty description="Không tìm thấy chiến dịch Flash Sale" />
      </div>
    );
  }

  return (
    <>
      {/* Header giống trang home */}
      <Header />
      
      {/* Flash Sale Banner với countdown */}
      <div className="bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-20 w-32 h-32 bg-yellow-300 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-20 w-40 h-40 bg-yellow-400 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-orange-300 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
          <div className="flex items-center justify-center gap-12">
            {/* Left: Flash Sale Logo */}
            <div className="flex items-center gap-3">
              <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 2v11h3v9l7-12h-4l4-8z"/>
              </svg>
              <h1 className="text-5xl font-bold uppercase tracking-wider text-white">
                Flash Sale
              </h1>
            </div>

            {/* Center: KẾT THÚC TRONG text */}
            {selectedSlot && FlashSaleService.isSlotActive(selectedSlot) && countdown !== '00:00:00' && (
              <div className="flex items-center gap-2 text-white">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                </svg>
                <span className="text-xl uppercase font-bold tracking-wide">
                  KẾT THÚC TRONG
                </span>
              </div>
            )}

            {/* Right: Countdown Timer */}
            {selectedSlot && FlashSaleService.isSlotActive(selectedSlot) && countdown !== '00:00:00' && (
              <div className="flex items-center gap-3">
                {countdown.split(':').map((unit, index) => (
                  <React.Fragment key={index}>
                    <div className="bg-black bg-opacity-50 backdrop-blur-sm rounded-lg px-5 py-4 min-w-[80px] shadow-2xl border-2 border-white border-opacity-30">
                      <div className="text-white text-5xl font-bold text-center font-mono">
                        {unit}
                      </div>
                    </div>
                    {index < 2 && (
                      <span className="text-white text-4xl font-bold opacity-80">:</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Time Slots Section */}
      <div className="bg-white border-b-2 border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-6 py-4">
            {slots
              .filter(slot => new Date(slot.closeTime) >= new Date()) // Chỉ lấy slots chưa kết thúc
              .slice(0, 4) // Chỉ hiện 4 slots
              .map((slot) => {
              const isActive = FlashSaleService.isSlotActive(slot);
              const isSelected = selectedSlot?.id === slot.id;
              const isTomorrow = FlashSaleService.isSlotTomorrow(slot);
              
              return (
                <button
                  key={slot.id}
                  onClick={() => setSelectedSlot(slot)}
                  className={`flex-shrink-0 text-center px-6 py-3 rounded-lg transition-all duration-200 ${
                    isSelected
                      ? 'bg-orange-500 text-white shadow-lg scale-105'
                      : isActive
                      ? 'bg-red-50 text-red-600 border-2 border-red-500'
                      : 'bg-gray-50 text-gray-700 hover:bg-orange-50'
                  }`}
                >
                  <div className="text-2xl font-bold mb-1">
                    {FlashSaleService.formatSlotTime(slot.openTime)}
                  </div>
                  <div className="text-xs font-medium">
                    {isActive && isSelected && 'Đang Diễn Ra'}
                    {isActive && !isSelected && 'Đang Diễn Ra'}
                    {!isActive && !isTomorrow && 'Sắp Diễn Ra'}
                    {isTomorrow && 'Tomorrow'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="bg-gray-50 min-h-screen py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Products Grid */}
          {isLoadingProducts ? (
            <div className="flex justify-center py-20">
              <Spin size="large" />
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-lg p-12">
              <Empty description="Chưa có sản phẩm trong khung giờ này" />
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-600">
                Hiển thị <span className="font-semibold text-orange-600">{products.length}</span> sản phẩm
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {products.map(product => (
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
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`w-full h-full flex items-center justify-center bg-gray-50 ${product.imageUrl ? 'hidden' : ''}`}>
                          <span className="text-4xl text-gray-300">🎧</span>
                        </div>
                        {product.discountPercent > 0 && (
                          <div className="absolute top-0 right-0 bg-yellow-400 text-red-600 px-3 py-1 text-xs font-bold shadow-md">
                            {product.discountPercent}% GIẢM
                          </div>
                        )}
                      </div>
                    }
                    className="border-0 shadow-sm hover:shadow-lg transition-shadow"
                    bodyStyle={{ padding: '12px' }}
                  >
                    <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-2 min-h-[40px]">
                      {product.productName}
                    </h3>
                    <div className="flex items-baseline gap-2">
                      {product.discountedPrice && product.discountedPrice > 0 ? (
                        <>
                          <div className="text-red-600 font-bold text-lg">
                            ₫{product.discountedPrice.toLocaleString('vi-VN')}
                          </div>
                          {product.originalPrice && product.originalPrice > 0 && product.discountedPrice < product.originalPrice && (
                            <div className="text-gray-400 text-xs line-through">
                              ₫{product.originalPrice.toLocaleString('vi-VN')}
                            </div>
                          )}
                        </>
                      ) : product.originalPrice && product.originalPrice > 0 ? (
                        <div className="text-red-600 font-bold text-lg">
                          ₫{product.originalPrice.toLocaleString('vi-VN')}
                        </div>
                      ) : (
                        <div className="text-red-600 font-bold text-sm">Liên hệ</div>
                      )}
                    </div>
                  </Card>
                </div>
              ))}
            </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default FlashSaleDetail;
