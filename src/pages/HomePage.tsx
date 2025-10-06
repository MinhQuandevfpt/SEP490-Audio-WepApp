import React from 'react';
import Layout from '../components/Layout';
import Sidebar from '../components/Sidebar';
import BannerSlider from '../components/BannerSlider';
import FlashSale from '../components/FlashSale';
import TopDeals from '../components/TopDeals';
import FeaturedBrands from '../components/FeaturedBrands';
import ProductSuggestions from '../components/ProductSuggestions';

const HomePage: React.FC = () => {
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
            <FlashSale />

            {/* Top Deals Section */}
            <TopDeals />

            {/* Featured Brands Section */}
            <FeaturedBrands />

            {/* Product Suggestions Section */}
            <ProductSuggestions />
          </main>
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;