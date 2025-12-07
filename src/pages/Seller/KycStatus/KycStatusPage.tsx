import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  XCircle,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Store
} from 'lucide-react';
import { StoreService } from '../../../services/seller/StoreService';
import type { StoreInfo } from '../../../types/seller';

const KycStatusPage: React.FC = () => {
  const navigate = useNavigate();
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoreInfo();
    
    // Refresh store info every 30 seconds
    const interval = setInterval(loadStoreInfo, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStoreInfo = async () => {
    try {
      const info = await StoreService.getStoreInfo();
      
      console.log('📊 Store Info loaded:', info);
      
      // Get store status from info or fallback to KYC
      let currentStatus = info.status;
      
      // If store doesn't have status, check KYC
      if (!currentStatus) {
        const statusResponse = await StoreService.getStoreStatus();
        currentStatus = statusResponse.status;
      }
      
      console.log('📊 Current Status:', currentStatus);
      
      // If status is ACTIVE, redirect to dashboard IMMEDIATELY (không set state để tránh render)
      if (currentStatus === 'ACTIVE') {
        navigate('/seller/dashboard', { replace: true });
        return; // Return ngay, không set state nào
      }
      
      // Chỉ set storeInfo và loading nếu không phải ACTIVE
      setStoreInfo(info);
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading store info:', error);
      setIsLoading(false);
    }
  };

  const handleRetryKyc = () => {
    navigate('/seller/onboarding');
  };

  const handleRefresh = () => {
    setIsLoading(true);
    loadStoreInfo();
  };

  // Hiển thị loading khi đang check status (để tránh nháy UI)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang kiểm tra thông tin cửa hàng...</p>
        </div>
      </div>
    );
  }

  // PENDING Status
  if (storeInfo?.status === 'PENDING') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-8 text-center">
              <div className="bg-white p-4 rounded-full inline-block mb-4">
                <Clock className="w-12 h-12 text-yellow-500" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Đang xét duyệt</h1>
              <p className="text-yellow-50 text-lg">Yêu cầu của bạn đang được xem xét</p>
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
                <div className="flex items-start">
                  <AlertCircle className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">Thông tin quan trọng</h3>
                    <ul className="text-sm text-gray-700 space-y-2">
                      <li>• Thời gian xét duyệt: <strong>1-3 ngày làm việc</strong></li>
                      <li>• Bạn sẽ nhận được email thông báo khi có kết quả</li>
                      <li>• Vui lòng kiểm tra cả hộp thư spam</li>
                      <li>• Đảm bảo thông tin liên hệ chính xác để nhận thông báo</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Removed 'Thông tin đã gửi' block per request */}

              {/* Timeline */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-4">Quy trình xét duyệt</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500 text-white mr-4">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">Gửi thông tin KYC</p>
                      <p className="text-xs text-gray-500">Hoàn thành</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500 text-white mr-4 animate-pulse">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">Đang xét duyệt</p>
                      <p className="text-xs text-gray-500">Đội ngũ kiểm duyệt đang xem xét</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center opacity-40">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-300 text-white mr-4">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">Kích hoạt cửa hàng</p>
                      <p className="text-xs text-gray-500">Chờ phê duyệt</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={handleRefresh}
                  className="flex-1 flex items-center justify-center px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Làm mới
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all font-medium"
                >
                  Về trang chủ
                </button>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Cần hỗ trợ? Liên hệ:{' '}
              <a href="mailto:support@audioshop.vn" className="text-orange-600 hover:text-orange-700 font-medium">
                support@audioshop.vn
              </a>
              {' '}hoặc hotline:{' '}
              <a href="tel:1900xxxx" className="text-orange-600 hover:text-orange-700 font-medium">
                1900 xxxx
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // REJECTED Status
  if (storeInfo?.status === 'REJECTED') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-pink-500 p-8 text-center">
              <div className="bg-white p-4 rounded-full inline-block mb-4">
                <XCircle className="w-12 h-12 text-red-500" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Yêu cầu bị từ chối</h1>
              <p className="text-red-50 text-lg">Thông tin KYC của bạn không đạt yêu cầu</p>
            </div>

            {/* Content */}
            <div className="p-8">
              {/* Reason */}
              {storeInfo?.kycInfo?.reviewNote && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
                  <div className="flex items-start">
                    <AlertCircle className="w-6 h-6 text-red-600 mr-3 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">Lý do từ chối</h3>
                      <p className="text-sm text-gray-700">{storeInfo.kycInfo.reviewNote}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">Hướng dẫn khắc phục</h3>
                <ul className="text-sm text-gray-700 space-y-2">
                  <li>• Kiểm tra lại thông tin đã gửi và lý do từ chối đã được hệ thống gửi về Email</li>
                  <li>• Chuẩn bị đầy đủ giấy tờ hợp lệ (Căn cước/ CCCD, Giấy phép kinh doanh)</li>
                  <li>• Đảm bảo ảnh chụp rõ ràng, không bị mờ hay che khuất</li>
                  <li>• Thông tin phải khớp với giấy tờ thực tế</li>
                  <li>• Nhấn "Gửi lại KYC" để cập nhật thông tin mới</li>
                </ul>
              </div>

              {/* Removed 'Thông tin đã gửi trước đó' block per request */}

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => navigate('/')}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                >
                  Về trang chủ
                </button>
                <button
                  onClick={handleRetryKyc}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all font-medium"
                >
                  Gửi lại KYC
                </button>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Cần hỗ trợ? Liên hệ:{' '}
              <a href="mailto:support@audioshop.vn" className="text-orange-600 hover:text-orange-700 font-medium">
                support@audioshop.vn
              </a>
              {' '}hoặc hotline:{' '}
              <a href="tel:1900xxxx" className="text-orange-600 hover:text-orange-700 font-medium">
                1900 xxxx
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // INACTIVE Status
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-8 text-center">
            <div className="bg-white p-4 rounded-full inline-block mb-4">
              <Store className="w-12 h-12 text-blue-500" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Chào mừng đến AudioShop!</h1>
            <p className="text-blue-50 text-lg">Vui lòng cung cấp thông tin để thành lập tài khoản người bán trên AudioShop.</p>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
              <h3 className="font-semibold text-gray-800 mb-3">Để bắt đầu bán hàng, bạn cần:</h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>• Điền đầy đủ thông tin kinh doanh</li>
                <li>• Cung cấp thông tin thanh toán</li>
                <li>• Upload giấy tờ định danh (Căn cước/CCCD, Giấy phép kinh doanh) còn hiệu lực</li>
                <li>• Chờ xét duyệt từ AudioShop (1-3 ngày)</li>
             </ul>
            </div>

            <button
              onClick={() => navigate('/seller/onboarding')}
              className="w-full px-6 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl hover:from-orange-600 hover:to-red-600 transition-all font-medium text-lg"
            >
              Bắt đầu đăng kí ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KycStatusPage;
