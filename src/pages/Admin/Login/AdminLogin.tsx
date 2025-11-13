import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminAuthService } from '../../../services/admin/AdminAuthService';
import { showCenterError } from '../../../utils/notification';
import { 
  ShieldCheck, 
  TrendingUp, 
  Users, 
  Package, 
  BarChart3,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight
} from 'lucide-react';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      showCenterError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setIsLoading(true);
    try {
      const response = await AdminAuthService.login(formData);
      if (response.success) {
        // Lưu thông báo vào sessionStorage thay vì hiện ngay
        sessionStorage.setItem('adminLoginSuccess', JSON.stringify({
          message: 'Đăng nhập thành công! Chào mừng bạn đến với Admin Dashboard.',
          timestamp: Date.now()
        }));
        
        // Navigate ngay lập tức, không setTimeout
        navigate('/admin/dashboard');
      } else {
        showCenterError(response.message || 'Đăng nhập thất bại');
      }
    } catch (error) {
      showCenterError('Đã xảy ra lỗi trong quá trình đăng nhập');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Thống kê thời gian thực',
      description: 'Theo dõi doanh thu và hiệu suất kinh doanh mọi lúc mọi nơi',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Quản lý toàn diện',
      description: 'Kiểm soát người dùng, đơn hàng và sản phẩm từ một nền tảng',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: <Package className="w-6 h-6" />,
      title: 'Quản lý sản phẩm',
      description: 'Tự động hóa quản lý tồn kho và cảnh báo hết hàng',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: 'Bảo mật cấp ngân hàng',
      description: 'Mã hóa end-to-end và xác thực đa lớp cho mọi giao dịch',
      color: 'from-green-500 to-emerald-500'
    }
  ];

  const stats = [
    { value: '99.9%', label: 'Uptime' },
    { value: '24/7', label: 'Hỗ trợ' },
    { value: '<100ms', label: 'Tốc độ' }
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding & Features */}
      <div className="hidden lg:flex lg:w-[55%] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-purple-600/20 via-transparent to-transparent"></div>
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-blue-600/20 via-transparent to-transparent"></div>
          
          {/* Floating Orbs */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-purple-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-700"></div>
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 text-white w-full">
          {/* Header */}
          <div>
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50">
                <TrendingUp className="w-7 h-7" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">AudioShop</h1>
                <p className="text-sm text-purple-200">Admin Dashboard</p>
              </div>
            </div>

            <div className="max-w-md">
              <h2 className="text-4xl xl:text-5xl font-bold mb-4 leading-tight">
                Nền tảng quản lý
                <span className="block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  thương mại điện tử
                </span>
              </h2>
              <p className="text-lg text-slate-300 leading-relaxed">
                Công cụ mạnh mẽ giúp bạn kiểm soát mọi khía cạnh của cửa hàng trực tuyến
              </p>
            </div>
          </div>

          {/* Features Grid */}
          <div className="space-y-4 my-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:border-white/20"
              >
                <div className="flex items-start space-x-4">
                  <div className={`flex-shrink-0 w-12 h-12 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow`}>
                    {feature.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-white mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Stats Footer */}
          <div className="grid grid-cols-3 gap-4 pt-8 border-t border-white/10">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-400 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-[45%] flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl mb-4 shadow-xl shadow-purple-500/30">
              <TrendingUp className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">AudioStore Admin</h2>
            <p className="text-sm text-gray-500 mt-1">Đăng nhập để quản lý cửa hàng</p>
          </div>

          {/* Login Card */}
          <div className="space-y-8">
            {/* Header */}
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">Chào mừng trở lại</h3>
              <p className="text-gray-500">Đăng nhập để tiếp tục quản lý hệ thống của bạn</p>
            </div>

            {/* Trust Badges */}
           
            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email 
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="block w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-gray-400"
                    placeholder="admin@audiostore.com"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                  Mật khẩu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="block w-full pl-12 pr-12 py-3.5 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all hover:border-gray-400"
                    placeholder="••••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="group w-full flex justify-center items-center py-4 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transform hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Đang xác thực...</span>
                  </>
                ) : (
                  <>
                    <span>Đăng nhập vào hệ thống</span>
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>© 2025 AudioStore Platform</span>
                <div className="flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                  <span>Bảo mật cao</span>
                </div>
              </div>
            </div>

           
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;