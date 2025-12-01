import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Card, Button, Spin, Empty, Tag, Breadcrumb } from 'antd';
import { FireOutlined, ClockCircleOutlined, HomeOutlined } from '@ant-design/icons';
import { FlashSaleService } from '../../../services/customer/FlashSaleService';
import type { FlashSaleCampaign, FlashSaleSlot, FlashSaleProduct } from '../../../types/flashsale';

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

  // Nhóm slots theo hôm nay/ngày mai
  const groupedSlots = useMemo(() => {
    const today: FlashSaleSlot[] = [];
    const tomorrow: FlashSaleSlot[] = [];

    slots.forEach(slot => {
      if (FlashSaleService.isSlotTomorrow(slot)) {
        tomorrow.push(slot);
      } else {
        today.push(slot);
      }
    });

    return { today, tomorrow };
  }, [slots]);

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
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-4">
          <Breadcrumb.Item>
            <HomeOutlined />
          </Breadcrumb.Item>
          <Breadcrumb.Item>
            <a href="/">Trang chủ</a>
          </Breadcrumb.Item>
          <Breadcrumb.Item>Flash Sale</Breadcrumb.Item>
          <Breadcrumb.Item>{campaign.name}</Breadcrumb.Item>
        </Breadcrumb>

        {/* Campaign Header */}
        <Card className="mb-6 shadow-md">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
              <FireOutlined className="text-white text-3xl" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-800 mb-1">{campaign.name}</h1>
              <p className="text-gray-600">{campaign.description}</p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span>
                  <ClockCircleOutlined className="mr-1" />
                  {new Date(campaign.startTime).toLocaleDateString('vi-VN')} -{' '}
                  {new Date(campaign.endTime).toLocaleDateString('vi-VN')}
                </span>
                <Tag color={campaign.status === 'ACTIVE' ? 'success' : 'default'}>
                  {campaign.status === 'ACTIVE' ? 'Đang diễn ra' : campaign.status}
                </Tag>
              </div>
            </div>

            {/* Countdown nếu slot active */}
            {selectedSlot && FlashSaleService.isSlotActive(selectedSlot) && countdown !== '00:00:00' && (
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Kết thúc sau</div>
                <div className="bg-red-500 text-white px-6 py-3 rounded-lg">
                  <span className="text-3xl font-mono font-bold">{countdown}</span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Slot Tabs */}
        <Card className="mb-6 shadow-md">
          <div className="border-b border-gray-200 pb-4 mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Khung giờ Flash Sale</h2>
          </div>

          {/* Today's Slots */}
          {groupedSlots.today.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-600 mb-3">Hôm nay</h3>
              <div className="flex flex-wrap gap-3">
                {groupedSlots.today.map(slot => {
                  const isActive = FlashSaleService.isSlotActive(slot);
                  const isSelected = selectedSlot?.id === slot.id;
                  const statusLabel = FlashSaleService.getSlotStatusLabel(slot);

                  return (
                    <Button
                      key={slot.id}
                      type={isSelected ? 'primary' : 'default'}
                      size="large"
                      onClick={() => setSelectedSlot(slot)}
                      className={`
                        min-w-[120px] h-auto py-3
                        ${isActive ? 'border-red-500 bg-red-50' : ''}
                        ${isSelected && !isActive ? 'bg-blue-500 text-white' : ''}
                      `}
                    >
                      <div className="flex flex-col items-center">
                        <div className="text-lg font-bold">
                          {FlashSaleService.formatSlotTime(slot.openTime)}
                        </div>
                        <div className="text-xs mt-1">
                          {isActive && <Tag color="red">Đang diễn ra</Tag>}
                          {!isActive && statusLabel !== 'Đã kết thúc' && (
                            <Tag color="blue">{statusLabel}</Tag>
                          )}
                          {statusLabel === 'Đã kết thúc' && <Tag color="default">Đã kết thúc</Tag>}
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tomorrow's Slots */}
          {groupedSlots.tomorrow.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-3">Ngày mai</h3>
              <div className="flex flex-wrap gap-3">
                {groupedSlots.tomorrow.map(slot => {
                  const isSelected = selectedSlot?.id === slot.id;

                  return (
                    <Button
                      key={slot.id}
                      type={isSelected ? 'primary' : 'default'}
                      size="large"
                      onClick={() => setSelectedSlot(slot)}
                      className="min-w-[120px] h-auto py-3"
                    >
                      <div className="flex flex-col items-center">
                        <div className="text-lg font-bold">
                          {FlashSaleService.formatSlotTime(slot.openTime)}
                        </div>
                        <div className="text-xs mt-1">
                          <Tag color="cyan">Ngày mai</Tag>
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        {/* Products List */}
        <Card className="shadow-md">
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-800">
              Sản phẩm trong khung giờ{' '}
              {selectedSlot && FlashSaleService.formatSlotTime(selectedSlot.openTime)}
            </h2>
          </div>

          {isLoadingProducts ? (
            <div className="flex justify-center py-20">
              <Spin size="large" />
            </div>
          ) : products.length === 0 ? (
            <Empty description="Chưa có sản phẩm trong khung giờ này" />
          ) : (
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
                          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold z-10">
                            -{product.discountPercent}%
                          </div>
                        )}
                      </div>
                    }
                    className="border-0"
                    bodyStyle={{ padding: '12px' }}
                  >
                    <h3 className="text-sm font-medium text-gray-800 line-clamp-2 mb-2 min-h-[40px]">
                      {product.productName}
                    </h3>
                    <p className="text-xs text-gray-500 mb-2">{product.brandName}</p>
                    <div className="space-y-1">
                      <div className="text-red-600 font-bold text-lg">
                        {product.discountedPrice.toLocaleString('vi-VN')}₫
                      </div>
                      {product.discountedPrice < product.originalPrice && (
                        <div className="text-gray-400 text-xs line-through">
                          {product.originalPrice.toLocaleString('vi-VN')}₫
                        </div>
                      )}
                    </div>

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
                            className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full"
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
        </Card>
      </div>
    </div>
  );
};

export default FlashSaleDetail;
