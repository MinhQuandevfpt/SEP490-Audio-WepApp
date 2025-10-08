import React from 'react';
import { User as UserIcon, Camera, Upload, X, Check } from 'lucide-react';

interface UserInfoCardProps {
  fullName: string;
  email: string;
  phone: string;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: string; // yyyy-mm-dd
  avatar?: string; // URL của hình ảnh đại diện
  onUpdate?: (nextUser: { fullName: string; email: string; phone: string; gender: 'male' | 'female' | 'other'; dateOfBirth: string; avatar?: string; }) => void;
}

const UserInfoCard: React.FC<UserInfoCardProps> = ({ fullName, email, phone, gender = 'other', dateOfBirth, avatar, onUpdate }) => {
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

  const [isEditing, setIsEditing] = React.useState(false);
  const [form, setForm] = React.useState({
    fullName,
    email,
    phone,
    gender: gender as 'male' | 'female' | 'other',
    dateOfBirth: dateOfBirth ?? '',
    avatar: avatar ?? '',
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
    });
  }, [fullName, email, phone, gender, dateOfBirth, avatar]);

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
        
        <div>
          <h2 className="text-xl font-bold text-gray-900">Thông tin tài khoản</h2>
          <p className="text-sm text-gray-500 flex items-center gap-1">
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

        {/* Row 3: Email at the end */}
        <div>
          <span className="text-sm text-gray-500">Email</span>
          {isEditing ? (
            <input type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent" />
          ) : (
            <p className="font-medium text-gray-900">{email}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-5 flex gap-3">
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} className="px-4 py-2 rounded-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors">Cập nhật thông tin</button>
        ) : (
          <>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors">Lưu</button>
            <button onClick={() => { setIsEditing(false); setForm({ fullName, email, phone, gender: gender as 'male' | 'female' | 'other', dateOfBirth: dateOfBirth ?? '', avatar: avatar ?? '' }); }} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">Hủy</button>
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

export default UserInfoCard;


