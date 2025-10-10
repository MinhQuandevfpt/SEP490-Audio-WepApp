import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      {/* Header với nút quay lại */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center">
          <Link 
            to="/" 
            className="flex items-center text-gray-600 hover:text-orange-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span>Quay lại trang chủ</span>
          </Link>
          <div className="ml-8">
            <h1 className="text-2xl font-bold text-orange-500">AudioShop</h1>
            <p className="text-sm text-gray-600">Thiên đường âm thanh chất lượng cao</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex min-h-[calc(100vh-80px)]">
        {/* Left Side - Decorative */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-400 to-orange-600 items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
          <div className="relative z-10 text-center text-white px-8">
            <div className="mb-8">
              <h2 className="text-4xl font-bold mb-4">Chào mừng đến với AudioShop</h2>
              <p className="text-xl opacity-90">
                Khám phá thế giới âm thanh tuyệt vời với hàng ngàn sản phẩm chất lượng cao
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6 text-left">
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <h3 className="font-semibold mb-2">🎧 Tai nghe cao cấp</h3>
                <p className="text-sm opacity-90">Từ các thương hiệu nổi tiếng thế giới</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <h3 className="font-semibold mb-2">🔊 Loa chất lượng</h3>
                <p className="text-sm opacity-90">Âm thanh sống động, chân thực</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <h3 className="font-semibold mb-2">🎵 Thiết bị DJ</h3>
                <p className="text-sm opacity-90">Dành cho những người đam mê nhạc</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <h3 className="font-semibold mb-2">🎹 Nhạc cụ điện tử</h3>
                <p className="text-sm opacity-90">Công nghệ hiện đại, âm thanh tuyệt vời</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;