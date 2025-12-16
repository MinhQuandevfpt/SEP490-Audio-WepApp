import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, CreditCard, AlertCircle } from 'lucide-react';
import { CustomerCartService } from '../../../services/customer/CartService';
import { ProductListService } from '../../../services/customer/ProductListService';
import { showCenterSuccess, showCenterError } from '../../../utils/notification';

interface PurchaseActionsProps {
  productId: string;
  productName: string;
  productImage: string;
  productPrice: number;
  inStock: boolean;
  totalStock: number;
  selectedVariant?: any;
  variants?: any[];
  onVariantSelect?: (variant: any) => void;
  onVariantHover?: (variant: any | null) => void;
  colors?: Array<{ name: string; hex: string }>;
}

const PurchaseActions: React.FC<PurchaseActionsProps> = ({ 
  productId,
  productName,
  productImage,
  productPrice,
  totalStock,
  selectedVariant,
  variants,
  onVariantSelect,
  onVariantHover,
  colors 
}) => {
  const navigate = useNavigate();
  const [qty, setQty] = React.useState(1);
  const [color, setColor] = React.useState(colors?.[0]?.name ?? '');
  const [isAdding, setIsAdding] = React.useState(false);
  
  // Campaign preview state
  const [campaignPreview, setCampaignPreview] = React.useState<{
    baseUnitPrice: number;
    campaignUnitPrice: number | null;
    effectiveUnitPrice: number;
    lineTotal: number;
    inCampaign: boolean;
    campaignUsageExceeded: boolean;
    campaignRemaining: number | null;
    campaignName: string | null;
    campaignCode: string | null;
  } | null>(null);
  const [debounceTimer, setDebounceTimer] = React.useState<ReturnType<typeof setTimeout> | null>(null);

  // Calculate actual stock based on variant selection
  const actualStock = selectedVariant ? selectedVariant.variantStock : totalStock;
  const isInStock = actualStock > 0;
  
  // Get optionName from first variant if exists
  const optionName = variants && variants.length > 0 ? variants[0].optionName : null;

  // Check if user is logged in
  const isLoggedIn = () => {
    const customerId = localStorage.getItem('customerId');
    return !!customerId;
  };

  // Fetch campaign preview (silently in background)
  const fetchCampaignPreview = React.useCallback(async (quantity: number, variantId?: string | null) => {
    if (!isLoggedIn()) {
      setCampaignPreview(null);
      return;
    }

    try {
      // Don't set loading state - run silently in background
      const customerId = localStorage.getItem('customerId');
      if (!customerId) {
        setCampaignPreview(null);
        return;
      }

      const preview = await ProductListService.getCampaignPreview(productId, {
        customerId,
        variantId: variantId || null,
        quantity,
      });

      // Only set campaignPreview if there's an issue to display
      // Issues: campaignUsageExceeded OR (inCampaign AND quantity > campaignRemaining)
      const hasIssue = preview.campaignUsageExceeded || 
        (preview.inCampaign && 
         preview.campaignRemaining !== null && 
         preview.campaignRemaining > 0 && 
         quantity > preview.campaignRemaining);
      
      if (hasIssue) {
        setCampaignPreview(preview);
      } else {
        // No issue - don't show anything
        setCampaignPreview(null);
      }
    } catch (error: any) {
      console.error('Error fetching campaign preview:', error);
      // Don't show error to user, just use base price
      setCampaignPreview(null);
    }
    // No finally block - we don't use loadingCampaign anymore
  }, [productId, isLoggedIn]);

  // Fetch campaign preview on mount (quantity = 1)
  React.useEffect(() => {
    if (isLoggedIn()) {
      fetchCampaignPreview(1, selectedVariant?.variantId);
    }
  }, []); // Only on mount

  // Fetch campaign preview when variant changes
  React.useEffect(() => {
    if (isLoggedIn()) {
      fetchCampaignPreview(qty, selectedVariant?.variantId);
    }
  }, [selectedVariant?.variantId]);

  // Fetch campaign preview when quantity changes (with debounce)
  React.useEffect(() => {
    if (!isLoggedIn()) {
      return;
    }

    // Clear previous timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      fetchCampaignPreview(qty, selectedVariant?.variantId);
    }, 250); // 250ms debounce

    setDebounceTimer(timer);

    // Cleanup
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [qty]);

  const handleAddToCart = async () => {
    // Check login first
    if (!isLoggedIn()) {
      // Save current URL to redirect back after login
      localStorage.setItem('redirectAfterLogin', window.location.pathname);
      navigate('/auth/login');
      return;
    }

    // Check if product has variants and user must select one
    if (variants && variants.length > 0 && !selectedVariant) {
      showCenterError('Vui lòng chọn phân loại sản phẩm trước khi thêm vào giỏ hàng.', '⚠️ Chưa chọn phân loại');
      return;
    }

    // Check if product/variant is out of stock
    if (!isInStock || actualStock === 0) {
      showCenterError('Sản phẩm hiện đang hết hàng. Vui lòng chọn sản phẩm khác.', '⚠️ Hết hàng');
      return;
    }

    // Check if quantity exceeds available stock
    if (qty > actualStock) {
      showCenterError(
        `Số lượng bạn chọn (${qty}) vượt quá số lượng tồn kho (${actualStock} sản phẩm). Vui lòng chọn số lượng nhỏ hơn.`,
        '⚠️ Vượt quá tồn kho'
      );
      return;
    }

    try {
      setIsAdding(true);
      
      console.log('🔍 Debug - Adding to cart:', {
        productId,
        qty,
        actualStock,
        hasVariants: variants && variants.length > 0,
        selectedVariant,
        variantId: selectedVariant?.variantId
      });

      // Check if item already exists in cart
      const currentCart = await CustomerCartService.getCart();
      
      // Find existing item in cart
      // Note: refId is productId (or comboId), variantId is a separate field
      const existingItem = currentCart.items.find(item => {
        if (item.type !== 'PRODUCT') return false;
        
        // For variant: check if refId matches productId AND variantId matches
        if (selectedVariant?.variantId) {
          return item.refId === productId && item.variantId === selectedVariant.variantId;
        }
        
        // For product without variant: check if refId matches productId AND no variantId
        return item.refId === productId && !item.variantId;
      });

      if (existingItem) {
        // Item already exists - update quantity (add to existing quantity)
        const newQuantity = existingItem.quantity + qty;
        
        // Check if new quantity exceeds available stock
        if (newQuantity > actualStock) {
          showCenterError(
            `Bạn đã vượt quá số lượng tồn kho (${actualStock} sản phẩm). Bạn chỉ có thể thêm tối đa ${actualStock - existingItem.quantity} sản phẩm nữa.`,
            '⚠️ Vượt quá tồn kho'
          );
          setIsAdding(false);
          return;
        }
        
        console.log('🔄 Item already in cart, updating quantity:', {
          cartItemId: existingItem.cartItemId,
          oldQuantity: existingItem.quantity,
          addQuantity: qty,
          newQuantity
        });
        
        await CustomerCartService.updateItemQuantity(existingItem.cartItemId, newQuantity);
        showCenterSuccess(`Đã cập nhật số lượng sản phẩm trong giỏ hàng! (${newQuantity} sản phẩm)`, '🛒 Thành công');
      } else {
        // Item doesn't exist - add new item
        console.log('➕ Adding new item to cart');
        await CustomerCartService.addProductToCart(
          productId, 
          qty, 
          selectedVariant?.variantId
        );
        showCenterSuccess('Đã thêm sản phẩm vào giỏ hàng!', '🛒 Thành công');
      }
      
      // Reload cart to detect campaign usage state after the operation
      const updatedCart = await CustomerCartService.getCart();
      const updatedItem = updatedCart.items.find(item => {
        if (item.type !== 'PRODUCT') return false;
        if (selectedVariant?.variantId) {
          return item.refId === productId && item.variantId === selectedVariant.variantId;
        }
        return item.refId === productId && !item.variantId;
      });

      // Show warning if campaign quota is exceeded (aligns with cart page behavior)
      const exceededInPreview =
        campaignPreview?.campaignUsageExceeded ||
        (campaignPreview?.inCampaign &&
          campaignPreview.campaignRemaining !== null &&
          campaignPreview.campaignRemaining > 0 &&
          qty > campaignPreview.campaignRemaining);

      // Nếu số lượng vượt quota campaign, gọi API updateQuantityWithVouchers để backend tính lại giá (giống Cart)
      const exceedsCampaignLimit =
        updatedItem?.inPlatformCampaign &&
        updatedItem.campaignRemaining !== null &&
        updatedItem.campaignRemaining !== undefined &&
        updatedItem.quantity > (updatedItem.campaignRemaining ?? 0);

      if (updatedItem?.cartItemId && exceedsCampaignLimit) {
        try {
          await CustomerCartService.updateQuantityWithVouchers({
            cartItemId: updatedItem.cartItemId,
            quantity: updatedItem.quantity,
            storeVouchers: null,
            platformVouchers: null,
            serviceTypeIds: null,
          });
          // Reload lại cart để lấy giá đã được backend điều chỉnh
          const refreshedCart = await CustomerCartService.getCart();
          const refreshedItem = refreshedCart.items.find(item => item.cartItemId === updatedItem.cartItemId);
          if (refreshedItem) {
            updatedItem.campaignUsageExceeded = refreshedItem.campaignUsageExceeded;
            updatedItem.campaignRemaining = refreshedItem.campaignRemaining;
          }
        } catch (err) {
          console.error('Failed to normalize campaign quantity/pricing:', err);
        }
      }

      const shouldWarnCampaign =
        updatedItem?.campaignUsageExceeded || exceededInPreview;

      // Hiển thị cảnh báo sau 3s để không che toast "Thêm vào giỏ"
      if (shouldWarnCampaign) {
        setTimeout(() => {
          showCenterError(
            'Bạn đã vượt số lượng khuyến mãi. Phần vượt sẽ áp dụng giá gốc.',
            '⚠️ Vượt giới hạn khuyến mãi'
          );
        }, 3000);
      }
      
      // Trigger cart update event
      window.dispatchEvent(new CustomEvent('cartUpdated', {
        detail: {
          productId,
          productName,
          productImage,
          productPrice,
          quantity: qty
        }
      }));
      
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      // Don't show customer ID error, just redirect to login
      if (error.message?.includes('Customer ID')) {
        // Save current URL to redirect back after login
        localStorage.setItem('redirectAfterLogin', window.location.pathname);
        navigate('/auth/login');
      } else {
        showCenterError(error.message || 'Không thể thêm vào giỏ hàng. Vui lòng thử lại.', '❌ Lỗi');
      }
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = () => {
    // Check login first
    if (!isLoggedIn()) {
      // Save current URL to redirect back after login
      localStorage.setItem('redirectAfterLogin', window.location.pathname);
      navigate('/auth/login');
      return;
    }
    
    // Add to cart and navigate to checkout
    handleAddToCart().then(() => {
      navigate('/cart');
    });
  };

  return (
    <div className="space-y-4">
      {/* Variant Selector - Horizontal layout, no border */}
      {variants && variants.length > 0 && onVariantSelect && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-700 font-medium min-w-[80px]">{optionName || 'Phân loại'}:</span>
          <div className="flex flex-wrap gap-2 flex-1">
            {variants.map((variant) => {
              const isSelected = selectedVariant?.variantId === variant.variantId;
              const variantStock = variant.variantStock || 0;
              const isVariantInStock = variantStock > 0;
              return (
                <button
                  key={variant.variantId}
                  onClick={() => {
                    if (isVariantInStock) {
                      onVariantSelect(variant);
                    }
                  }}
                  onMouseEnter={() => onVariantHover?.(variant)}
                  onMouseLeave={() => onVariantHover?.(null)}
                  disabled={!isVariantInStock}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                    !isVariantInStock
                      ? 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                      : isSelected
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 bg-white hover:border-orange-300'
                  }`}
                  title={!isVariantInStock ? 'Hết hàng' : ''}
                >
                  {variant.variantUrl && (
                    <img
                      src={variant.variantUrl}
                      alt={variant.optionValue}
                      className="w-8 h-8 rounded object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <span className={`text-sm ${
                    !isVariantInStock 
                      ? 'text-gray-400' 
                      : isSelected 
                      ? 'text-orange-600 font-medium' 
                      : 'text-gray-700'
                  }`}>
                    {variant.optionValue}
                    {!isVariantInStock && ' (Hết)'}
                  </span>
                  {isSelected && isVariantInStock && (
                    <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Stock Status - Horizontal layout */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-700 font-medium min-w-[80px]">Tình trạng:</span>
        <div className={`font-medium ${isInStock ? 'text-green-600' : 'text-red-600'}`}>
          {isInStock 
            ? (selectedVariant ? `Còn (${actualStock}) sản phẩm` : 'Còn hàng')
            : 'Hết hàng'
          }
        </div>
      </div>

      {colors && colors.length > 0 && !selectedVariant && (
        <div className="mb-4">
          <span className="text-sm text-gray-500">Màu sắc</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c.name}
                onClick={() => setColor(c.name)}
                className={`px-3 py-1 rounded-full border text-sm ${color === c.name ? 'border-orange-500 text-orange-600' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}
              >
                <span className="inline-block w-4 h-4 rounded-full mr-2 ring-1 ring-gray-300" style={{ backgroundColor: c.hex }} />
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity Selector - Horizontal layout */}
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-700 font-medium min-w-[80px]">Số lượng:</span>
        <div className={`inline-flex items-center border rounded-lg overflow-hidden ${!isInStock ? 'opacity-50' : ''}`}>
          <button 
            onClick={() => setQty(Math.max(1, qty - 1))} 
            className="px-3 py-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={qty <= 1 || !isInStock}
          >
            -
          </button>
          <input 
            value={isInStock ? qty : 0} 
            inputMode="numeric" 
            pattern="[0-9]*" 
            onChange={(e) => {
              if (!isInStock) return;
              const newQty = Number(e.target.value) || 1;
              // Limit quantity to available stock
              const maxQty = Math.max(1, Math.min(newQty, actualStock));
              setQty(maxQty);
            }} 
            className="w-12 text-center outline-none disabled:bg-gray-100 disabled:cursor-not-allowed" 
            max={actualStock}
            disabled={!isInStock}
            readOnly={!isInStock}
          />
          <button 
            onClick={() => setQty(Math.min(actualStock, qty + 1))} 
            className="px-3 py-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={qty >= actualStock || !isInStock}
          >
            +
          </button>
        </div>
        {actualStock > 0 ? (
          <span className="text-xs text-gray-500">(Tối đa: {actualStock})</span>
        ) : (
          <span className="text-xs text-red-500">(Hết hàng)</span>
        )}
      </div>

      {/* Campaign Warnings - Only show when there are issues with quantity */}
      {campaignPreview && (
        <div className="space-y-2">
          {/* Campaign usage exceeded warning */}
          {campaignPreview.campaignUsageExceeded && (
            <div className="flex items-start gap-2 text-sm text-orange-700 bg-orange-100 p-2 rounded border border-orange-300">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                {campaignPreview.campaignRemaining === 0 ? (
                  <span>Bạn đã dùng hết số lượng khuyến mãi cho sản phẩm này.</span>
                ) : (
                  <span>
                    Bạn chỉ được giảm tối đa {campaignPreview.campaignRemaining} sản phẩm cho chiến dịch này. 
                    Nếu mua {qty} sản phẩm trong cùng đơn hàng, giá sẽ quay về giá gốc trong đơn hàng.
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Quantity exceeds campaign remaining warning */}
          {campaignPreview.inCampaign && 
           !campaignPreview.campaignUsageExceeded && 
           campaignPreview.campaignRemaining !== null &&
           campaignPreview.campaignRemaining > 0 &&
           qty > campaignPreview.campaignRemaining && (
            <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">Gợi ý:</span> Bạn nên đặt tối đa{' '}
                <span className="font-bold text-amber-800">{campaignPreview.campaignRemaining}</span> cái để được hưởng giá khuyến mãi.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3 mt-6">
        <button 
          onClick={handleAddToCart}
          disabled={!isInStock || isAdding}
          className="flex items-center justify-center gap-2 border border-orange-500 text-orange-600 py-3 rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShoppingCart className="w-5 h-5" /> 
          {isAdding ? 'Đang thêm...' : 'Thêm vào giỏ'}
        </button>
        <button 
          onClick={handleBuyNow}
          disabled={!isInStock}
          className="flex items-center justify-center gap-2 text-white py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
          style={{ backgroundColor: '#FF6F00' }}
        >
          <CreditCard className="w-5 h-5" /> Mua ngay
        </button>
      </div>
    </div>
  );
};

export default PurchaseActions;


