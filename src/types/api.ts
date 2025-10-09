// API Types for Customer Authentication

// Register Request
export interface CustomerRegisterRequest {
  name: string;
  password: string;
  email: string;
  phone: string;
}

// Register Response
export interface CustomerRegisterResponse {
  status: number;
  message: string;
  data: {
    email: string;
    name: string;
    phone: string;
  };
}

// Login Request
export interface CustomerLoginRequest {
  email?: string;
  phone?: string;
  password: string;
}

// Login Response
export interface CustomerLoginResponse {
  status: number;
  message: string;
  data: {
    accessToken: string;
    user: {
      email: string;
      accountId: string;
      userId: string;
      fullName: string;
      role: string;
    };
    tokenType: string;
  };
}

// Generic API Response
export interface ApiResponse<T = any> {
  status: number;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

// Error Response
export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

// User Profile
export interface CustomerProfile {
  email: string;
  fullName: string;
  role: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Customer profile response from API (detailed payload)
export interface CustomerProfileResponse {
  id: string;
  fullName: string;
  userName: string;
  email: string;
  phoneNumber: string;
  gender: string | null;
  dateOfBirth: string | null;
  avatarURL: string | null;
  status: 'active' | string;
  twoFactorEnabled: boolean;
  kycStatus: 'none' | string;
  lastLogin: string | null;
  addressCount: number;
  loyaltyPoints: number;
  loyaltyLevel: string | null;
  voucherCount: number;
  orderCount: number;
  cancelCount: number;
  returnCount: number;
  unpaidOrderCount: number;
  lastOrderDate: string | null;
  preferredCategory: string | null;
}

// Customer Profile Request
export interface CustomerProfileRequest {
  userId: string;
}


// update customer profile request
export interface UpdateCustomerRequest {
  userId: string; // bắt buộc
  fullName?: string;
  userName?: string;
  email?: string;
  phoneNumber?: string;
  gender?: 'male' | 'female' | 'other' | null;
  dateOfBirth?: string | null; // ISO yyyy-MM-dd
  avatarURL?: string | null;
  status?: 'active' | 'inactive' | 'suspended' | null;
  twoFactorEnabled?: boolean;
  kycStatus?: 'none' | 'pending' | 'verified' | null;
  preferredCategory?: string | null;
  loyaltyPoints?: number;
  loyaltyLevel?: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | null;
}







export default {};