import React from 'react';
import { User as UserIcon, Camera, Upload, X, Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import ProfileCustomerService from '../../../services/customer/Profilecustomer';
import { loadProfileData, saveProfileData, type ProfileData } from '../../../data/profiledata';
import { showCenterError, showCenterSuccess } from '../../../utils/notification';
import LoadingSkeleton from '../../common/LoadingSkeleton';

interface PresentationalUserInfoCardProps {
  fullName: string;
  email: string;
  phone: string;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: string; // yyyy-mm-dd
  avatar?: string; // URL của hình ảnh đại diện
  membershipPoints?: number; // Điểm thành viên
  membershipLevel?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'; // Cấp bậc thành viên
  onUpdate?: (nextUser: { fullName: string; email: string; phone: string; gender: 'male' | 'female' | 'other'; dateOfBirth: string; avatar?: string; membershipPoints?: number; membershipLevel?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'; }) => void;
}

// Presentational component
export const PresentationalUserInfoCard: React.FC<PresentationalUserInfoCardProps> = ({ fullName, email, phone, gender = 'other', dateOfBirth, avatar, membershipPoints = 0, membershipLevel = 'bronze', onUpdate }) => {
  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.charAt(0) ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
    return (first + last).toUpperCase();
  };

  const formatDob = (iso?: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const genderLabel = gender === 'male' ? 'Nam' : gender === 'female' ? 'Nữ' : 'Khác';

  // Loyalty UI removed

  const [isEditing, setIsEditing] = React.useState(false);
  const [form, setForm] = React.useState({
    fullName,
    email,
    phone,
    gender: gender as 'male' | 'female' | 'other',
    dateOfBirth: dateOfBirth ?? '',
    avatar: avatar ?? '',
    membershipPoints,
    membershipLevel,
  });

  // Avatar upload states
  const [isUploadingAvatar, setIsUploadingAvatar] = React.useState(false);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
  const [showAvatarUpload, setShowAvatarUpload] = React.useState(false);

  const updateField = (name: string, value: string) => {
    setForm(prev => ({ ...prev, [name]: value } as any));
  };

  const handleSave = () => {
    if (!onUpdate) {
      setIsEditing(false);
      return;
    }
    onUpdate({
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      gender: form.gender,
      dateOfBirth: form.dateOfBirth,
      avatar: form.avatar,
      membershipPoints: form.membershipPoints,
      membershipLevel: form.membershipLevel,
    });
    setIsEditing(false);
  };

  // Avatar upload functions
  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn file hình ảnh hợp lệ');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Kích thước file không được vượt quá 5MB');
      return;
    }

    setIsUploadingAvatar(true);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setAvatarPreview(result);
      setForm(prev => ({ ...prev, avatar: result }));
      setIsUploadingAvatar(false);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setForm(prev => ({ ...prev, avatar: '' }));
  };

  const handleSaveAvatar = () => {
    if (avatarPreview) {
      setForm(prev => ({ ...prev, avatar: avatarPreview }));
      setShowAvatarUpload(false);
    }
  };

  const handleCancelAvatar = () => {
    setAvatarPreview(null);
    setForm(prev => ({ ...prev, avatar: avatar ?? '' }));
    setShowAvatarUpload(false);
  };

  React.useEffect(() => {
    setForm({
      fullName,
      email,
      phone,
      gender: gender as 'male' | 'female' | 'other',
      dateOfBirth: dateOfBirth ?? '',
      avatar: avatar ?? '',
      membershipPoints,
      membershipLevel,
    });
  }, [fullName, email, phone, gender, dateOfBirth, avatar, membershipPoints, membershipLevel]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header with avatar */}
      <div className="flex items-center gap-4 mb-5">
        <div className="relative group">
          {/* Avatar Display */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xl font-bold shadow overflow-hidden">
            {form.avatar || avatar ? (
              <img 
                src={form.avatar || avatar} 
                alt="Avatar" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to initials if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = getInitials(fullName);
                  }
                }}
              />
            ) : (
              getInitials(fullName)
            )}
          </div>
          
          {/* Upload Button Overlay */}
          <button
            onClick={() => setShowAvatarUpload(true)}
            className="absolute inset-0 w-16 h-16 rounded-full bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            title="Thay đổi ảnh đại diện"
          >
            <Camera className="w-5 h-5 text-white" />
          </button>
        </div>
        
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">Thông tin tài khoản</h2>
          <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
            <UserIcon className="w-4 h-4 text-gray-400" />
            Thành viên AudioShop
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Row 1: Full name - Gender */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-500">Họ và tên</span>
            {isEditing ? (
              <input value={form.fullName} onChange={(e) => updateField('fullName', e.target.value)} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
            ) : (
              <p className="font-medium text-gray-900">{fullName}</p>
            )}
          </div>
          <div>
            <span className="text-sm text-gray-500">Giới tính</span>
            {isEditing ? (
              <select value={form.gender} onChange={(e) => updateField('gender', e.target.value)} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
              </select>
            ) : (
              <p className="font-medium text-gray-900">{genderLabel}</p>
            )}
          </div>
        </div>

        {/* Row 2: Date of birth - Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-gray-500">Ngày sinh</span>
            {isEditing ? (
              <input type="date" value={form.dateOfBirth} onChange={(e) => updateField('dateOfBirth', e.target.value)} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
            ) : (
              <p className="font-medium text-gray-900">{formatDob(dateOfBirth)}</p>
            )}
          </div>
          <div>
            <span className="text-sm text-gray-500">Số điện thoại</span>
            {isEditing ? (
              <input value={form.phone} onChange={(e) => updateField('phone', e.target.value)} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
            ) : (
              <p className="font-medium text-gray-900">{phone}</p>
            )}
          </div>
        </div>

        {/* Row 3: Email */}
        <div>
          <span className="text-sm text-gray-500">Email</span>
          {isEditing ? (
            <input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
          ) : (
            <p className="font-medium text-gray-900">{email}</p>
          )}
        </div>

        {/* Loyalty fields removed from UI */}
      </div>

      {/* Loyalty progress removed */}

      {/* Actions */}
      <div className="mt-5 flex gap-3">
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors">Cập nhật thông tin</button>
        ) : (
          <>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">Lưu</button>
            <button onClick={() => { setIsEditing(false); setForm({ fullName, email, phone, gender: gender as 'male' | 'female' | 'other', dateOfBirth: dateOfBirth ?? '', avatar: avatar ?? '', membershipPoints, membershipLevel }); }} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">Hủy</button>
          </>
        )}
      </div>

      {/* Avatar Upload Modal */}
      {showAvatarUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Thay đổi ảnh đại diện</h3>
              <button
                onClick={handleCancelAvatar}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Avatar Preview */}
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-2xl font-bold shadow overflow-hidden">
                {avatarPreview || form.avatar || avatar ? (
                  <img 
                    src={avatarPreview || form.avatar || avatar} 
                    alt="Avatar Preview" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials(fullName)
                )}
              </div>
            </div>

            {/* Upload Section */}
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  id="avatar-upload"
                  disabled={isUploadingAvatar}
                />
                <label
                  htmlFor="avatar-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  {isUploadingAvatar ? (
                    <>
                      <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm text-gray-600">Đang xử lý...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        Nhấp để chọn ảnh hoặc kéo thả vào đây
                      </span>
                      <span className="text-xs text-gray-500">
                        JPG, PNG, GIF (tối đa 5MB)
                      </span>
                    </>
                  )}
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleSaveAvatar}
                  disabled={!avatarPreview}
                  className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Lưu ảnh
                </button>
                <button
                  onClick={handleCancelAvatar}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
              </div>

              {/* Remove Avatar Button */}
              {(form.avatar || avatar) && (
                <button
                  onClick={handleRemoveAvatar}
                  className="w-full text-red-600 hover:text-red-700 text-sm font-medium py-2 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Xóa ảnh đại diện
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Container component: handles fetching/merging data and renders PresentationalUserInfoCard
interface UserInfoCardProps {
  preloadedData?: any;
  customerId?: string | null;
}

const UserInfoCard: React.FC<UserInfoCardProps> = ({ preloadedData, customerId }) => {
  const location = useLocation();
  const [loading, setLoading] = useState<boolean>(false);
  const [apiProfile, setApiProfile] = useState<{
    fullName?: string;
    email?: string;
    phone?: string;
    gender?: 'male' | 'female' | 'other';
    dateOfBirth?: string;
    avatar?: string;
    membershipPoints?: number;
    membershipLevel?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  } | null>(null);
  const [baseUser, setBaseUser] = useState<ProfileData['user'] | null>(null);
  const [hasCustomerId, setHasCustomerId] = useState<boolean>(false);
  const [customerIdState, setCustomerIdState] = useState<string | null>(null);

  useEffect(() => {
    // load local baseline
    const local = loadProfileData();
    setBaseUser(local?.user ?? null);

    // Use preloaded data if available, otherwise fetch
    if (preloadedData) {
      const gender = (preloadedData.gender || '').toString().toLowerCase();
      const mappedGender: 'male' | 'female' | 'other' = gender === 'male' ? 'male' : gender === 'female' ? 'female' : 'other';
      const level = (preloadedData.loyaltyLevel || '').toString().toLowerCase();
      const mappedLevel: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | undefined =
        level === 'bronze' || level === 'silver' || level === 'gold' || level === 'platinum' || level === 'diamond' ? (level as any) : undefined;
      
      setApiProfile({
        fullName: preloadedData.fullName,
        email: preloadedData.email,
        phone: preloadedData.phoneNumber,
        gender: mappedGender,
        dateOfBirth: preloadedData.dateOfBirth ?? undefined,
        avatar: preloadedData.avatarURL ?? undefined,
        membershipPoints: preloadedData.loyaltyPoints ?? 0,
        membershipLevel: mappedLevel || 'bronze',
      });
      setHasCustomerId(true);
      setCustomerIdState(customerId || null);
      return;
    }

    // Fallback: decode ?u from query and fetch if no preloaded data
    const params = new URLSearchParams(location.search);
    const encoded = params.get('u');
    let customerIdFromStorage = localStorage.getItem('customerId');
    if (encoded) {
      try {
        const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
        const b64 = padded + '==='.slice((padded.length + 3) % 4);
        const decoded = atob(b64);
        if (decoded) customerIdFromStorage = decoded;
      } catch {
        // ignore
      }
    }
    if (!customerIdFromStorage) return;
    setHasCustomerId(true);
    setCustomerIdState(customerIdFromStorage);
    setLoading(true);
    ProfileCustomerService.getByCustomerId(customerIdFromStorage)
      .then((p) => {
        const gender = (p.gender || '').toString().toLowerCase();
        const mappedGender: 'male' | 'female' | 'other' = gender === 'male' ? 'male' : gender === 'female' ? 'female' : 'other';
        const level = (p.loyaltyLevel || '').toString().toLowerCase();
        const mappedLevel: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | undefined =
          level === 'bronze' || level === 'silver' || level === 'gold' || level === 'platinum' || level === 'diamond' ? (level as any) : undefined;
        setApiProfile({
          fullName: p.fullName,
          email: p.email,
          phone: p.phoneNumber,
          gender: mappedGender,
          dateOfBirth: p.dateOfBirth ?? undefined,
          avatar: p.avatarURL ?? undefined,
          membershipPoints: p.loyaltyPoints ?? 0,
          membershipLevel: mappedLevel || 'bronze',
        });
      })
      .finally(() => setLoading(false));
  }, [location.search, preloadedData, customerId]);

  // removed unused local-only update handler; updates are now done via API

  const handleApiUpdate = async (nextUser: { fullName: string; email: string; phone: string; gender: 'male' | 'female' | 'other'; dateOfBirth: string; avatar?: string; membershipPoints?: number; membershipLevel?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'; }) => {
    try {
      if (!customerIdState) return;
      setLoading(true);

      const payload: any = {
        fullName: nextUser.fullName,
        userName: (apiProfile as any)?.userName || (baseUser as any)?.userName,
        email: nextUser.email,
        phoneNumber: nextUser.phone,
        gender: nextUser.gender === 'male' ? 'MALE' : nextUser.gender === 'female' ? 'FEMALE' : null,
        dateOfBirth: nextUser.dateOfBirth || null,
        avatarURL: nextUser.avatar || null,
        status: (apiProfile as any)?.status,
        twoFactorEnabled: (apiProfile as any)?.twoFactorEnabled,
        kycStatus: (apiProfile as any)?.kycStatus,
        preferredCategory: (apiProfile as any)?.preferredCategory,
        // Loyalty fields are admin-only; do not send from customer update
      };

      const updated = await ProfileCustomerService.updateByCustomerId(customerIdState, payload);

      const gender = (updated.gender || '').toString().toLowerCase();
      const mappedGender: 'male' | 'female' | 'other' = gender === 'male' ? 'male' : gender === 'female' ? 'female' : 'other';
      // loyalty mapping kept for potential admin use, but customer view will not override local values

      setApiProfile({
        fullName: updated.fullName,
        email: updated.email,
        phone: updated.phoneNumber,
        gender: mappedGender,
        dateOfBirth: updated.dateOfBirth ?? undefined,
        avatar: updated.avatarURL ?? undefined,
        membershipPoints: apiProfile?.membershipPoints ?? baseUser?.membershipPoints ?? 0,
        membershipLevel: apiProfile?.membershipLevel ?? baseUser?.membershipLevel ?? 'bronze',
      });

      const current = loadProfileData();
      if (current) {
        const merged: ProfileData = {
          ...current,
          user: {
            ...current.user,
            fullName: updated.fullName || current.user.fullName,
            email: updated.email || current.user.email,
            phone: updated.phoneNumber || current.user.phone,
            gender: mappedGender,
            dateOfBirth: updated.dateOfBirth ?? current.user.dateOfBirth,
            avatar: updated.avatarURL ?? current.user.avatar,
            // keep local loyalty values; customers cannot change these via this screen
            membershipPoints: current.user.membershipPoints,
            membershipLevel: current.user.membershipLevel,
          }
        } as ProfileData;
        saveProfileData(merged);
        setBaseUser(merged.user);
      }

      showCenterSuccess('Cập nhật thông tin thành công', 'Thành công');
    } catch (e: any) {
      showCenterError(e?.message || 'Cập nhật thất bại', 'Lỗi');
    } finally {
      setLoading(false);
    }
  };

  if (!baseUser) {
    return <LoadingSkeleton type="profile" />;
  }

  if (hasCustomerId && (loading || !apiProfile)) {
    return <LoadingSkeleton type="profile" />;
  }

  const merged = {
    fullName: apiProfile?.fullName ?? baseUser.fullName,
    email: apiProfile?.email ?? baseUser.email,
    phone: apiProfile?.phone ?? baseUser.phone,
    gender: apiProfile?.gender ?? baseUser.gender,
    dateOfBirth: apiProfile?.dateOfBirth ?? baseUser.dateOfBirth,
    avatar: apiProfile?.avatar ?? baseUser.avatar,
    membershipPoints: apiProfile?.membershipPoints ?? baseUser.membershipPoints,
    membershipLevel: apiProfile?.membershipLevel ?? baseUser.membershipLevel,
  } as PresentationalUserInfoCardProps;

  return (
    <PresentationalUserInfoCard
      {...merged}
      onUpdate={handleApiUpdate}
    />
  );
};

export default UserInfoCard;


