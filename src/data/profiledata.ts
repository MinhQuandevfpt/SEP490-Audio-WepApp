export interface ProfileData {
  version?: number;
  user: {
    fullName: string;
    email: string;
    phone: string;
    gender: 'male' | 'female' | 'other';
    dateOfBirth: string; // ISO or yyyy-mm-dd
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

