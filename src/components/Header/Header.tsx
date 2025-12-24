import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, Shield, Truck, Gift, Clock, DollarSign, LogOut } from 'lucide-react';
import { CustomerAuthService } from '../../services/customer/Authcustomer';
import { CustomerCategoryService } from '../../services/customer/CategoryService';
import CartDropdown from './CartDropdown';
import NotificationDropdown from './NotificationDropdown';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '../../contexts/LanguageContext';
import type { CategoryItem } from '../../types/api';

const Header: React.FC = () => {
  const location = useLocation();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');

  // Check if current page is account page
  const isAccountPage = location.pathname.startsWith('/account');

  // Set search keyword from URL params when on search page
  useEffect(() => {
    if (location.pathname === '/search') {
      const params = new URLSearchParams(location.search);
      const keyword = params.get('keyword');
      if (keyword) {
        setSearchKeyword(keyword);
      }
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    const checkAuth = () => {
      const authStatus = CustomerAuthService.isAuthenticated();
      const user = CustomerAuthService.getCurrentUser();
      setIsAuthenticated(authStatus);
      setCurrentUser(user);
    };

    // Load categories from API
    const loadCategories = async () => {
      try {
        const response = await CustomerCategoryService.getAllCategories();
        if (response.data && Array.isArray(response.data)) {
          // Lấy tối đa 6 categories để hiển thị
          setCategories(response.data.slice(0, 6));
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
        // Keep empty array if failed
      }
    };

    checkAuth();
    loadCategories();
    
    // Listen for storage changes (when user logs in/out)
    window.addEventListener('storage', checkAuth);
    
    // Check for auth state changes every 500ms (for OAuth2 flow)
    const authCheckInterval = setInterval(() => {
      const authStateChanged = localStorage.getItem('authStateChanged');
      if (authStateChanged) {
        localStorage.removeItem('authStateChanged');
        checkAuth();
      }
    }, 500);
    
    return () => {
      window.removeEventListener('storage', checkAuth);
      clearInterval(authCheckInterval);
    };
  }, []);

  const handleLogout = () => {
    try {
      // Clear auth state immediately
      setIsAuthenticated(false);
      setCurrentUser(null);
      
      // Call logout service to clear all data
      CustomerAuthService.logout();
      
      // Small delay to ensure localStorage is cleared before redirect
      setTimeout(() => {
        window.location.href = '/'; // Hard refresh to clear any cached state
      }, 100);
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if there's an error
      window.location.href = '/';
    }
  };

  const getEncodedCustomerParam = () => {
    try {
      const id = localStorage.getItem('customerId');
      if (!id) return '';
      const encoded = btoa(id).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
      return `?u=${encoded}`;
    } catch {
      return '';
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      navigate(`/search?keyword=${encodeURIComponent(searchKeyword.trim())}`);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200">
      {/* Top bar */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-2 text-xs sm:text-sm">
            {/* Left side - Hidden on mobile */}
            <div className="hidden md:flex space-x-4 lg:space-x-6">
              <Link to="/seller/login" className="text-blue-600 hover:text-gray-900">
                {t('header.sellWithUs')}
              </Link>
              {/* Special highlight for 3D room experience link */}
              <>
                <style>
                  {`
                    @keyframes blinkBlueRed {
                      0%, 100% { color: #2563eb; } /* blue-600 */
                      50% { color: #ef4444; }      /* red-500 */
                    }
                    .link-blink-blue-red {
                      animation: blinkBlueRed 1.2s infinite;
                    }
                  `}
                </style>
                <Link
                  to="/3d-room"
                  className="relative inline-flex items-center link-blink-blue-red font-semibold"
                >
                  {t('header.experienceRoom')}
                  {/* HOT badge shifted to the top-right, not covering text */}
                  <span className="absolute -top-3 right-0 translate-x-full px-1.5 py-0.5 text-[9px] font-bold uppercase bg-red-500 text-white rounded-full animate-pulse shadow-md">
                    NEW
                  </span>
                </Link>
              </>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Support - Hidden on mobile */}
              <Link to="/policies" className="hidden sm:block text-gray-600 hover:text-gray-900">
                {t('header.support')}
              </Link>
              
              {/* Language Switcher */}
              <LanguageSwitcher />
              
              {isAuthenticated ? (
                <div className="flex items-center space-x-2 sm:space-x-4">
                  {/* User name - Hidden on mobile */}
                  <span className="hidden sm:inline text-sm text-gray-600">
                    {t('header.hello')}, <span className="font-medium text-gray-800">{currentUser?.full_name}</span>
                  </span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center text-gray-600 hover:text-red-600 transition-colors"
                    title={t('header.logout')}
                  >
                    <LogOut className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline text-sm">{t('header.logout')}</span>
                  </button>
                </div>
              ) : (
                <>
                  <Link to="/auth/login" className="font-black text-black hover:text-gray-900 text-xs sm:text-sm">
                    {t('header.login')}
                  </Link>
                  <span className="text-gray-400 hidden sm:inline">/</span>
                  <Link to="/auth/register" className="font-black text-black hover:text-gray-900 text-xs sm:text-sm">
                    {t('header.register')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between py-3 sm:py-4 gap-3 sm:gap-0">
          {/* Logo */}
          <div className="flex items-center w-full sm:w-auto justify-between sm:justify-start">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-xl sm:text-2xl font-bold">
                <span className="text-orange-500">Audio</span>
                <span className="text-blue-600">Shop</span>
              </span>
            </Link>

            {/* Right side actions - Mobile: Show on same row as logo */}
            <div className="flex items-center space-x-3 sm:hidden">
              {/* User Account - Icon only */}
              <Link 
                to={isAuthenticated ? `/account${getEncodedCustomerParam()}` : '/auth/login'} 
                className={`transition-colors ${
                  isAccountPage 
                    ? 'text-orange-500' 
                    : 'text-gray-700 hover:text-orange-500'
                }`}
                title={t('header.account')}
              >
                <User className="w-5 h-5" />
              </Link>

              {/* Shopping Cart with Dropdown */}
              <CartDropdown />

              {/* Notifications Dropdown */}
              <NotificationDropdown />
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 w-full sm:max-w-2xl sm:mx-4 lg:mx-8 order-3 sm:order-2">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder={t('header.searchPlaceholder')}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm sm:text-base"
              />
              <button 
                type="submit"
                className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 bg-orange-500 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-md hover:bg-orange-600"
                aria-label="Tìm kiếm"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>

            {/* Navigation categories below search - Hidden on mobile */}
            <div className="hidden md:block mt-3">
              <nav className="flex space-x-4 lg:space-x-6 overflow-x-auto">
                {categories.length > 0 ? (
                  categories.map((category, index) => (
                    <a 
                      key={category.categoryId}
                      href={`/products?category=${encodeURIComponent(category.name)}`} 
                      className={`text-gray-700 hover:text-orange-500 font-medium text-sm whitespace-nowrap ${
                        index === 0 ? 'border-b-2 border-orange-500' : ''
                      }`}
                    >
                      {category.name}
                    </a>
                  ))
                ) : (
                  // Fallback while loading
                  <span className="text-gray-400 text-sm">{t('header.loadingCategories')}</span>
                )}
              </nav>
            </div>
          </div>

          {/* Right side actions - Desktop */}
          <div className="hidden sm:flex items-center space-x-3 lg:space-x-4 order-2 sm:order-3">
            {/* User Account */}
            <Link 
              to={isAuthenticated ? `/account${getEncodedCustomerParam()}` : '/auth/login'} 
              className={`flex items-center space-x-1 transition-colors ${
                isAccountPage 
                  ? 'text-orange-500 font-semibold' 
                  : 'text-gray-700 hover:text-orange-500'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="text-sm">{t('header.account')}</span>
            </Link>

            {/* Divider */}
            <span className="text-gray-300">|</span>

            {/* Shopping Cart with Dropdown */}
            <CartDropdown />

            {/* Notifications Dropdown */}
            <NotificationDropdown />
          </div>
        </div>
      </div>

      {/* Commitment/Trust badges */}
      <div className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop: Horizontal layout */}
          <div className="hidden md:flex items-center justify-center space-x-4 lg:space-x-8 py-3">
            <span className="text-blue-600 font-semibold text-sm lg:text-base">{t('header.commitment')}</span>

            <div className="flex items-center space-x-2 text-gray-700">
              <Shield className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600" />
              <span className="text-xs lg:text-sm font-medium">{t('header.authentic')}</span>
            </div>

            <div className="flex items-center space-x-2 text-gray-700">
              <Truck className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600" />
              <span className="text-xs lg:text-sm font-medium">{t('header.fastShipping')}</span>
            </div>

            <div className="flex items-center space-x-2 text-gray-700">
              <Gift className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600" />
              <span className="text-xs lg:text-sm font-medium">{t('header.attractiveOffer')}</span>
            </div>

            <div className="flex items-center space-x-2 text-gray-700">
              <Clock className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600" />
              <span className="text-xs lg:text-sm font-medium">{t('header.return')}</span>
            </div>

            <div className="flex items-center space-x-2 text-gray-700">
              <DollarSign className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600" />
              <span className="text-xs lg:text-sm font-medium">{t('header.cheapPrice')}</span>
            </div>
          </div>

          {/* Mobile: Scrollable horizontal layout */}
          <div className="md:hidden py-2 overflow-x-auto">
            <div className="flex items-center space-x-4 min-w-max px-2">
              <span className="text-blue-600 font-semibold text-xs whitespace-nowrap">{t('header.commitment')}</span>

              <div className="flex items-center space-x-1 text-gray-700">
                <Shield className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span className="text-xs font-medium whitespace-nowrap">{t('header.authentic')}</span>
              </div>

              <div className="flex items-center space-x-1 text-gray-700">
                <Truck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span className="text-xs font-medium whitespace-nowrap">{t('header.fastShipping')}</span>
              </div>

              <div className="flex items-center space-x-1 text-gray-700">
                <Gift className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span className="text-xs font-medium whitespace-nowrap">{t('header.attractiveOffer')}</span>
              </div>

              <div className="flex items-center space-x-1 text-gray-700">
                <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span className="text-xs font-medium whitespace-nowrap">{t('header.return')}</span>
              </div>

              <div className="flex items-center space-x-1 text-gray-700">
                <DollarSign className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span className="text-xs font-medium whitespace-nowrap">{t('header.cheapPrice')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
