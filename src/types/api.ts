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
  email: string;      // Required as per swagger
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

// User Profile (consistent with database schema)
export interface CustomerProfile {
  email: string;
  full_name: string;   
  role: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE';
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
  gender: 'MALE' | 'FEMALE' | null;
  dateOfBirth: string | null;
  avatarURL: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  twoFactorEnabled: boolean;
  kycStatus: 'NONE' | 'PENDING' | 'VERIFIED';
  lastLogin: string | null;
  addressCount: number;
  loyaltyPoints: number;
  loyaltyLevel: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' | null;
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
  gender?: 'MALE' | 'FEMALE' | null;
  dateOfBirth?: string | null; // ISO yyyy-MM-dd
  avatarURL?: string | null;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | null;
  twoFactorEnabled?: boolean;
  kycStatus?: 'NONE' | 'PENDING' | 'VERIFIED' | null;
  preferredCategory?: string | null;
  loyaltyPoints?: number;
  loyaltyLevel?: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' | null;
}







export default {};