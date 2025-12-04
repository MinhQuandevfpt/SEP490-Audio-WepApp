import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spin } from 'antd';
import { Suminputsection } from '../../../components/CreateProductForSellerUIComponent';
import { StoreAddressService } from '../../../services/seller/StoreAddressService';
import { showCenterError } from '../../../utils/notification';

const CreateProductPage: React.FC = () => {
  const navigate = useNavigate();
  const [isCheckingAddress, setIsCheckingAddress] = useState(true);

  useEffect(() => {
    const checkStoreAddress = async () => {
      try {
        setIsCheckingAddress(true);
        const addresses = await StoreAddressService.getStoreAddresses();
        const addressList = Array.isArray(addresses) ? addresses : (addresses || []);
        
        if (!addressList || addressList.length === 0) {
          // Thông báo và chuyển sang trang tạo địa chỉ cửa hàng
          showCenterError(
            'Bạn cần tạo ít nhất một địa chỉ cửa hàng trước khi thêm sản phẩm.',
            'Chưa có địa chỉ cửa hàng'
          );
          navigate('/seller/dashboard/store-address?from=create-product', { replace: true });
          return;
        }
        
        // If addresses exist, allow user to create product
        setIsCheckingAddress(false);
      } catch (error) {
        console.error('Error checking store addresses:', error);
        showCenterError(
          'Không thể kiểm tra địa chỉ cửa hàng. Vui lòng thử lại.',
          'Lỗi'
        );
        navigate('/seller/dashboard/products', { replace: true });
      }
    };

    checkStoreAddress();
  }, [navigate]);

  if (isCheckingAddress) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Spin size="large" />
          <p className="mt-4 text-gray-600">Đang kiểm tra địa chỉ cửa hàng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-600" />
        <div className="relative max-w-7xl mx-auto px-6 py-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">Thêm sản phẩm âm thanh</h1>
              <p className="text-sm text-orange-100 mt-2">Chia nhỏ bước giúp nhập liệu nhanh và chính xác hơn.</p>
            </div>
           
          </div>
        </div>
      </div>
      <Suminputsection />
    </div>
  );
};

export default CreateProductPage;
