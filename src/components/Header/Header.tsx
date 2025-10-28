import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, User, Bell, Home, MapPin, Shield, Truck, RotateCcw, Clock, DollarSign, LogOut } from 'lucide-react';
import { CustomerAuthService } from '../../services/customer/Authcustomer';
import { useCart } from '../../hooks/useCart';
import { CustomerCategoryService } from '../../services/customer/CategoryService';
import type { CategoryItem } from '../../types/api';

const Header: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { cartItemCount, loadCartCount, clearCart } = useCart();
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  useEffect(() => {
    const checkAuth = () => {
      const authStatus = CustomerAuthService.isAuthenticated();
      const user = CustomerAuthService.getCurrentUser();
      setIsAuthenticated(authStatus);
      setCurrentUser(user);
      
      // Load cart count if authenticated
      if (authStatus) {
        loadCartCount();
      }
    };

    // Load categories from API
    const loadCategories = async () => {
      try {
        const response = await CustomerCategoryService.getAllCategories();
        if (response.data && Array.isArray(response.data)) {
          // Lấy tối đa 6 categories để hiển thị
          setCategories(response.data.slice(0, 6));
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
        // Keep empty array if failed
      }
    };

    checkAuth();
    loadCategories();
    
    // Listen for storage changes (when user logs in/out)
    window.addEventListener('storage', checkAuth);
    
    // Check for auth state changes every 500ms (for OAuth2 flow)
    const authCheckInterval = setInterval(() => {
      const authStateChanged = localStorage.getItem('authStateChanged');
      if (authStateChanged) {
        localStorage.removeItem('authStateChanged');
        checkAuth();
      }
    }, 500);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
      clearInterval(authCheckInterval);
    };
  }, [loadCartCount]);

  const handleLogout = () => {
    CustomerAuthService.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    clearCart();
    window.location.href = '/'; // Hard refresh to clear any cached state
  };

  const getEncodedCustomerParam = () => {
    try {
      const id = localStorage.getItem('customer_id');
      if (!id) return '';
      const encoded = btoa(id).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
      return `?u=${encoded}`;
    } catch {
      return '';
    }
  };
  return (
    <header className="bg-white border-b border-gray-200">
      {/* Top bar */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-2 text-sm">
            <div className="flex space-x-6">
              <a href="/seller" className="text-blue-600 hover:text-gray-900">
                Chăm sóc khách hàng
              </a>
              <Link to="/seller/login" className="text-blue-600 hover:text-gray-900">
                Bán hàng cùng AudioShop
              </Link>
              <Link to="/3d-room" className="text-blue-600 hover:text-gray-900">
                Trải nghiệm phòng âm thanh
              </Link>
            </div>
            <div className="flex space-x-6">
              <a href="/notifications" className="text-gray-600 hover:text-gray-900 flex items-center space-x-1">
                <Bell className="w-4 h-4" />
                <span>Thông báo</span>
              </a>
              <a href="/support" className="text-gray-600 hover:text-gray-900">
                Hỗ trợ
              </a>
              
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    Xin chào, <span className="font-medium text-gray-800">{currentUser?.full_name}</span>
                  </span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center text-gray-600 hover:text-red-600 transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-1" />
                    <span className="text-sm">Đăng xuất</span>
                  </button>
                </div>
              ) : (
                <>
                  <Link to="/auth/login" className="font-black text-black hover:text-gray-900">
                    Đăng nhập
                  </Link>
                  <span className="text-gray-400">/</span>
                  <Link to="/auth/register" className="font-black text-black hover:text-gray-900">
                    Đăng ký
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold">
                <span className="text-orange-500">Audio</span>
                <span className="text-blue-600">Shop</span>
              </span>
            </Link>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm tai nghe, loa, micro..."
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>

            {/* Navigation categories below search */}
            <div className="mt-3">
              <nav className="flex space-x-6">
                {categories.length > 0 ? (
                  categories.map((category, index) => (
                    <a 
                      key={category.categoryId}
                      href={`/products?category=${encodeURIComponent(category.name)}`} 
                      className={`text-gray-700 hover:text-orange-500 font-medium text-sm ${
                        index === 0 ? 'border-b-2 border-orange-500' : ''
                      }`}
                    >
                      {category.name}
                    </a>
                  ))
                ) : (
                  // Fallback while loading
                  <span className="text-gray-400 text-sm">Đang tải danh mục...</span>
                )}
              </nav>
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex flex-col items-end space-y-2">
            {/* Top row - Trang chủ, Tài khoản, Giỏ hàng */}
            <div className="flex items-center space-x-4">
              {/* Trang chủ */}
              <Link to="/" className="flex items-center space-x-1 text-gray-700 hover:text-orange-500">
                <Home className="w-5 h-5" />
                <span className="text-sm">Trang chủ</span>
              </Link>

              {/* Divider */}
              <span className="text-gray-300">|</span>

              {/* User Account */}
              <Link to={isAuthenticated ? `/account${getEncodedCustomerParam()}` : '/auth/login'} className="flex items-center space-x-1 text-gray-700 hover:text-orange-500">
                <User className="w-5 h-5" />
                <span className="text-sm">Tài khoản</span>
              </Link>

              {/* Shopping Cart */}
              <a href="/cart" className="relative group">
                <div className="flex items-center text-blue-600 hover:text-blue-700">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </a>
            </div>

            {/* Bottom row - Địa chỉ */}
            <div className="flex items-center space-x-1 border-b border-gray-400 pb-1">
              <MapPin className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-semibold text-black">Giao đến:</span>
              <span className="font-medium text-black">Q.1, P. Cô Giang, Hồ Chí Minh</span>
            </div>
          </div>
        </div>
      </div>

      {/* Commitment/Trust badges */}
      <div className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center space-x-8 py-3">
            <span className="text-blue-600 font-semibold">Cam kết:</span>

            <div className="flex items-center space-x-2 text-gray-700">
              <Shield className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">100% hàng thật</span>
            </div>

            <div className="flex items-center space-x-2 text-gray-700">
              <Truck className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">Freeship mọi đơn</span>
            </div>

            <div className="flex items-center space-x-2 text-gray-700">
              <RotateCcw className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">Hoàn 200% nếu hàng giả</span>
            </div>

            <div className="flex items-center space-x-2 text-gray-700">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">30 ngày đổi trả</span>
            </div>

            <div className="flex items-center space-x-2 text-gray-700">
              <Truck className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">Giao nhanh 2h</span>
            </div>

            <div className="flex items-center space-x-2 text-gray-700">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">Giá siêu rẻ</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
