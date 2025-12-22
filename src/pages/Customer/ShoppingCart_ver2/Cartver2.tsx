import React from 'react';
import Layout from '../../../components/Layout';
import ShopCartV2 from '../../../components/ShopCartv2';
import { Home, ChevronRight } from 'lucide-react';

/**
 * ShoppingCartVer2
 * UI-only page that wraps the new cart layout (ShopCartV2) inside the main site Layout.
 */
const ShoppingCartVer2: React.FC = () => {
  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-5 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600 shadow-sm">
          <div className="flex items-center gap-2">
            <Home className="h-4 w-4 text-gray-500" />
            <span className="font-medium text-gray-900">Giỏ hàng</span>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <span>Kiểm tra</span>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <span>Thanh toán</span>
          </div>
        </div>

        <h1 className="mb-4 text-2xl font-bold text-gray-900">Giỏ hàng của bạn</h1>

        <ShopCartV2 />
      </div>
    </Layout>
  );
};

export default ShoppingCartVer2;


