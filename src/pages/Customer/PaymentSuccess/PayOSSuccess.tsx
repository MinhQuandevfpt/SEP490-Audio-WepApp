import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Home, Package } from 'lucide-react';
import Layout from '../../../components/Layout';

const PayOSSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    // Get order ID from query params if available
    const id = searchParams.get('orderId');
    if (id) {
      setOrderId(id);
    }
  }, [searchParams]);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-orange-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
            {/* Success Icon */}
            <div className="mb-6">
              <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                <CheckCircle className="w-16 h-16 text-green-500" />
              </div>
            </div>

            {/* Success Message */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Thanh toán thành công!
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              Cảm ơn bạn đã sử dụng PayOS
            </p>
            {orderId && (
              <p className="text-sm text-gray-500 mb-8">
                Mã đơn hàng: <span className="font-semibold text-gray-700">{orderId}</span>
              </p>
            )}

            {/* Info Box */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
              <div className="flex items-start justify-center">
                <Package className="w-5 h-5 text-green-600 mt-0.5 mr-2" />
                <div className="text-left">
                  <p className="text-sm font-medium text-green-900 mb-1">
                    Đơn hàng của bạn đã được xác nhận
                  </p>
                  <p className="text-xs text-green-700">
                    Chúng tôi sẽ gửi email xác nhận và thông tin vận chuyển đến bạn trong thời gian sớm nhất.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/orders')}
                className="flex items-center justify-center px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
              >
                <Package className="w-5 h-5 mr-2" />
                Xem đơn hàng
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex items-center justify-center px-6 py-3 bg-white border-2 border-gray-300 hover:border-orange-500 text-gray-700 hover:text-orange-600 font-semibold rounded-lg transition-colors"
              >
                <Home className="w-5 h-5 mr-2" />
                Về trang chủ
              </button>
            </div>

            {/* Additional Info */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Có câu hỏi? <a href="/contact" className="text-orange-500 hover:text-orange-600 font-medium">Liên hệ hỗ trợ</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PayOSSuccess;

