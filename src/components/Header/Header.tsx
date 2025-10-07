import React from 'react';
import { ShoppingCart, User, Bell, Home, MapPin, Shield, Truck, RotateCcw, Clock, DollarSign } from 'lucide-react';

const Header: React.FC = () => {
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
              <a href="/about" className="text-blue-600 hover:text-gray-900">
                Bán hàng cùng AudioShop
              </a>
            </div>
            <div className="flex space-x-6">
              <a href="/notifications" className="text-gray-600 hover:text-gray-900 flex items-center space-x-1">
                <Bell className="w-4 h-4" />
                <span>Thông báo</span>
              </a>
              <a href="/support" className="text-gray-600 hover:text-gray-900">
                Hỗ trợ
              </a>
              <a href="/login" className="font-black text-black hover:text-gray-900">
                Đăng nhập
              </a>
              <span className="text-gray-400">/</span>
              <a href="/register" className="font-black text-black hover:text-gray-900">
                Đăng ký
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <div className="flex items-center">
            <a href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold">
                <span className="text-orange-500">Audio</span>
                <span className="text-blue-600">Shop</span>
              </span>
            </a>
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
                <a href="/tai-nghe" className="text-gray-700 hover:text-orange-500 font-medium text-sm border-b-2 border-orange-500">
                  Tai Nghe
                </a>
                <a href="/loa-bluetooth" className="text-gray-700 hover:text-orange-500 font-medium text-sm">
                  Loa Bluetooth
                </a>
                <a href="/micro" className="text-gray-700 hover:text-orange-500 font-medium text-sm">
                  Micro
                </a>
                <a href="/tai-nghe-gaming" className="text-gray-700 hover:text-orange-500 font-medium text-sm">
                  Tai Nghe Gaming
                </a>
                <a href="/soundbar" className="text-gray-700 hover:text-orange-500 font-medium text-sm">
                  Soundbar
                </a>
                <a href="/phu-kien" className="text-gray-700 hover:text-orange-500 font-medium text-sm">
                  Phụ Kiện
                </a>
              </nav>
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex flex-col items-end space-y-2">
            {/* Top row - Trang chủ, Tài khoản, Giỏ hàng */}
            <div className="flex items-center space-x-4">
              {/* Trang chủ */}
              <a href="/" className="flex items-center space-x-1 text-gray-700 hover:text-orange-500">
                <Home className="w-5 h-5" />
                <span className="text-sm">Trang chủ</span>
              </a>

              {/* Divider */}
              <span className="text-gray-300">|</span>

              {/* User Account */}
              <a href="/account" className="flex items-center space-x-1 text-gray-700 hover:text-orange-500">
                <User className="w-5 h-5" />
                <span className="text-sm">Tài khoản</span>
              </a>

              {/* Shopping Cart */}
              <a href="/cart" className="relative group">
                <div className="flex items-center text-blue-600 hover:text-blue-700">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  3
                </span>
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
