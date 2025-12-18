import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store } from 'lucide-react';
import { StoreService } from '../../../services/seller/StoreService';

const KycStatusPage: React.FC = () => {
  const navigate = useNavigate();
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
      
      // Chỉ yêu cầu KYC khi status là INACTIVE
      // Các status khác (PENDING, REJECTED, ACTIVE, PAUSED) đều cho phép vào dashboard
      if (currentStatus !== 'INACTIVE') {
        navigate('/seller/dashboard', { replace: true });
        return; // Return ngay, không set state nào
      }
      
      // Chỉ set loading nếu status là INACTIVE
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading store info:', error);
      setIsLoading(false);
    }
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

  // Chỉ hiển thị trang KYC khi status là INACTIVE
  // Các status khác (PENDING, REJECTED, ACTIVE, PAUSED) đã được redirect ở trên
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
