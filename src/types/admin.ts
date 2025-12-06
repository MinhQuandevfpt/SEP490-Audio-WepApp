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

// Campaign Management Types
export type CampaignType = 'MEGA_SALE' | 'FAST_SALE';
export type CampaignStatus = 'ACTIVE' | 'APPROVE' | 'DISABLED' | 'DRAFT' | 'EXPIRED' | 'ONOPEN';

export interface FlashSlot {
  slotId?: string;
  openTime: string;
  closeTime: string;
  status?: 'PENDING' | 'ACTIVE' | 'ENDED';
}

export interface Campaign {
  id: string;
  code: string;
  name: string;
  description: string;
  type: CampaignType; 
  badgeLabel: string;
  badgeColor: string;
  badgeIconUrl: string;
  allowRegistration: boolean;
  startTime: string;
  endTime: string;
  status: CampaignStatus;
  flashSlots?: FlashSlot[]; 
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCampaignRequest {
  code: string;
  name: string;
  description: string;
  campaignType: CampaignType; 
  badgeLabel: string;
  badgeColor: string;
  badgeIconUrl: string;
  allowRegistration: boolean;
  startTime: string;
  endTime: string;
  flashSlots?: FlashSlot[];
}

export interface CampaignResponse {
  status: number;
  message: string;
  data: Campaign;
}

export interface UpdateCampaignRequest {
  name?: string;
  description?: string;
  badgeLabel?: string;
  badgeColor?: string;
  badgeIconUrl?: string;
  allowRegistration?: boolean;
  approvalRule?: string;
  status?: CampaignStatus;
  startTime?: string;
  endTime?: string;
  flashSlots?: {
    id?: string; 
    openTime: string;
    closeTime: string;
    status?: string;
  }[];
}

export interface CampaignListResponse {
  status: number;
  message: string;
  data: Campaign[];
}

// Campaign Product Approval Types
export type VoucherType = 'FIXED' | 'PERCENT';
export type VoucherStatus = 'DRAFT' | 'APPROVE' | 'ACTIVE' | 'EXPIRED' | 'DISABLED' | 'REJECTED';

export interface CampaignVoucher {
  type: VoucherType;
  discountValue: number | null;
  discountPercent: number | null;
  maxDiscountValue: number | null;
  minOrderValue: number | null;
  status: VoucherStatus;
  startTime: string;
  endTime: string;
}

export interface FlashSaleSlot {
  slotId: string;
  openTime: string;
  closeTime: string;
  status: string;
  voucher?: CampaignVoucher | null; // Flash Sale slot có voucher riêng
}

export interface CampaignProduct {
  campaignProductId: string;
  productId: string;
  productName: string;
  productImage: string;
  originalPrice: number;
  storeId: string;
  storeName: string;
  voucher: CampaignVoucher;
  flashSaleSlots: FlashSaleSlot[] | null;
}

export interface CampaignOverviewItem {
  campaignId: string;
  campaignName: string;
  campaignType: CampaignType;
  products: CampaignProduct[];
}

export interface CampaignOverviewData {
  page: number;
  totalCampaigns: number;
  size: number;
  data: CampaignOverviewItem[];
}

export interface CampaignOverviewResponse {
  status: number;
  message: string;
  data: CampaignOverviewData;
}

export interface ApproveProductsRequest {
  campaignProductIds: string[];
}

export interface ApproveProductsResponse {
  status: number;
  message: string;
  data?: any;
}

// Banner Management Types
export interface BannerImage {
  id?: string;
  imageUrl: string;
  redirectUrl: string;
  altText: string;
  sortOrder: number;
}

export interface Banner {
  id: string;
  title: string;
  description: string;
  bannerType: string;
  active: boolean;
  startTime: string;
  endTime: string;
  images: BannerImage[];
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateBannerRequest {
  title: string;
  description: string;
  bannerType: string;
  active: boolean;
  startTime: string;
  endTime: string;
  images: Omit<BannerImage, 'id'>[];
}

export interface UpdateBannerRequest {
  title?: string;
  description?: string;
  bannerType?: string;
  active?: boolean;
  startTime?: string;
  endTime?: string;
  images?: Omit<BannerImage, 'id'>[];
}

export interface BannerResponse {
  status: number;
  message: string;
  data: Banner;
}

export interface BannerListResponse {
  status: number;
  message: string;
  data: Banner[];
}

// Payout Bill Management Types
export type PayoutBillStatus = 'PENDING' | 'PAID' | 'CANCELED';

export interface PayoutBillItem {
  id?: string; // Optional - may not be present in detail API response
  orderItemId: string;
  storeOrderId: string;
  productName: string;
  quantity: number;
  isReturned: boolean;
  finalLineTotal: number;
  platformFeePercentage: number;
  platformFeeAmount: number;
  netPayout: number;
}

export interface ShippingOrder {
  id?: string; // Optional - may not be present in detail API response
  storeOrderId: string;
  ghnOrderCode: string;
  shippingFee: number;
  shippingType: string;
}

export interface ReturnShipFee {
  id?: string; // Optional - may not be present in API response
  returnRequestId: string;
  ghnOrderCode: string;
  shippingFee: number;
  chargedToShop: number;
  shippingType: string;
}

export interface PayoutBill {
  id: string;
  shopId: string;
  billCode: string;
  createdAt: string;
  updatedAt?: string; // Optional - may not be present in detail response
  fromDate: string;
  toDate: string;
  totalGross: number;
  totalPlatformFee: number;
  totalShippingOrderFee: number;
  totalReturnShippingFee: number;
  totalNetPayout: number;
  status: PayoutBillStatus;
  transferReference: string | null;
  receiptImageUrl: string | null;
  adminNote: string | null;
  items: PayoutBillItem[];
  shippingOrders: ShippingOrder[];
  returnShipFees?: ReturnShipFee[]; // Used in list response
  returnFees?: ReturnShipFee[]; // Used in detail response (alternative field name)
}

export interface PayoutBillListParams {
  storeId?: string;
  status?: PayoutBillStatus;
  fromDate?: string;
  toDate?: string;
  billCode?: string;
}

export interface PayoutBillListResponse {
  status: number;
  message: string;
  data: PayoutBill[];
}

export interface PayoutBillDetailResponse {
  status: number;
  message: string;
  data: PayoutBill;
}

