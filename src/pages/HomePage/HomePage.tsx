import React, { useEffect } from 'react';
import Layout from '../../components/Layout';
import Sidebar from '../../components/Sidebar';
import BannerSlider from '../../components/BannerSlider';
import FlashSaleHome from '../../components/FlashSale/FlashSaleHome';
import ProductSuggestions from '../../components/ProductSuggestions';
import { showCenterSuccess } from '../../utils/notification';

const HomePage: React.FC = () => {
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Main content with sidebar layout */}
        <div className="flex gap-6">
          {/* Left Sidebar - Categories - Fixed when scrolling, stick to top like Tiki */}
          <aside className="w-64 flex-shrink-0">
            <div className="sticky top-0">
              <Sidebar />
            </div>
          </aside>

          {/* Right Content */}
          <main className="flex-1 space-y-6">
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