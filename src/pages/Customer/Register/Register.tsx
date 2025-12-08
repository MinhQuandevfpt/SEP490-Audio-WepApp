import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, Phone, Loader2 } from 'lucide-react';
import { CustomerAuthService } from '../../../services/customer/Authcustomer';
import { showCenterSuccess, showCenterError } from '../../../utils/notification';
import { GoogleLoginButton } from '../../../components/common';
import { usePolicyCategories } from '../../../hooks/usePolicyCategories';
import { useLanguage } from '../../../contexts/LanguageContext';
import type { ApiError } from '../../../types/api';

const Register: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [policyCategoryId, setPolicyCategoryId] = useState<string>('');
  const { categories } = usePolicyCategories();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
    agreePromotions: false
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
      showCenterError(t('register.errors.passwordMismatch'), t('register.errors.validationError'));
      return;
    }

    if (!formData.agreeTerms) {
      showCenterError(t('register.errors.termsRequired'), t('register.errors.missingInfo'));
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
      showCenterError(validationErrors[0], t('register.errors.invalidInfo'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await CustomerAuthService.register(registerData);
      
      if (response.status === 201) {
        showCenterSuccess(
          t('register.success.message'),
          t('register.success.title'),
          2000
        );
        
        // Wait 2 seconds then redirect to login
        setTimeout(() => {
          navigate('/auth/login', { 
            state: { 
              message: t('register.success.redirectMessage'), 
              email: response.data.email 
            } 
          });
        }, 3000);
      }
    } catch (error) {
      const apiError = error as ApiError;
      const errorMessage = CustomerAuthService.formatApiError(apiError);
      showCenterError(errorMessage, t('register.errors.registerError'));
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">{t('register.title')}</h2>
        <p className="text-gray-600">{t('register.subtitle')}</p>
      </div>

      {/* Register Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('register.fullName')}
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
              placeholder={t('register.fullNamePlaceholder')}
              required
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('register.email')}
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
              placeholder={t('register.emailPlaceholder')}
              required
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('register.phone')}
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
              placeholder={t('register.phonePlaceholder')}
              required
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('register.password')}
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
              placeholder={t('register.passwordPlaceholder')}
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
            {t('register.confirmPassword')}
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
              placeholder={t('register.confirmPasswordPlaceholder')}
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
              {t('register.agreeTerms')}{' '}
              <Link 
                to={policyCategoryId ? `/policies/${policyCategoryId}?item=điều khoản` : '/policies'} 
                className="text-orange-500 hover:text-orange-600 font-medium"
              >
                {t('register.termsOfService')}
              </Link>{' '}
              {t('register.and')}{' '}
              <Link 
                to={policyCategoryId ? `/policies/${policyCategoryId}?item=chính sách bảo mật` : '/policies'} 
                className="text-orange-500 hover:text-orange-600 font-medium"
              >
                {t('register.privacyPolicy')}
              </Link>{' '}
              {t('register.ofAudioShop')}
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
              <span>{t('register.registering')}</span>
            </div>
          ) : (
            t('register.registerButton')
          )}
        </button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">{t('register.orRegisterWith')}</span>
          </div>
        </div>

        {/* Social Register */}
        <div className="space-y-3">
          <GoogleLoginButton text={t('register.registerWithGoogle')} />
        </div>
      </form>

      {/* Login Link */}
      <div className="mt-8 text-center">
        <p className="text-gray-600">
          {t('register.hasAccount')}{' '}
          <Link
            to="/auth/login"
            className="text-orange-500 hover:text-orange-600 font-medium"
          >
            {t('register.loginNow')}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;