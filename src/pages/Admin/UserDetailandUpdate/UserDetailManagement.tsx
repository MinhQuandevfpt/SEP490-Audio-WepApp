import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Calendar, Shield, ShoppingCart, TrendingUp, Award, Clock } from 'lucide-react';
import { AdminUserService } from '../../../services/admin/AdminUserService';
import type { CustomerProfileResponse } from '../../../types/api';
import { showError } from '../../../utils/notification';

const UserDetailManagement: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<CustomerProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchUserDetail();
    }
  }, [id]);

  const fetchUserDetail = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const data = await AdminUserService.getCustomerById(id);
      setUser(data);
    } catch (error) {
      console.error('Error fetching user detail:', error);
      showError('Không thể tải chi tiết người dùng');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!user) return null;
    
    const styles = {
      ACTIVE: 'bg-green-100 text-green-800 border-green-200',
      INACTIVE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      SUSPENDED: 'bg-red-100 text-red-800 border-red-200',
      DELETED: 'bg-gray-100 text-gray-800 border-gray-200'
    };

    const labels = {
      ACTIVE: 'Hoạt động',
      INACTIVE: 'Không hoạt động',
      SUSPENDED: 'Bị khóa',
      DELETED: 'Đã xóa'
    };

    const status = user.status as keyof typeof styles;
    return (
      <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getKycBadge = () => {
    if (!user) return null;
    
    const styles = {
      NONE: 'bg-gray-100 text-gray-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      VERIFIED: 'bg-green-100 text-green-800'
    };

    const labels = {
      NONE: 'Chưa xác thực',
      PENDING: 'Đang chờ',
      VERIFIED: 'Đã xác thực'
    };

    const status = user.kycStatus as keyof typeof styles;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getLoyaltyBadge = () => {
    if (!user || !user.loyaltyLevel) return <span className="text-gray-500">Chưa có</span>;
    
    const styles = {
      BRONZE: 'bg-orange-100 text-orange-800',
      SILVER: 'bg-gray-100 text-gray-800',
      GOLD: 'bg-yellow-100 text-yellow-800',
      PLATINUM: 'bg-blue-100 text-blue-800',
      DIAMOND: 'bg-purple-100 text-purple-800'
    };

    const level = user.loyaltyLevel as keyof typeof styles;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${styles[level]}`}>
        {level}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            <p className="mt-4 text-gray-600">Đang tải chi tiết người dùng...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <User className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Không tìm thấy người dùng</h3>
            <p className="mt-2 text-gray-500">Người dùng không tồn tại hoặc đã bị xóa.</p>
            <button
              onClick={() => navigate('/admin/users')}
              className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              Quay lại danh sách
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/admin/users')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Quay lại danh sách người dùng
        </button>
        
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Chi tiết người dùng
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Xem đầy đủ thông tin tài khoản người dùng
            </p>
          </div>
          <div className="mt-4 md:mt-0 md:ml-4">
            {getStatusBadge()}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - User Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                {user.avatarURL ? (
                  <img
                    src={user.avatarURL}
                    alt={user.fullName}
                    className="w-24 h-24 rounded-full object-cover border-4 border-gray-100"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center border-4 border-gray-100">
                    <span className="text-3xl font-bold text-white">
                      {user.fullName?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{user.fullName}</h2>
                <p className="text-gray-600 mb-3">@{user.userName}</p>
                <div className="flex flex-wrap gap-2">
                  {getKycBadge()}
                  {user.twoFactorEnabled && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <Shield className="w-3 h-3 mr-1" />
                      2FA Enabled
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-orange-500" />
              Thông tin liên hệ
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-base text-gray-900 mt-1">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Số điện thoại</label>
                <p className="text-base text-gray-900 mt-1 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {user.phoneNumber || 'Chưa cập nhật'}
                </p>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-orange-500" />
              Thông tin cá nhân
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Giới tính</label>
                <p className="text-base text-gray-900 mt-1">
                  {user.gender === 'MALE' ? '👨 Nam' : user.gender === 'FEMALE' ? '👩 Nữ' : 'Chưa cập nhật'}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Ngày sinh</label>
                <p className="text-base text-gray-900 mt-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {user.dateOfBirth 
                    ? new Date(user.dateOfBirth).toLocaleDateString('vi-VN')
                    : 'Chưa cập nhật'}
                </p>
              </div>
            </div>
          </div>

          {/* Order Statistics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-orange-500" />
              Thống kê đơn hàng
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-2xl font-bold text-blue-600">{user.orderCount}</p>
                <p className="text-xs text-gray-600 mt-1">Tổng đơn</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-100">
                <p className="text-2xl font-bold text-red-600">{user.cancelCount}</p>
                <p className="text-xs text-gray-600 mt-1">Đã hủy</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-100">
                <p className="text-2xl font-bold text-yellow-600">{user.returnCount}</p>
                <p className="text-xs text-gray-600 mt-1">Trả hàng</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-100">
                <p className="text-2xl font-bold text-orange-600">{user.unpaidOrderCount}</p>
                <p className="text-xs text-gray-600 mt-1">Chưa thanh toán</p>
              </div>
            </div>
            {user.lastOrderDate && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Đơn hàng cuối cùng: <span className="font-medium text-gray-900">
                    {new Date(user.lastOrderDate).toLocaleDateString('vi-VN')}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Loyalty & Preferences */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              Loyalty & Ưu đãi
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Cấp độ</label>
                <div className="mt-2">
                  {getLoyaltyBadge()}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Điểm tích lũy</label>
                <p className="text-2xl font-bold text-orange-600 mt-1 flex items-center gap-1">
                  <Award className="w-5 h-5" />
                  {user.loyaltyPoints.toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Voucher</label>
                <p className="text-2xl font-bold text-purple-600 mt-1">{user.voucherCount}</p>
              </div>
            </div>
            {user.preferredCategory && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <label className="text-sm font-medium text-gray-500">Danh mục yêu thích</label>
                <p className="text-base text-gray-900 mt-1">{user.preferredCategory}</p>
              </div>
            )}
          </div>

          {/* Addresses */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Địa chỉ
            </h2>
            <div className="flex items-center justify-between">
              <p className="text-gray-600">Số địa chỉ đã lưu</p>
              <span className="text-2xl font-bold text-gray-900">{user.addressCount}</span>
            </div>
          </div>
        </div>

        {/* Right Column - Timeline & Status */}
        <div className="space-y-6">
          {/* Activity Timeline */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              Hoạt động
            </h2>
            <div className="space-y-4">
              {user.lastLogin && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Đăng nhập cuối</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(user.lastLogin).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* System Info */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Thông tin hệ thống</h3>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex flex-col gap-1">
                <span className="font-medium text-gray-700">ID người dùng:</span>
                <span className="font-mono text-gray-900 break-all">{user.id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailManagement;


