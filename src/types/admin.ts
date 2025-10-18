// Admin KYC Management Types

export type KycStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface KycData {
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
  status: KycStatus;
  reviewNote: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  official: boolean;
}

export interface KycFilterResponse {
  status: number;
  message: string;
  data: KycData[];
}

export interface KycApproveResponse {
  status: number;
  message: string;
  data?: string;
}

export interface KycRejectRequest {
  reason: string;
}

export interface KycRejectResponse {
  status: number;
  message: string;
  data?: string;
}
