export interface ProfileData {
  version?: number;
  user: {
    fullName: string;
    email: string;
    phone: string;
    gender: 'male' | 'female' | 'other';
    dateOfBirth: string; // ISO or yyyy-mm-dd
    password?: string; // For demo purposes only
    avatar?: string; // URL của hình ảnh đại diện
  };
  orders: Array<{
    id: string;
    date: string;
    total: number;
    status: string;
  }>;
  addresses: Array<{
    id: string;
    name: string;
    phone: string;
    addressLine: string;
    isDefault?: boolean;
  }>;
  passwordHistory?: Array<{
    id: string;
    password: string;
    changedAt: string;
    isCurrent: boolean;
  }>;
}

export const PROFILE_DATA_STORAGE_KEY = 'audioshop_profile_data_v1';
export const PROFILE_DATA_VERSION = 2;

export const defaultProfileData: ProfileData = {
  version: PROFILE_DATA_VERSION,
  user: {
    fullName: 'Nguyễn Văn A',
    email: 'nguyenvana@example.com',
    phone: '0909 123 456',
    gender: 'male',
    dateOfBirth: '1995-08-15',
    password: 'password123', // Demo password
  },
  orders: [
    { id: 'DH001', date: '2025-10-01', total: 2490000, status: 'Đã giao' },
    { id: 'DH002', date: '2025-09-20', total: 5990000, status: 'Đang giao' },
    { id: 'DH003', date: '2025-09-05', total: 1490000, status: 'Đã hủy' },
    { id: 'DH004', date: '2025-08-28', total: 3290000, status: 'Chuẩn bị hàng' },
    { id: 'DH005', date: '2025-08-12', total: 4590000, status: 'Đã tiếp nhận' },
    { id: 'DH006', date: '2025-07-30', total: 990000, status: 'Đã giao' },
    { id: 'DH007', date: '2025-07-10', total: 2190000, status: 'Đang giao' },
  ],
  addresses: [
    { id: 'ADDR1', name: 'Nguyễn Văn A', phone: '0909 123 456', addressLine: '123 Lê Lợi, Q.1, TP.HCM', isDefault: true },
    { id: 'ADDR2', name: 'Nguyễn Văn A', phone: '0909 123 456', addressLine: '456 Hai Bà Trưng, Q.3, TP.HCM' },
  ],
  passwordHistory: [
    { 
      id: 'PWD001', 
      password: 'password123', 
      changedAt: '2024-01-15T10:30:00Z', 
      isCurrent: true 
    },
    { 
      id: 'PWD002', 
      password: 'oldpass456', 
      changedAt: '2023-12-01T14:20:00Z', 
      isCurrent: false 
    },
    { 
      id: 'PWD003', 
      password: 'veryold789', 
      changedAt: '2023-10-15T09:15:00Z', 
      isCurrent: false 
    },
  ],
};

export const loadProfileData = (): ProfileData => {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(PROFILE_DATA_STORAGE_KEY) : null;
    if (!raw) return defaultProfileData;
    const parsed = JSON.parse(raw) as ProfileData;

    // Merge with defaults and apply simple migration rules
    const merged: ProfileData = {
      ...defaultProfileData,
      ...parsed,
      version: PROFILE_DATA_VERSION,
      user: {
        ...defaultProfileData.user,
        ...(parsed?.user || {}),
      },
      // If stored orders are missing or fewer than defaults (data update), use defaults
      orders: parsed?.orders && parsed.orders.length >= defaultProfileData.orders.length
        ? parsed.orders
        : defaultProfileData.orders,
      addresses: parsed?.addresses ?? defaultProfileData.addresses,
      passwordHistory: parsed?.passwordHistory ?? defaultProfileData.passwordHistory,
    };

    // Persist merged data back to storage to keep schema up-to-date
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(PROFILE_DATA_STORAGE_KEY, JSON.stringify(merged));
      }
    } catch {}

    return merged;
  } catch (e) {
    return defaultProfileData;
  }
};

export const saveProfileData = (data: ProfileData): void => {
  try {
    if (typeof window !== 'undefined') {
      const withVersion: ProfileData = { ...data, version: PROFILE_DATA_VERSION };
      window.localStorage.setItem(PROFILE_DATA_STORAGE_KEY, JSON.stringify(withVersion));
    }
  } catch (e) {
    // no-op fallback
  }
};

export const updatePassword = (newPassword: string): void => {
  try {
    const currentData = loadProfileData();
    const now = new Date().toISOString();
    
    // Update current password in user object
    const updatedUser = {
      ...currentData.user,
      password: newPassword
    };
    
    // Add to password history
    const newPasswordEntry = {
      id: `PWD${Date.now()}`,
      password: newPassword,
      changedAt: now,
      isCurrent: true
    };
    
    // Mark all previous passwords as not current
    const updatedPasswordHistory = (currentData.passwordHistory || []).map(pwd => ({
      ...pwd,
      isCurrent: false
    }));
    
    // Add new password entry
    updatedPasswordHistory.unshift(newPasswordEntry);
    
    // Keep only last 5 passwords in history
    const trimmedHistory = updatedPasswordHistory.slice(0, 5);
    
    const updatedData: ProfileData = {
      ...currentData,
      user: updatedUser,
      passwordHistory: trimmedHistory
    };
    
    saveProfileData(updatedData);
  } catch (e) {
    console.error('Error updating password:', e);
  }
};

export const validateCurrentPassword = (password: string): boolean => {
  try {
    const currentData = loadProfileData();
    return currentData.user.password === password;
  } catch (e) {
    return false;
  }
};

