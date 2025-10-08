import React from 'react';
import { User as UserIcon } from 'lucide-react';

interface UserInfoCardProps {
  fullName: string;
  email: string;
  phone: string;
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: string; // yyyy-mm-dd
  onUpdate?: (nextUser: { fullName: string; email: string; phone: string; gender: 'male' | 'female' | 'other'; dateOfBirth: string; }) => void;
}

const UserInfoCard: React.FC<UserInfoCardProps> = ({ fullName, email, phone, gender = 'other', dateOfBirth, onUpdate }) => {
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
  });

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
    });
    setIsEditing(false);
  };

  React.useEffect(() => {
    setForm({
      fullName,
      email,
      phone,
      gender: gender as 'male' | 'female' | 'other',
      dateOfBirth: dateOfBirth ?? '',
    });
  }, [fullName, email, phone, gender, dateOfBirth]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      {/* Header with avatar */}
      <div className="flex items-center gap-4 mb-5">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-xl font-bold shadow">
          {getInitials(fullName)}
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
            <button onClick={() => { setIsEditing(false); setForm({ fullName, email, phone, gender: gender as 'male' | 'female' | 'other', dateOfBirth: dateOfBirth ?? '' }); }} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">Hủy</button>
          </>
        )}
      </div>
    </div>
  );
};

export default UserInfoCard;


