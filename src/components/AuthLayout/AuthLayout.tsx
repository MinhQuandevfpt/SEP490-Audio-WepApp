import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Headphones, Volume2, Mic2, Radio, Speaker, Music, Shield, Truck, Award } from 'lucide-react';

const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center">
          <Link to="/" className="flex items-center">
            <h1 className="text-2xl font-bold">
              <span className="text-orange-500">Audio</span>
              <span className="text-blue-600">Shop</span>
            </h1>
          </Link>
          <div className="ml-4">
            <p className="text-sm text-gray-600">Thiên đường âm thanh chất lượng cao</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex min-h-[calc(100vh-80px)]">
        {/* Left Side - Professional Audio Platform Design */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 items-center justify-center relative overflow-hidden">
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          </div>
          
          {/* Content */}
          <div className="relative z-10 max-w-md px-8 py-12 text-white">
            {/* Logo & Brand */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-6 shadow-2xl">
                <Headphones className="w-10 h-10 text-orange-500" />
              </div>
              <h1 className="text-4xl font-bold mb-3">AudioShop Platform</h1>
              <p className="text-lg text-orange-100">
                Nền tảng âm thanh hàng đầu Việt Nam
              </p>
            </div>

            {/* Features Grid */}
            <div className="space-y-4 mb-10">
              <div className="flex items-start space-x-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Volume2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Hàng nghìn sản phẩm chính hãng</h3>
                  <p className="text-sm text-orange-100">Tai nghe, loa, micro từ các thương hiệu nổi tiếng thế giới</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Bảo hành chính hãng</h3>
                  <p className="text-sm text-orange-100">100% sản phẩm chính hãng, bảo hành toàn quốc</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Giao hàng nhanh chóng</h3>
                  <p className="text-sm text-orange-100">Freeship toàn quốc, giao hàng trong 2h tại nội thành</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 hover:bg-white/20 transition-all">
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">Trải nghiệm tuyệt vời</h3>
                  <p className="text-sm text-orange-100">Showroom 3D, tư vấn chuyên nghiệp, hỗ trợ 24/7</p>
                </div>
              </div>
            </div>

            {/* Product Categories Icons */}
            <div className="flex justify-center space-x-6 pt-6 border-t border-white/20">
              <div className="flex flex-col items-center space-y-2 opacity-80 hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Headphones className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs">Tai nghe</span>
              </div>
              <div className="flex flex-col items-center space-y-2 opacity-80 hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Speaker className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs">Loa</span>
              </div>
              <div className="flex flex-col items-center space-y-2 opacity-80 hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Mic2 className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs">Micro</span>
              </div>
              <div className="flex flex-col items-center space-y-2 opacity-80 hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Radio className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs">Thiết bị</span>
              </div>
              <div className="flex flex-col items-center space-y-2 opacity-80 hover:opacity-100 transition-opacity">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <Music className="w-6 h-6 text-white" />
                </div>
                <span className="text-xs">Phụ kiện</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;