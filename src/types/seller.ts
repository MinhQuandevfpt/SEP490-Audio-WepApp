// Seller Authentication Types
export interface SellerRegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface SellerRegisterResponse {
  status: number;
  message: string;
  data: {
    email: string;
    name: string;
    phone: string;
  };
}

export interface SellerLoginRequest {
  email: string;
  password: string;
}

export interface SellerLoginResponse {
  status: number;
  message: string;
  data: {
    accessToken: string;
    user: {
      email: string;
      fullName: string;
      role: string;
    };
    tokenType: string;
  };
}

export interface SellerUser {
  email: string;
  full_name: string;
  role: string;
}

// Seller KYC Types
export interface KycRequest {
  storeName: string;
  phoneNumber: string;
  businessLicenseNumber: string;
  taxCode: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  idCardFrontUrl: string;
  idCardBackUrl: string;
  businessLicenseUrl: string;
  isOfficial: boolean;
}

export interface KycResponse {
  id: string;
  version: number;
  storeName: string;
  phoneNumber: string;
  businessLicenseNumber: string;
  taxCode: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  idCardFrontUrl: string;
  idCardBackUrl: string;
  businessLicenseUrl: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewNote: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  official: boolean;
}
