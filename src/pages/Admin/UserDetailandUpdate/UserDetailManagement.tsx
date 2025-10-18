import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AdminUserService } from '../../../services/admin/AdminUserService';
import type { CustomerProfileResponse } from '../../../types/api';

const UserDetailManagement: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<CustomerProfileResponse | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchDetail = async () => {
      if (!id) {
        setError('Thiếu mã người dùng');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const data = await AdminUserService.getCustomerById(id);
        if (isMounted) setUser(data);
      } catch (e: any) {
        if (isMounted) setError(AdminUserService.formatApiError(e));
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchDetail();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const statusBadge = useMemo(() => {
    if (!user) return null;
    const map: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      INACTIVE: 'bg-yellow-100 text-yellow-800',
      SUSPENDED: 'bg-red-100 text-red-800',
      DELETED: 'bg-gray-100 text-gray-800'
    };
    const cls = map[user.status] || 'bg-gray-100 text-gray-800';
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>{user.status}</span>;
  }, [user]);

  const formatDate = (s?: string | null) => {
    if (!s) return 'Chưa cập nhật';
    const d = new Date(s);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Chi tiết tài khoản</h2>
          <p className="text-sm text-gray-500">Xem thông tin chi tiết và trạng thái tài khoản</p>
        </div>
        <button onClick={() => navigate(-1)} className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm bg-white hover:bg-gray-50">
          ← Quay lại
        </button>
      </div>

      {loading && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 animate-pulse">
          <div className="h-6 bg-gray-200 w-1/3 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-4 bg-gray-200" />
            <div className="h-4 bg-gray-200" />
            <div className="h-4 bg-gray-200" />
            <div className="h-4 bg-gray-200" />
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => id && navigate(`/admin/users/${id}`)} className="text-sm underline">Thử lại</button>
          </div>
        </div>
      )}

      {!loading && !error && user && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
              {user.avatarURL ? (
                <img src={user.avatarURL} alt={user.fullName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-semibold text-gray-600">{user.fullName?.[0] || '?'}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold text-gray-900">{user.fullName}</h3>
                {statusBadge}
              </div>
              <p className="text-sm text-gray-500">@{user.userName}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Số điện thoại</p>
              <p className="font-medium">{user.phoneNumber || 'Chưa cập nhật'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Giới tính</p>
              <p className="font-medium">{user.gender === 'MALE' ? 'Nam' : user.gender === 'FEMALE' ? 'Nữ' : 'Chưa cập nhật'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Ngày sinh</p>
              <p className="font-medium">{formatDate(user.dateOfBirth)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">KYC</p>
              <p className="font-medium">{user.kycStatus}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">2FA</p>
              <p className="font-medium">{user.twoFactorEnabled ? 'Bật' : 'Tắt'}</p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-500">Đơn hàng</p>
              <p className="text-lg font-semibold">{user.orderCount}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-500">Hủy</p>
              <p className="text-lg font-semibold">{user.cancelCount}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-500">Trả hàng</p>
              <p className="text-lg font-semibold">{user.returnCount}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-500">Đơn chưa thanh toán</p>
              <p className="text-lg font-semibold">{user.unpaidOrderCount}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetailManagement;


