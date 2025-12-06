import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CustomerCartService } from '../../services/customer/CartService';
import type { CartResponse } from '../../types/cart';

interface EnrichedCartItem {
  cartItemId: string;
  refId: string;
  name: string;
  image: string;
  variantUrl?: string;
  unitPrice: number; // Giá gốc (baseUnitPrice) để hiển thị gạch ngang khi có discount
  discountedPrice: number; // Giá sau khi áp dụng campaign (platformCampaignPrice hoặc unitPrice)
  quantity: number;
  variantOptionValue?: string;
}

const CartDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [enrichedItems, setEnrichedItems] = useState<EnrichedCartItem[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load cart data and enrich with platform voucher prices
  const loadCart = async () => {
    try {
      const cartData = await CustomerCartService.getCart();
      setCart(cartData);
      
      // Backend đã xử lý platform campaign, sử dụng trực tiếp từ response
      const itemsToEnrich = cartData.items.slice(0, 5);
      const enriched = itemsToEnrich.map((item) => {
        // Backend trả về:
        // - baseUnitPrice: giá gốc (chưa campaign)
        // - platformCampaignPrice: giá sau campaign (nếu có)
        // - unitPrice: giá hiện tại (đã áp dụng campaign nếu có)
        // - inPlatformCampaign: có đang trong campaign không
        // - campaignUsageExceeded: đã vượt giới hạn chưa
        
        // unitPrice trong EnrichedCartItem = baseUnitPrice (giá gốc) để hiển thị gạch ngang
        // discountedPrice = platformCampaignPrice (nếu có) hoặc unitPrice (nếu không có campaign)
        const originalPrice = item.baseUnitPrice ?? item.unitPrice;
        const discountedPrice = 
          item.inPlatformCampaign && 
          !item.campaignUsageExceeded && 
          item.platformCampaignPrice !== undefined
            ? item.platformCampaignPrice
            : item.unitPrice;
        
        return {
          cartItemId: item.cartItemId,
          refId: item.refId,
          name: item.name,
          image: item.image,
          variantUrl: item.variantUrl,
          unitPrice: originalPrice, // Giá gốc để so sánh và hiển thị gạch ngang
          discountedPrice, // Giá sau khi áp dụng campaign
          quantity: item.quantity,
          variantOptionValue: item.variantOptionValue
        };
      });
      
      setEnrichedItems(enriched);
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  // Load cart immediately on mount
  useEffect(() => {
    loadCart();
  }, []);

  // Preload cart when hovering (không cần reload khi đã mở)
  const handleMouseEnter = () => {
    setIsOpen(true);
    // Chỉ reload nếu cart chưa có data
    if (!cart) {
      loadCart();
    }
  };

  // Listen for cart updates
  useEffect(() => {
    const handleCartUpdate = () => {
      loadCart();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const cartItemCount = cart?.items?.length || 0;
  const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN').format(price) + 'đ';

  // Use enriched items for display, fallback to first 5 raw items if enrichment not done
  const displayItems = enrichedItems.length > 0 ? enrichedItems : cart?.items?.slice(0, 5).map(item => {
    const originalPrice = item.baseUnitPrice ?? item.unitPrice;
    const discountedPrice = 
      item.inPlatformCampaign && 
      !item.campaignUsageExceeded && 
      item.platformCampaignPrice !== undefined
        ? item.platformCampaignPrice
        : item.unitPrice;
    
    return {
      cartItemId: item.cartItemId,
      refId: item.refId,
      name: item.name,
      image: item.image,
      variantUrl: item.variantUrl,
      unitPrice: originalPrice, // Giá gốc để so sánh
      discountedPrice, // Giá sau khi áp dụng campaign
      quantity: item.quantity,
      variantOptionValue: item.variantOptionValue
    };
  }) || [];
  
  const remainingCount = Math.max(0, cartItemCount - 5);  return (
    <div className="relative" ref={dropdownRef}>
      {/* Cart Icon */}
      <button
        onMouseEnter={handleMouseEnter}
        onClick={() => setIsOpen(!isOpen)}
        className="relative group"
      >
        <div className="flex items-center text-blue-600 hover:text-blue-700">
          <ShoppingCart className="w-5 h-5" />
        </div>
        {cartItemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
            {cartItemCount > 99 ? '99+' : cartItemCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
          onMouseLeave={() => setIsOpen(false)}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Giỏ hàng ({cartItemCount})
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items - No scroll, fit 5 items */}
          <div className="overflow-hidden">
            {cartItemCount === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Giỏ hàng trống</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {displayItems.map((item) => {
                  return (
                    <div key={item.cartItemId} className="p-3 hover:bg-gray-50 flex gap-2">
                      {/* Image - Smaller */}
                      <div className="flex-shrink-0">
                        <img
                          src={item.variantUrl || item.image || '/images/placeholder-product.png'}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded border border-gray-200"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/images/placeholder-product.png';
                          }}
                        />
                      </div>

                      {/* Info - Compact */}
                      <div className="flex-1 min-w-0 flex items-center justify-between">
                        <h4 className="text-xs font-medium text-gray-900 line-clamp-1 leading-tight flex-1 mr-2" style={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {item.name}
                        </h4>
                        {/* Giá sau giảm màu đỏ, gạch giá gốc nếu có discount */}
                        <div className="flex flex-col items-end flex-shrink-0">
                          {item.discountedPrice < item.unitPrice && (
                            <span className="text-xs text-gray-400 line-through">
                              {formatPrice(item.unitPrice)}
                            </span>
                          )}
                          <span className={`text-sm font-semibold ${item.discountedPrice < item.unitPrice ? 'text-red-600' : 'text-orange-500'}`}>
                            {formatPrice(item.discountedPrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {cartItemCount > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              {/* Thông báo số sản phẩm còn lại + Button */}
              <div className="flex items-center justify-between">
                {remainingCount > 0 && (
                  <span className="text-xs text-gray-600">
                    {remainingCount} sản phẩm thêm vào giỏ
                  </span>
                )}
                <Link
                  to="/cart"
                  onClick={() => setIsOpen(false)}
                  className={`${remainingCount > 0 ? 'ml-auto' : 'w-full'} bg-orange-500 text-white text-center px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-medium text-sm`}
                >
                  Xem giỏ hàng
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CartDropdown;
