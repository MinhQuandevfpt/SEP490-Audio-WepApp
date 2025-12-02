import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Store, Shield } from 'lucide-react';
import { showCenterError } from '../../../utils/notification';
import { SellerAuthService } from '../../../services/seller/AuthSeller';
import type { SellerLoginRequest } from '../../../types/seller';

const SellerLogin: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.email || !formData.password) {
      showCenterError('Vui lòng điền đầy đủ thông tin!', 'Thiếu thông tin');
      return;
    }

    setIsLoading(true);

    try {
      // Clear any old cache before login
      localStorage.removeItem('seller_store_id');
      localStorage.removeItem('seller_store_info');
      
      // Prepare login data
      const loginData: SellerLoginRequest = {
        email: formData.email,
        password: formData.password,
      };

      // Call seller login API
      const response = await SellerAuthService.login(loginData);
      
      if (response.status === 200) {
        // Login API đã trả về storeId trong response.data.user.storeId
        // Không cần gọi thêm API để lấy store status hoặc store ID nữa
        
        // Lưu message vào sessionStorage để hiển thị sau
        sessionStorage.setItem('sellerLoginSuccess', JSON.stringify({
          message: 'Đăng nhập thành công! Chào mừng bạn đến với AudioShop.',
          timestamp: Date.now()
        }));
        
        // Navigate trực tiếp đến kyc-status, component đó sẽ tự check status và redirect
        // Cách này nhanh hơn vì không cần gọi thêm API ở đây
        navigate('/seller/kyc-status', { replace: true });
      } else {
        throw new Error(response.message || 'Đăng nhập thất bại');
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      const errorMessage = error.message || 'Thông tin đăng nhập không chính xác!';
      showCenterError(errorMessage, 'Lỗi đăng nhập');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 rounded-full inline-block mb-4">
          <Store className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Đăng nhập</h2>
        <p className="text-gray-600">Truy cập vào Seller Center để quản lý cửa hàng</p>
      </div>

      {/* Security Badge */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center text-blue-700">
          <Shield className="w-5 h-5 mr-2" />
          <span className="text-sm font-medium">Bảo mật cao cấp cho tài khoản kinh doanh</span>
        </div>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Input */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Email đăng ký kinh doanh *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="block w-full pl-10 pr-3 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Nhập email kinh doanh của bạn"
              required
            />
          </div>
        </div>

        {/* Password Input */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Mật khẩu *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="block w-full pl-10 pr-12 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="Nhập mật khẩu"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
              )}
            </button>
          </div>
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input
              type="checkbox"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-600">Ghi nhớ đăng nhập</span>
          </label>
          <Link
            to="/seller/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            Quên mật khẩu?
          </Link>
        </div>

        {/* Login Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>

       

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Hoặc</span>
          </div>
        </div>

        {/* Quick Registration CTA */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-6 text-center">
          <h3 className="font-semibold text-gray-800 mb-2">Bạn đã có tài khoản?</h3>
          <p className="text-sm text-gray-600 mb-4">
            Đăng ký ngay để bắt đầu kinh doanh cùng AudioShop
          </p>
          <div className="space-y-3">
            <Link
              to="/seller/register"
              className="block w-full bg-white text-blue-600 py-3 px-4 rounded-lg font-medium border border-blue-600 hover:bg-blue-50 transition-colors"
            >
              Đăng ký 
            </Link>
            
          </div>
        </div>
      </form>

     
    </div>
  );
};

export default SellerLogin;