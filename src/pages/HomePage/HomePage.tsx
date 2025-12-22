import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import Sidebar from '../../components/Sidebar';
import BannerSlider from '../../components/BannerSlider';
import FlashSaleHome from '../../components/FlashSale/FlashSaleHome';
import ProductSuggestions from '../../components/ProductSuggestions';
import { showCenterSuccess } from '../../utils/notification';
import { Menu, X } from 'lucide-react';

const HomePage: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Check for welcome message after login
  useEffect(() => {
    const welcomeData = sessionStorage.getItem('welcomeMessage');
    if (welcomeData) {
      try {
        const { userName, showWelcome } = JSON.parse(welcomeData);
        if (showWelcome) {
          showCenterSuccess(
            `Chào mừng ${userName} trở lại!`,
            'Đăng nhập thành công!',
            3000
          );
          // Clear the welcome message immediately after showing
          sessionStorage.removeItem('welcomeMessage');
        }
      } catch (error) {
        console.error('Error parsing welcome message:', error);
        sessionStorage.removeItem('welcomeMessage');
      }
    }
    
    // Cleanup: Ensure welcome message is cleared when component unmounts
    return () => {
      sessionStorage.removeItem('welcomeMessage');
    };
  }, []);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Mobile Menu Button - Only show on mobile */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            aria-label="Mở menu danh mục"
          >
            <Menu className="w-5 h-5" />
            <span className="font-medium">Danh mục sản phẩm</span>
          </button>
        </div>

        {/* Main content with sidebar layout */}
        <div className="flex gap-6">
          {/* Left Sidebar - Categories - Hidden on mobile, shown on desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-4">
              <Sidebar />
            </div>
          </aside>

          {/* Mobile Sidebar - Drawer style */}
          {isSidebarOpen && (
            <>
              {/* Overlay */}
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                onClick={() => setIsSidebarOpen(false)}
              />
              {/* Sidebar Drawer */}
              <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white z-50 shadow-2xl overflow-y-auto lg:hidden">
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between z-10">
                  <h3 className="text-lg font-semibold text-gray-900">Danh mục sản phẩm</h3>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Đóng menu"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                <div className="p-2">
                  <Sidebar hideHeader={true} />
                </div>
              </aside>
            </>
          )}

          {/* Right Content - Full width on mobile */}
          <main className="flex-1 space-y-4 sm:space-y-6 min-w-0">
            {/* Banner Section */}
            <BannerSlider />

            {/* Flash Sale Section */}
            <FlashSaleHome />

            {/* Product Suggestions Section */}
            <ProductSuggestions />
          </main>
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;