import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Store, ShoppingBag, TrendingUp, Users, BarChart3 } from 'lucide-react';

const SellerLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header với branding cho seller */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 mr-8">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg">
                <Store className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  <span className="text-orange-500">Audio</span>
                  <span className="text-blue-600">Shop</span>
                  <span className="text-gray-700 ml-2">Seller Center</span>
                </h1>
                <p className="text-sm text-gray-600">Kênh người bán - Quản lý cửa hàng của bạn</p>
              </div>
            </Link>
          </div>
          
          {/* Support info cho seller */}
          <div className="hidden md:flex items-center space-x-6 text-sm">
            <div className="flex items-center text-gray-600">
              <Users className="w-4 h-4 mr-2" />
              <span>Hỗ trợ 24/7</span>
            </div>
            <div className="flex items-center text-gray-600">
              <TrendingUp className="w-4 h-4 mr-2" />
              <span>Tăng trưởng doanh số</span>
            </div>
            <Link 
              to="/store-staff/login" 
              className="flex items-center text-blue-600 hover:text-blue-800 transition-colors font-medium"
            >
              <Users className="w-4 h-4 mr-2" />
              <span>Nhân viên đăng nhập</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex min-h-[calc(100vh-80px)]">
        {/* Left Side - Benefits & Features */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-500 to-indigo-700 items-center justify-center relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white to-transparent"></div>
            <div className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full opacity-20"></div>
            <div className="absolute bottom-20 right-20 w-32 h-32 bg-white rounded-full opacity-10"></div>
            <div className="absolute top-1/2 right-10 w-16 h-16 bg-white rounded-full opacity-15"></div>
          </div>
          
          <div className="relative z-10 text-center text-white px-8 py-12 max-w-lg">
            <div className="mb-8">
              <div className="bg-white bg-opacity-20 rounded-full p-4 inline-block mb-6">
                <ShoppingBag className="w-16 h-16 text-white" />
              </div>
              <h2 className="text-4xl font-bold mb-4">Bán hàng cùng AudioShop</h2>
              <p className="text-xl opacity-90 mb-8">
                Gia nhập nền tảng thương mại điện tử hàng đầu về âm thanh
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-6 text-left">
              <div className="bg-white bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center mb-3">
                  <div className="bg-white bg-opacity-30 rounded-lg p-2 mr-3">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg">Doanh thu minh bạch</h3>
                </div>
                <p className="text-sm opacity-90">
                  Theo dõi doanh thu, đơn hàng và thống kê bán hàng chi tiết real-time
                </p>
              </div>

              <div className="bg-white bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center mb-3">
                  <div className="bg-white bg-opacity-30 rounded-lg p-2 mr-3">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg">Tiếp cận hàng triệu khách hàng</h3>
                </div>
                <p className="text-sm opacity-90">
                  Kết nối với cộng đồng yêu âm nhạc và audiophile trên toàn quốc
                </p>
              </div>

              <div className="bg-white bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center mb-3">
                  <div className="bg-white bg-opacity-30 rounded-lg p-2 mr-3">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg">Công cụ marketing mạnh mẽ</h3>
                </div>
                <p className="text-sm opacity-90">
                  Flash sale, voucher, quảng cáo để tăng doanh số và độ nhận diện thương hiệu
                </p>
              </div>

              <div className="bg-white bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center mb-3">
                  <div className="bg-white bg-opacity-30 rounded-lg p-2 mr-3">
                    <Store className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg">Dễ dàng quản lý cửa hàng</h3>
                </div>
                <p className="text-sm opacity-90">
                  Dashboard trực quan, quản lý sản phẩm, đơn hàng và khách hàng một cách đơn giản
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <div className="text-2xl font-bold">10K+</div>
                <div className="text-xs opacity-80">Nhà bán hàng</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <div className="text-2xl font-bold">1M+</div>
                <div className="text-xs opacity-80">Sản phẩm</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <div className="text-2xl font-bold">5M+</div>
                <div className="text-xs opacity-80">Khách hàng</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex justify-center items-center space-x-6 text-sm">
            <a href="/seller/help" className="hover:text-blue-400 transition-colors">
              Trung tâm hỗ trợ
            </a>
            <a href="/seller/guide" className="hover:text-blue-400 transition-colors">
              Hướng dẫn bán hàng
            </a>
            <a href="/seller/fees" className="hover:text-blue-400 transition-colors">
              Chính sách phí
            </a>
            <a href="/seller/terms" className="hover:text-blue-400 transition-colors">
              Điều khoản
            </a>
          </div>
          <div className="mt-4 text-xs text-gray-400">
            © 2025 AudioShop Seller Center. Bản quyền thuộc về AudioShop.
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerLayout;