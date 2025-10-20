import React from 'react';
import { Suminputsection } from '../../../components/CreateProductForSellerUIComponent';

const CreateProductPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-white">Thêm sản phẩm âm thanh</h1>
          <p className="text-sm text-indigo-100 mt-1">Tạo sản phẩm mới cho cửa hàng của bạn.</p>
        </div>
      </div>
      <Suminputsection />
    </div>
  );
};

export default CreateProductPage;
