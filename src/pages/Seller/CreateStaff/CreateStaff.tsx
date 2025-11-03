import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, CheckCircle } from 'lucide-react';
import { CreateStaffForm } from '../../../components/CreateStaffForStoreComponents';
import { StaffService } from '../../../services/seller/StaffService';
import { showCenterSuccess, showCenterError } from '../../../utils/notification';
import type { CreateStaffRequest } from '../../../types/seller';

const CreateStaff: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdStaff, setCreatedStaff] = useState<any>(null);

  const handleSubmit = async (data: CreateStaffRequest) => {
    setIsLoading(true);
    try {
      console.log('📝 Creating staff:', data);
      const response = await StaffService.createStaff(data);

      // Check if response is successful (status 200 or has id)
      if (response && response.id) {
        setCreatedStaff(response);
        setIsSuccess(true);
        showCenterSuccess(
          'Tạo nhân viên thành công!',
          'Thành công',
          3000
        );

        // Reset form after 2 seconds
        setTimeout(() => {
          setIsSuccess(false);
          setCreatedStaff(null);
        }, 2000);
      } else {
        throw new Error('Không nhận được phản hồi hợp lệ từ server');
      }
    } catch (error: any) {
      console.error('❌ Create staff failed:', error);
      
      const errorMessage = error?.message || 
                          error?.data?.message || 
                          StaffService.formatStaffError(error) ||
                          'Đã xảy ra lỗi khi tạo nhân viên. Vui lòng thử lại.';
      
      showCenterError(errorMessage, 'Lỗi tạo nhân viên');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/seller/dashboard/staff')}
          className="flex items-center text-gray-600 hover:text-orange-500 transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span>Quay lại</span>
        </button>
        
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-3 rounded-lg">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tạo nhân viên mới</h1>
            <p className="text-gray-600 mt-1">Thêm nhân viên mới vào cửa hàng của bạn</p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {isSuccess && createdStaff && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-green-900 mb-1">
                Tạo nhân viên thành công!
              </h3>
              <div className="text-sm text-green-700 space-y-1">
                <p><strong>Tên đăng nhập:</strong> {createdStaff.username}</p>
                <p><strong>Họ tên:</strong> {createdStaff.fullName}</p>
                <p><strong>Email:</strong> {createdStaff.email}</p>
                <p><strong>Số điện thoại:</strong> {createdStaff.phone}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Thông tin nhân viên</h2>
          <p className="text-sm text-gray-600">
            Điền đầy đủ thông tin để tạo tài khoản nhân viên mới
          </p>
        </div>

        <CreateStaffForm onSubmit={handleSubmit} isLoading={isLoading} />
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-sm font-medium text-blue-900 mb-2">Lưu ý:</h3>
        <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
          <li>Nhân viên sẽ sử dụng tên đăng nhập và mật khẩu để đăng nhập vào hệ thống</li>
          <li>Đảm bảo mật khẩu có ít nhất 6 ký tự để bảo mật</li>
          <li>Email và số điện thoại phải chính xác để nhận thông báo</li>
          <li>Sau khi tạo, nhân viên sẽ nhận được thông tin đăng nhập</li>
        </ul>
      </div>
    </div>
  );
};

export default CreateStaff;

