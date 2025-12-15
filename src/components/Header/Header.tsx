import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, Shield, Truck, RotateCcw, Clock, DollarSign, LogOut } from 'lucide-react';
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
          <div className="flex justify-between items-center py-2 text-sm">
            <div className="flex space-x-6">
              <Link to="/seller/login" className="text-blue-600 hover:text-gray-900">
                {t('header.sellWithUs')}
              </Link>
              <Link to="/3d-room" className="text-blue-600 hover:text-gray-900">
                {t('header.experienceRoom')}
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/policies" className="text-gray-600 hover:text-gray-900">
                {t('header.support')}
              </Link>
              
              {/* Language Switcher */}
              <LanguageSwitcher />
              
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {t('header.hello')}, <span className="font-medium text-gray-800">{currentUser?.full_name}</span>
                  </span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center text-gray-600 hover:text-red-600 transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-1" />
                    <span className="text-sm">{t('header.logout')}</span>
                  </button>
                </div>
              ) : (
                <>
                  <Link to="/auth/login" className="font-black text-black hover:text-gray-900">
                    {t('header.login')}
                  </Link>
                  <span className="text-gray-400">/</span>
                  <Link to="/auth/register" className="font-black text-black hover:text-gray-900">
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
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold">
                <span className="text-orange-500">Audio</span>
                <span className="text-blue-600">Shop</span>
              </span>
            </Link>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-2xl mx-8">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder={t('header.searchPlaceholder')}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <button 
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>

            {/* Navigation categories below search */}
            <div className="mt-3">
              <nav className="flex space-x-6">
                {categories.length > 0 ? (
                  categories.map((category, index) => (
                    <a 
                      key={category.categoryId}
                      href={`/products?category=${encodeURIComponent(category.name)}`} 
                      className={`text-gray-700 hover:text-orange-500 font-medium text-sm ${
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

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
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
          <div className="flex items-center justify-center space-x-8 py-3">
            <span className="text-blue-600 font-semibold">{t('header.commitment')}</span>

            <div className="flex items-center space-x-2 text-gray-700">
              <Shield className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">{t('header.authentic')}</span>
            </div>

            <div className="flex items-center space-x-2 text-gray-700">
              <Truck className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">{t('header.fastShipping')}</span>
            </div>

            <div className="flex items-center space-x-2 text-gray-700">
              <RotateCcw className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">{t('header.refund')}</span>
            </div>

            <div className="flex items-center space-x-2 text-gray-700">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">{t('header.return')}</span>
            </div>

           <div className="flex items-center space-x-2 text-gray-700">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">{t('header.cheapPrice')}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
