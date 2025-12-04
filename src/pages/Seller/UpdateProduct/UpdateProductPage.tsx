import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Suminputsection } from '../../../components/CreateProductForSellerUIComponent';

const UpdateProductPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-600" />
        <div className="relative max-w-7xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-sm uppercase tracking-wide text-orange-200 font-semibold mb-2">Cập nhật sản phẩm</p>
              <h1 className="text-3xl md:text-4xl font-bold text-white">Chỉnh sửa thông tin sản phẩm</h1>
              
            </div>
            <div className="flex flex-col items-start md:items-end gap-3">
              <Link
                to="/seller/dashboard/products"
                className="inline-flex items-center justify-center px-4 py-2 bg-white text-orange-600 rounded-lg shadow-sm hover:bg-orange-50 transition-colors"
              >
                ← Quay lại danh sách sản phẩm
              </Link>
             
            </div>
          </div>
        </div>
      </div>

      {productId ? (
        <Suminputsection mode="update" productId={productId} />
      ) : (
        <div className="max-w-4xl mx-auto px-6 py-16">
          <div className="bg-white border border-red-200 rounded-2xl p-8 text-center space-y-4">
            <h2 className="text-xl font-semibold text-red-600">Thiếu mã sản phẩm</h2>
            <p className="text-gray-600">
              Không tìm thấy mã sản phẩm cần cập nhật. Vui lòng quay lại danh sách sản phẩm và chọn “Sửa” ở sản phẩm bạn muốn thay đổi.
            </p>
            <Link
              to="/seller/dashboard/products"
              className="inline-flex items-center justify-center px-4 py-2 bg-orange-600 text-white rounded-lg shadow hover:bg-orange-700 transition-colors"
            >
              Về danh sách sản phẩm
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateProductPage;
