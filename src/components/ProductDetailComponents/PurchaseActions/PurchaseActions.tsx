import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, CreditCard } from 'lucide-react';
import { CustomerCartService } from '../../../services/customer/CartService';
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

    try {
      setIsAdding(true);
      
      console.log('🔍 Debug - Adding to cart:', {
        productId,
        qty,
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
              return (
                <button
                  key={variant.variantId}
                  onClick={() => onVariantSelect(variant)}
                  onMouseEnter={() => onVariantHover?.(variant)}
                  onMouseLeave={() => onVariantHover?.(null)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 bg-white hover:border-orange-300'
                  }`}
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
                  <span className={`text-sm ${isSelected ? 'text-orange-600 font-medium' : 'text-gray-700'}`}>
                    {variant.optionValue}
                  </span>
                  {isSelected && (
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
        <div className="inline-flex items-center border rounded-lg overflow-hidden">
          <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 hover:bg-gray-50">-</button>
          <input value={qty} inputMode="numeric" pattern="[0-9]*" onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} className="w-12 text-center outline-none" />
          <button onClick={() => setQty(qty + 1)} className="px-3 py-2 hover:bg-gray-50">+</button>
        </div>
      </div>

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


