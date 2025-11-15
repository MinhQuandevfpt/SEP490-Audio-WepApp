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
  colors?: Array<{ name: string; hex: string }>;
}

const PurchaseActions: React.FC<PurchaseActionsProps> = ({ 
  productId,
  productName,
  productImage,
  productPrice,
  inStock, 
  colors 
}) => {
  const navigate = useNavigate();
  const [qty, setQty] = React.useState(1);
  const [color, setColor] = React.useState(colors?.[0]?.name ?? '');
  const [isAdding, setIsAdding] = React.useState(false);

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

    try {
      setIsAdding(true);
      
      await CustomerCartService.addProductToCart(productId, qty);

      showCenterSuccess('Đã thêm sản phẩm vào giỏ hàng!', '🛒 Thành công');
      
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
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="mb-4">
        <span className="text-sm text-gray-500">Tình trạng</span>
        <div className={`mt-1 font-medium ${inStock ? 'text-green-600' : 'text-red-600'}`}>{inStock ? 'Còn hàng' : 'Hết hàng'}</div>
      </div>

      {colors && colors.length > 0 && (
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

      <div className="mb-4">
        <span className="text-sm text-gray-500 block mb-3">Số lượng</span>
        <div className="inline-flex items-center border rounded-lg overflow-hidden">
          <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 hover:bg-gray-50">-</button>
          <input value={qty} inputMode="numeric" pattern="[0-9]*" onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))} className="w-12 text-center outline-none" />
          <button onClick={() => setQty(qty + 1)} className="px-3 py-2 hover:bg-gray-50">+</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={handleAddToCart}
          disabled={!inStock || isAdding}
          className="flex items-center justify-center gap-2 border border-orange-500 text-orange-600 py-3 rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ShoppingCart className="w-5 h-5" /> 
          {isAdding ? 'Đang thêm...' : 'Thêm vào giỏ'}
        </button>
        <button 
          onClick={handleBuyNow}
          disabled={!inStock}
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


