import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, Home, RefreshCw, AlertTriangle } from 'lucide-react';
import Layout from '../../../components/Layout';

const PayOSFail: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Get error message from query params if available
    const error = searchParams.get('error');
    const message = searchParams.get('message');
    if (error || message) {
      setErrorMessage(message || error || 'Thanh toán không thành công');
    }
  }, [searchParams]);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
            {/* Error Icon */}
            <div className="mb-6">
              <div className="mx-auto w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="w-16 h-16 text-red-500" />
              </div>
            </div>

            {/* Error Message */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Thanh toán thất bại
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              Rất tiếc, giao dịch của bạn không thể hoàn tất
            </p>
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 mt-4">
                <div className="flex items-start justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                  <p className="text-sm text-red-800 text-left">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-8">
              <div className="text-left">
                <p className="text-sm font-medium text-orange-900 mb-2">
                  Có thể do các nguyên nhân sau:
                </p>
                <ul className="text-xs text-orange-700 space-y-1 list-disc list-inside">
                  <li>Số dư tài khoản không đủ</li>
                  <li>Thông tin thẻ không hợp lệ</li>
                  <li>Giao dịch bị từ chối bởi ngân hàng</li>
                  <li>Lỗi kết nối mạng tạm thời</li>
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/cart')}
                className="flex items-center justify-center px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Thử lại thanh toán
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
              <p className="text-sm text-gray-500 mb-2">
                Vấn đề vẫn còn? Hãy liên hệ với chúng tôi
              </p>
              <div className="flex items-center justify-center gap-4 text-sm">
                <a href="/contact" className="text-orange-500 hover:text-orange-600 font-medium">
                  Liên hệ hỗ trợ
                </a>
                <span className="text-gray-300">|</span>
                <a href="/help" className="text-orange-500 hover:text-orange-600 font-medium">
                  Trung tâm trợ giúp
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PayOSFail;

