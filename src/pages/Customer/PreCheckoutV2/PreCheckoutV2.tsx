import React from 'react';
import Layout from '../../../components/Layout';
import PreCheckoutV2 from '../../../components/PreCheckoutV2Component';
import { Home, ChevronRight } from 'lucide-react';

const PreCheckoutV2Page: React.FC = () => {
  return (
    <Layout>
      <div className="bg-gray-50 min-h-[calc(100vh-64px)] pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-4 flex items-center gap-2 text-sm text-gray-600">
            <Home className="w-4 h-4" />
            <span>Trang chủ</span>
            <ChevronRight className="w-4 h-4" />
            <span>Giỏ hàng</span>
            <ChevronRight className="w-4 h-4" />
            <span className="font-medium text-gray-900">Xem lại đơn hàng</span>
          </div>

          <div className="mb-4">
            <h1 className="text-2xl font-semibold text-gray-900">
              Xem lại đơn hàng của bạn
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Kiểm tra lại sản phẩm, số lượng và tổng tiền trước khi sang bước
              thanh toán.
            </p>
          </div>

          <PreCheckoutV2 />
        </div>
      </div>
    </Layout>
  );
};

export default PreCheckoutV2Page;



