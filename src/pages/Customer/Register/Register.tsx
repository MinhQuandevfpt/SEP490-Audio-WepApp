import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Phone, Loader2 } from 'lucide-react';
import { CustomerAuthService } from '../../../services/customer/Authcustomer';
import { showCenterSuccess, showCenterError } from '../../../utils/notification';
import { GoogleLoginButton } from '../../../components/common';
import type { ApiError } from '../../../types/api';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
    agreePromotions: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      showCenterError('Mật khẩu xác nhận không khớp!', 'Lỗi xác thực');
      return;
    }

    if (!formData.agreeTerms) {
      showCenterError('Bạn phải đồng ý với điều khoản dịch vụ để tiếp tục!', 'Thiếu thông tin');
      return;
    }

    // Prepare API data
    const registerData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password
    };

    // Client-side validation
    const validationErrors = CustomerAuthService.validateRegisterData(registerData);
    if (validationErrors.length > 0) {
      showCenterError(validationErrors[0], 'Thông tin không hợp lệ');
      return;
    }

    setIsLoading(true);

    try {
      const response = await CustomerAuthService.register(registerData);
      
      if (response.status === 201) {
        showCenterSuccess(
          'Bạn sẽ được chuyển đến trang đăng nhập sau 3 giây...',
          'Đăng ký thành công!',
          3000
        );
        
        // Wait 3 seconds then redirect to login
        setTimeout(() => {
          navigate('/auth/login', { 
            state: { 
              message: 'Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.', 
              email: response.data.email 
            } 
          });
        }, 3000);
      }
    } catch (error) {
      const apiError = error as ApiError;
      const errorMessage = CustomerAuthService.formatApiError(apiError);
      showCenterError(errorMessage, 'Lỗi đăng ký');
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Đăng ký</h2>
        <p className="text-gray-600">Tạo tài khoản để bắt đầu mua sắm!</p>
      </div>

      {/* Register Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Họ và tên *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Nhập họ và tên của bạn"
              required
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email *
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
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Nhập email của bạn"
              required
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Số điện thoại *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Nhập số điện thoại"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
              className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Nhập mật khẩu (ít nhất 6 ký tự)"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Xác nhận mật khẩu *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Nhập lại mật khẩu"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="space-y-3">
          <label className="flex items-start">
            <input
              type="checkbox"
              name="agreeTerms"
              checked={formData.agreeTerms}
              onChange={handleInputChange}
              className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded mt-1"
              required
            />
            <span className="ml-3 text-sm text-gray-600">
              Tôi đồng ý với{' '}
              <Link to="/terms" className="text-orange-500 hover:text-orange-600 font-medium">
                Điều khoản dịch vụ
              </Link>{' '}
              và{' '}
              <Link to="/privacy" className="text-orange-500 hover:text-orange-600 font-medium">
                Chính sách bảo mật
              </Link>{' '}
              của AudioShop *
            </span>
          </label>
          
         
        </div>

        {/* Register Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 px-4 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all transform ${
            isLoading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 hover:scale-[1.02]'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span>Đang đăng ký...</span>
            </div>
          ) : (
            'Đăng ký'
          )}
        </button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Hoặc đăng ký với</span>
          </div>
        </div>

        {/* Social Register */}
        <div className="space-y-3">
          <GoogleLoginButton text="Đăng ký với Google" />
          
          <button
            type="button"
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            <svg className="w-5 h-5 mr-3" fill="#1877F2" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Đăng ký với Facebook
          </button>
        </div>
      </form>

      {/* Login Link */}
      <div className="mt-8 text-center">
        <p className="text-gray-600">
          Đã có tài khoản?{' '}
          <Link
            to="/auth/login"
            className="text-orange-500 hover:text-orange-600 font-medium"
          >
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;