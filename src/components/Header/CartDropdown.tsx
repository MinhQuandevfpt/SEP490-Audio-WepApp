import React, { useState, useEffect, useRef } from 'react';
import { ShoppingCart, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CustomerCartService } from '../../services/customer/CartService';
import type { CartResponse } from '../../types/cart';

const CartDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load cart data
  const loadCart = async () => {
    try {
      setLoading(true);
      const cartData = await CustomerCartService.getCart();
      setCart(cartData);
    } catch (error) {
      console.error('Error loading cart:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load cart immediately on mount and when dropdown opens
  useEffect(() => {
    loadCart(); // Load cart on component mount
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadCart(); // Reload when dropdown opens
    }
  }, [isOpen]);

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

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Cart Icon */}
      <button
        onMouseEnter={() => setIsOpen(true)}
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

          {/* Cart Items */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                <p className="mt-2">Đang tải...</p>
              </div>
            ) : cartItemCount === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Giỏ hàng trống</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {cart?.items.map((item) => (
                  <div key={item.cartItemId} className="p-4 hover:bg-gray-50 flex gap-3">
                    {/* Image */}
                    <div className="flex-shrink-0">
                      <img
                        src={item.image || '/images/placeholder-product.png'}
                        alt={item.name}
                        className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/images/placeholder-product.png';
                        }}
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                        {item.name}
                      </h4>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          x{item.quantity}
                        </span>
                        <span className="text-sm font-semibold text-orange-500">
                          {formatPrice(item.lineTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {cartItemCount > 0 && (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <Link
                to="/cart"
                onClick={() => setIsOpen(false)}
                className="block w-full bg-orange-500 text-white text-center py-2 rounded-lg hover:bg-orange-600 transition-colors font-medium"
              >
                Xem giỏ hàng
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CartDropdown;
