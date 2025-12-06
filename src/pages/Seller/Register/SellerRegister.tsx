import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Eye, 
  EyeOff, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Store,
} from 'lucide-react';
import { showTikiNotification } from '../../../utils/notification';
import { SellerAuthService } from '../../../services/seller/AuthSeller';
import { usePolicyCategories } from '../../../hooks/usePolicyCategories';
import type { SellerRegisterRequest } from '../../../types/seller';

const SellerRegister: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [policyCategoryId, setPolicyCategoryId] = useState<string>('');
  const { categories } = usePolicyCategories();
  const [formData, setFormData] = useState({
    // Basic account info only
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
    agreeMarketing: false
  });

  // Find policy category ID by name
  useEffect(() => {
    if (categories.length > 0) {
      const policyCategory = categories.find(
        (cat: { name: string }) => cat.name.toLowerCase().includes('thông tin') || cat.name.toLowerCase().includes('chính sách')
      );
      if (policyCategory) {
        setPolicyCategoryId(policyCategory.id);
      }
    }
  }, [categories]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
      showTikiNotification('Mật khẩu xác nhận không khớp!', 'Lỗi', 'error');
      return;
    }

    if (formData.password.length < 6) {
      showTikiNotification('Mật khẩu phải có ít nhất 6 ký tự!', 'Lỗi', 'error');
      return;
    }

    if (!formData.agreeTerms) {
      showTikiNotification('Bạn phải đồng ý với điều khoản dịch vụ để tiếp tục!', 'Lỗi', 'error');
      return;
    }

    setIsLoading(true);

    try {
      // Prepare registration data
      const registerData: SellerRegisterRequest = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      };

      // Call seller register API
      const response = await SellerAuthService.register(registerData);
      
      if (response.status === 201) {
        showTikiNotification(
          'Đăng ký thành công! Bạn sẽ được chuyển đến trang đăng nhập.', 
          'Thành công', 
          'success',
          3000
        );
        
        // Redirect to login page after successful registration
        setTimeout(() => {
          navigate('/seller/login');
        }, 1500);
      } else {
        throw new Error(response.message || 'Đăng ký thất bại');
      }
    } catch (error: any) {
      console.error('Registration failed:', error);
      const errorMessage = error.message || 'Đăng ký thất bại. Vui lòng thử lại!';
      showTikiNotification(errorMessage, 'Lỗi', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const renderRegisterForm = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Họ và tên *
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Nhập họ và tên"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email *
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Nhập email kinh doanh"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Số điện thoại *
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Nhập số điện thoại"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mật khẩu *
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Nhập mật khẩu (ít nhất 8 ký tự)"
            required
            minLength={8}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5 text-gray-400" />
            ) : (
              <Eye className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Xác nhận mật khẩu *
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Nhập lại mật khẩu"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
          >
            {showConfirmPassword ? (
              <EyeOff className="w-5 h-5 text-gray-400" />
            ) : (
              <Eye className="w-5 h-5 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Agreements */}
      <div className="space-y-4 pt-4 border-t border-gray-200">
        <label className="flex items-start">
          <input
            type="checkbox"
            name="agreeTerms"
            checked={formData.agreeTerms}
            onChange={handleInputChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
            required
          />
          <span className="ml-3 text-sm text-gray-600">
            Tôi đồng ý với{' '}
            <Link 
              to={policyCategoryId ? `/policies/${policyCategoryId}?item=điều khoản` : '/policies'} 
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Điều khoản dịch vụ
            </Link>{' '}
            và{' '}
            <Link 
              to={policyCategoryId ? `/policies/${policyCategoryId}?item=chính sách bảo mật` : '/policies'} 
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Chính sách bảo mật
            </Link>{' '}
            của AudioShop *
          </span>
        </label>

       
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 rounded-full inline-block mb-4">
          <Store className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Đăng ký Seller</h2>
        <p className="text-gray-600">Bắt đầu kinh doanh cùng AudioShop</p>
      </div>

      {/* Form Content */}
      <form onSubmit={handleSubmit}>
        {renderRegisterForm()}

        {/* Submit Button */}
        <div className="mt-8">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
          </button>
        </div>
      </form>

      {/* Login Link */}
      <div className="mt-8 text-center">
        <p className="text-gray-600">
          Đã có tài khoản Seller?{' '}
          <Link
            to="/seller/login"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SellerRegister;