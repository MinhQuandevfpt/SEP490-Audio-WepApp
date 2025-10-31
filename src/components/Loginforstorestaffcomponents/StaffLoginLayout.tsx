import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ArrowLeft, Users, Shield, Building2, Clock, CheckCircle } from 'lucide-react';

const StaffLoginLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link 
              to="/seller/login" 
              className="flex items-center text-gray-600 hover:text-emerald-600 transition-colors mr-8"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span>Quay lại đăng nhập chủ cửa hàng</span>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-2 rounded-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  AudioShop Staff Portal
                </h1>
                <p className="text-sm text-gray-600">Cổng đăng nhập dành cho nhân viên cửa hàng</p>
              </div>
            </div>
          </div>
          
          {/* Support info */}
          <div className="hidden md:flex items-center space-x-6 text-sm">
            <div className="flex items-center text-gray-600">
              <Shield className="w-4 h-4 mr-2" />
              <span>Bảo mật cao</span>
            </div>
            <div className="flex items-center text-gray-600">
              <Clock className="w-4 h-4 mr-2" />
              <span>Hỗ trợ 24/7</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex min-h-[calc(100vh-80px)]">
        {/* Left Side - Benefits & Features */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-500 to-teal-700 items-center justify-center relative overflow-hidden">
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
                <Building2 className="w-16 h-16 text-white" />
              </div>
              <h2 className="text-4xl font-bold mb-4">Quản lý cửa hàng thông minh</h2>
              <p className="text-xl opacity-90 mb-8">
                Hệ thống quản lý dành riêng cho nhân viên cửa hàng
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-6 text-left">
              <div className="bg-white bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center mb-3">
                  <div className="bg-white bg-opacity-30 rounded-lg p-2 mr-3">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg">Quản lý đơn hàng</h3>
                </div>
                <p className="text-sm opacity-90">
                  Xử lý đơn hàng, cập nhật trạng thái giao hàng và theo dõi tiến độ đơn hàng
                </p>
              </div>

              <div className="bg-white bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center mb-3">
                  <div className="bg-white bg-opacity-30 rounded-lg p-2 mr-3">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg">Chăm sóc khách hàng</h3>
                </div>
                <p className="text-sm opacity-90">
                  Hỗ trợ khách hàng, xử lý khiếu nại và tư vấn sản phẩm chuyên nghiệp
                </p>
              </div>

              <div className="bg-white bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center mb-3">
                  <div className="bg-white bg-opacity-30 rounded-lg p-2 mr-3">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg">Bảo mật thông tin</h3>
                </div>
                <p className="text-sm opacity-90">
                  Hệ thống bảo mật cao, phân quyền rõ ràng và theo dõi hoạt động
                </p>
              </div>

              <div className="bg-white bg-opacity-20 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex items-center mb-3">
                  <div className="bg-white bg-opacity-30 rounded-lg p-2 mr-3">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg">Làm việc linh hoạt</h3>
                </div>
                <p className="text-sm opacity-90">
                  Truy cập mọi lúc mọi nơi, đồng bộ dữ liệu real-time và báo cáo chi tiết
                </p>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <div className="text-2xl font-bold">500+</div>
                <div className="text-xs opacity-80">Nhân viên</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <div className="text-2xl font-bold">100+</div>
                <div className="text-xs opacity-80">Cửa hàng</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <div className="text-2xl font-bold">99.9%</div>
                <div className="text-xs opacity-80">Uptime</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
                {/* Right Side - Form */}
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
            <a href="/store-staff/help" className="hover:text-emerald-400 transition-colors">
              Trung tâm hỗ trợ
            </a>
            <a href="/store-staff/guide" className="hover:text-emerald-400 transition-colors">
              Hướng dẫn sử dụng
            </a>
            <a href="/store-staff/policy" className="hover:text-emerald-400 transition-colors">
              Chính sách bảo mật
            </a>
            <a href="/store-staff/terms" className="hover:text-emerald-400 transition-colors">
              Điều khoản
            </a>
          </div>
          <div className="mt-4 text-xs text-gray-400">
            © 2025 AudioShop Staff Portal. Bản quyền thuộc về AudioShop.
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffLoginLayout;
