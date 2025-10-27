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
    refreshToken?: string;  // Added refresh token support
    user: {
      email: string;
      accountId: string;
      customerId: string;
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
  customerId: string;
}


// update customer profile request
export interface UpdateCustomerRequest {
  customerId: string; // bắt buộc
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

// Customer Address
export type AddressLabel = 'HOME' | 'WORK' | 'OTHER';

export interface AddCustomerAddressRequest {
  customerId: string;
  receiverName: string;
  phoneNumber: string;
  label: AddressLabel;
  country: string;
  province: string;
  district: string;
  ward: string;
  street: string;
  addressLine: string;
  postalCode: string;
  note?: string;
  isDefault: boolean;
}

export interface CustomerAddress {
  id: string;
  customerId: string;
  receiverName: string;
  phoneNumber: string;
  label: AddressLabel;
  country: string;
  province: string;
  district: string;
  ward: string;
  street: string;
  addressLine: string;
  postalCode: string;
  note?: string | null;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AddCustomerAddressResponse extends ApiResponse<CustomerAddress> {}

// Get customer addresses (request requires customerId)
export interface GetCustomerAddressesRequest {
  customerId: string;
}

// API may return an array with 'default' instead of 'isDefault'
export interface CustomerAddressApiItem {
  id: string;
  customerId: string;
  receiverName: string;
  phoneNumber: string;
  label: AddressLabel;
  country: string;
  province: string;
  district: string;
  ward: string;
  street: string;
  addressLine: string;
  postalCode: string;
  note?: string;
  default: boolean;
}

export type GetCustomerAddressesResponse = CustomerAddressApiItem[];

// Update customer address
export interface UpdateCustomerAddressRequest {
  customerId: string;
  addressId: string;
  receiverName: string;
  phoneNumber: string;
  label: AddressLabel;
  country: string;
  province: string;
  district: string;
  ward: string;
  street: string;
  addressLine: string;
  postalCode: string;
  note?: string;
  isDefault: boolean;
}

// Response returns a single address object using 'default' flag
export type UpdateCustomerAddressResponse = CustomerAddressApiItem;










// ===== ADMIN USER MANAGEMENT TYPES =====

// Customer Status Enum
export type CustomerStatus = 'NONE' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';

// Customer Gender Enum
export type CustomerGender = 'MALE' | 'FEMALE' | null;

// KYC Status Enum
export type KycStatus = 'NONE' | 'PENDING' | 'VERIFIED';

// Loyalty Level Enum
export type LoyaltyLevel = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' | null;

// Customer List Request Parameters
export interface CustomerListRequest {
  keyword?: string;
  status?: CustomerStatus;
  page?: number;
  size?: number;
  sort?: string;
}

// Customer List Response (matches API response structure)
export interface CustomerListResponse {
  content: CustomerProfileResponse[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalElements: number;
  totalPages: number;
  first: boolean;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  numberOfElements: number;
  empty: boolean;
}

// Customer Statistics Response
export interface CustomerStatsResponse {
  totalCustomers: number;
  activeCustomers: number;
  inactiveCustomers: number;
  suspendedCustomers: number;
  newCustomersToday: number;
  newCustomersThisWeek: number;
  newCustomersThisMonth: number;
}

// Customer Update Status Request
export interface UpdateCustomerStatusRequest {
  customerId: string;
  status: CustomerStatus;
}

// Customer Update Status Response
export interface UpdateCustomerStatusResponse {
  success: boolean;
  message: string;
  data?: {
    customerId: string;
    status: CustomerStatus;
    updatedAt: string;
  };
}

export default {};

// ===== CATEGORY TYPES =====
export interface CategoryItem {
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  sortOrder: number;
}

export interface CategoryListResponse {
  status: number;
  message: string;
  data: CategoryItem[];
}