import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Phone, Loader2 } from 'lucide-react';
import { CustomerAuthService } from '../../../services/customer/Authcustomer';
import { showCenterError, showCenterSuccess } from '../../../utils/notification';
import { GoogleLoginButton } from '../../../components/common';
import { useLanguage } from '../../../contexts/LanguageContext';
import type { ApiError } from '../../../types/api';

const Login: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    rememberMe: false
  });
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isSendingReset, setIsSendingReset] = useState(false);

  // Check for message from registration - just pre-fill email if provided
  useEffect(() => {
    if (location.state?.email) {
      setFormData(prev => ({ ...prev, email: location.state.email }));
    }
  }, [location.state]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleResendVerifyEmail = async () => {
    if (!formData.email) {
      showCenterError(t('login.errors.emailRequired'), t('login.errors.missingInfo'));
      return;
    }
    try {
      const res = await CustomerAuthService.resendVerifyEmail(formData.email, 'CUSTOMER');
      if (res?.status === 200) {
        showCenterSuccess(res.message || 'Đã gửi lại email xác nhận', 'Thành công');
      } else {
        showCenterError(res?.message || 'Không thể gửi lại email xác nhận', 'Lỗi');
      }
    } catch (error: any) {
      const msg = error?.message || 'Không thể gửi lại email xác nhận';
      showCenterError(msg, 'Lỗi');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare login data - API chỉ support email login
    const loginData = {
      email: formData.email,
      password: formData.password
    };

    // Basic validation
    if (!loginData.email) {
      showCenterError(t('login.errors.emailRequired'), t('login.errors.missingInfo'));
      return;
    }
    
    // Note: Phone login not supported by current API
    if (loginMethod === 'phone') {
      showCenterError(t('login.errors.phoneNotSupported'), t('login.errors.featureNotAvailable'));
      return;
    }
    
    if (!loginData.password) {
      showCenterError(t('login.errors.passwordRequired'), t('login.errors.missingInfo'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await CustomerAuthService.login(loginData);
      
      if (response.status === 200) {
        // Get the customer profile that was loaded during login
        const customerProfile = CustomerAuthService.getCurrentUser();
        const displayName = customerProfile?.full_name || 'người dùng';
        
        // Check if there's a redirect URL saved before login
        const redirectUrl = localStorage.getItem('redirectAfterLogin');
        if (redirectUrl) {
          // Clear the saved URL
          localStorage.removeItem('redirectAfterLogin');
          // Redirect back to the previous page (don't show welcome popup)
          navigate(redirectUrl);
        } else {
          // Only show welcome message when going to homepage
          sessionStorage.setItem('welcomeMessage', JSON.stringify({
            userName: displayName,
            showWelcome: true
          }));
          // Default redirect to homepage
          navigate('/');
        }
      }
    } catch (error) {
      const apiError = error as ApiError;
      const errorMessage = CustomerAuthService.formatApiError(apiError);
      showCenterError(errorMessage, t('login.errors.loginError'));
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">{t('login.title')}</h2>
        <p className="text-gray-600">{t('login.welcome')}</p>
      </div>

      {/* Login Method Toggle */}
      <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
        <button
          type="button"
          onClick={() => setLoginMethod('email')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
            loginMethod === 'email'
              ? 'bg-white text-orange-500 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Mail className="w-4 h-4 inline mr-2" />
          {t('login.email')}
        </button>
        <button
          type="button"
          onClick={() => setLoginMethod('phone')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
            loginMethod === 'phone'
              ? 'bg-white text-orange-500 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <Phone className="w-4 h-4 inline mr-2" />
          {t('login.phone')}
        </button>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email/Phone Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {loginMethod === 'email' ? t('login.email') : t('login.phone')}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {loginMethod === 'email' ? (
                <Mail className="h-5 w-5 text-gray-400" />
              ) : (
                <Phone className="h-5 w-5 text-gray-400" />
              )}
            </div>
            <input
              type={loginMethod === 'email' ? 'email' : 'tel'}
              name={loginMethod}
              value={formData[loginMethod]}
              onChange={handleInputChange}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder={
                loginMethod === 'email' 
                  ? t('login.emailPlaceholder')
                  : t('login.phonePlaceholder')
              }
              required
            />
          </div>
        </div>

        {/* Password Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('login.password')}
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
              placeholder={t('login.passwordPlaceholder')}
              required
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

        {/* Remember Me, Forgot password trigger, Resend verify email */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleInputChange}
                className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-600">{t('login.rememberMe')}</span>
            </label>
            <button
              type="button"
              onClick={() => {
                setForgotEmail(formData.email || '');
                setShowForgotModal(true);
              }}
              className="text-sm text-orange-500 hover:text-orange-600 font-medium"
            >
              {t('login.forgotPassword')}
            </button>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleResendVerifyEmail}
              className="text-xs text-orange-500 hover:text-orange-600 font-medium underline"
            >
              Gửi lại mail xác nhận
            </button>
          </div>
        </div>

        {/* Login Button */}
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
              <span>{t('login.loggingIn')}</span>
            </div>
          ) : (
            t('login.loginButton')
          )}
        </button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">{t('login.or')}</span>
          </div>
        </div>

        {/* Social Login */}
        <div className="space-y-3">
          <GoogleLoginButton />
          
         
        </div>
      </form>

      {/* Register Link */}
      <div className="mt-8 text-center">
        <p className="text-gray-600">
          {t('login.noAccount')}{' '}
          <Link
            to="/auth/register"
            className="text-orange-500 hover:text-orange-600 font-medium"
          >
            {t('login.registerNow')}
          </Link>
        </p>
      </div>

      {/* Forgot password modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Quên mật khẩu</h3>
            <p className="text-sm text-gray-600 mb-4">
              Nhập email của bạn để nhận link đặt lại mật khẩu.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Nhập email"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={isSendingReset}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!forgotEmail.trim()) {
                      showCenterError('Vui lòng nhập email.', 'Thiếu thông tin');
                      return;
                    }
                    try {
                      setIsSendingReset(true);
                      const res = await CustomerAuthService.forgotPassword(forgotEmail.trim());
                      if (res?.status === 200) {
                        showCenterSuccess(res.message || 'Kiểm tra email của bạn', 'Thành công');
                        setShowForgotModal(false);
                      } else {
                        showCenterError(res?.message || 'Không thể gửi email reset', 'Lỗi');
                      }
                    } catch (error: any) {
                      showCenterError(error?.message || 'Không thể gửi email reset', 'Lỗi');
                    } finally {
                      setIsSendingReset(false);
                    }
                  }}
                  className="px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-lg disabled:opacity-60"
                  disabled={isSendingReset}
                >
                  {isSendingReset ? 'Đang gửi...' : 'Gửi email reset'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;