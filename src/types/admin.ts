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

// Admin Campaign Detail (UI-friendly, grouped by store)
export interface AdminCampaignDetailProduct {
  campaignProductId?: string;
  productId: string;
  productName: string;
  productImage: string;
  storeId: string;
  storeName: string;
  voucher?: CampaignVoucher | null;
  flashSaleSlots?: FlashSaleSlot[] | null;
  registeredAt?: string;
}

export interface AdminCampaignStoreGroup {
  storeId: string;
  storeName: string;
  products: AdminCampaignDetailProduct[];
}

export interface AdminCampaignDetail {
  campaignId: string;
  campaignName: string;
  campaignType: CampaignType;
  status?: CampaignStatus;
  startTime: string;
  endTime: string;
  badgeLabel?: string;
  badgeColor?: string;
  badgeIconUrl?: string;
  stores: AdminCampaignStoreGroup[];
}

// Admin campaign product management table (flat rows from /api/campaigns/products/details)
export type AdminCampaignProductStatus =
  | 'DRAFT'
  | 'APPROVE'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'REJECTED'
  | 'DISABLED';

export interface AdminCampaignProductSlot {
  slotId: string;
  openTime: string;
  closeTime: string;
  slotStatus: 'PENDING' | 'ACTIVE' | 'ENDED';
}

// Mirrors PlatformCampaignProduct from backend (admin view)
export interface AdminCampaignProductRow {
  campaignProductId: string;
  campaignId: string;
  campaignName: string;
  campaignType: CampaignType;
  storeId: string;
  storeName: string;
  productId: string;
  productName: string;
  brandName: string;
  categories: string[];
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number | null;
  discountPercent: number | null;
  maxDiscountValue: number | null;
  minOrderValue: number | null;
  totalVoucherIssued: number;
  totalUsageLimit: number;
  usagePerUser: number;
  remainingUsage: number;
  approved: boolean;
  approvedAt: string | null;
  registeredAt: string;
  status: AdminCampaignProductStatus;
  reason: string | null;
  startTime: string;
  endTime: string;
  slot: AdminCampaignProductSlot | null;
  createdAt: string;
  updatedAt: string;
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

export interface AutoCreateBillResult {
  storeId: string;
  storeName?: string;
  billId: string;
  billCode: string;
  totalNetPayout: number;
  success: boolean;
  message?: string;
}

export interface AutoCreateBillsResponse {
  totalStoresProcessed: number;
  billsCreated: number;
  results: AutoCreateBillResult[];
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

// Platform Fee Management Types
export interface PlatformFee {
  feeId: string;
  percentage: number;
  effectiveDate: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PlatformFeeListResponse = PlatformFee[];

export interface CreatePlatformFeeRequest {
  feeId: string; // Mặc định là "" (rỗng)
  percentage: number;
  effectiveDate: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlatformFeeResponse {
  feeId: string;
  percentage: number;
  effectiveDate: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Platform Wallet Types
export type PlatformTransactionType = 
  | 'HOLD' 
  | 'RELEASE' 
  | 'REFUND' 
  | 'WITHDRAW' 
  | 'DEPOSIT' 
  | 'INITIALIZE' 
  | 'PAYOUT_STORE' 
  | 'PLATFORM_FEE' 
  | 'SHIPPING_FEE_ADJUST' 
  | 'REFUND_CUSTOMER_RETURN'
  | 'DEBT_PAYMENT'
  | 'TOPUP'
  | 'TRANSFER';

export type PlatformTransactionStatus = 'PENDING' | 'DONE' | 'FAILED' | 'SUCCESS';

export type TransactionDirection = 'IN' | 'OUT';
export type TransactionChannel = 'PAYOS' | 'INTERNAL' | 'BANK_TRANSFER';
export type TransactionBucket = 'CASH' | 'PENDING';

export interface PlatformTransaction {
  id: string;
  walletId: string;
  orderId: string | null;
  storeId: string | null;
  customerId: string | null;
  amount: number;
  type: PlatformTransactionType;
  status: PlatformTransactionStatus;
  channel: TransactionChannel;
  bucket: TransactionBucket;
  direction: TransactionDirection;
  balanceBefore: number;
  balanceAfter: number;
  idempotencyKey: string | null;
  externalRefId: string | null;
  externalRefCode: string | null;
  itemAmount: number;
  shipCustomerPaid: number;
  shipReal: number;
  shipDiffChargeStore: number;
  commissionAmount: number;
  commissionRate: number;
  payoutRequestId: string | null;
  payoutGross: number;
  debtDeducted: number;
  payoutNet: number;
  description: string;
  metadataJson: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformWallet {
  id: string;
  ownerType: 'PLATFORM';
  ownerId: string | null;
  totalBalance: number;
  pendingBalance: number;
  doneBalance: number;
  receivedTotal: number;
  refundedTotal: number;
  currency: string;
  createdAt: string;
  transactions: PlatformTransaction[];
}

export interface PlatformWalletResponse {
  id: string;
  ownerType: 'PLATFORM';
  ownerId: string | null;
  totalBalance: number;
  pendingBalance: number;
  doneBalance: number;
  receivedTotal: number;
  refundedTotal: number;
  currency: string;
  createdAt: string;
  transactions: PlatformTransaction[];
}

export interface PlatformTransactionFilterParams {
  storeId?: string;
  customerId?: string;
  status?: PlatformTransactionStatus;
  type?: PlatformTransactionType;
  from?: string; // ISO date
  to?: string; // ISO date
  page?: number;
  size?: number;
}

export interface GhnOverview {
  from: string | null;
  toExclusive: string | null;
  flatDebtShipToGHN: number;
  customerShipPaid: number;
  storeDebtOutstandingToFlat: number;
  storeDebtPaidToFlat: number;
  storeDebtTotalToFlat: number;
  note: string;
}

export interface GhnOverviewResponse {
  status: number;
  message: string;
  data: GhnOverview;
}

export interface PlatformTransactionsPageResponse {
  status: number;
  message: string;
  data: {
    content: PlatformTransaction[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  };
}

// Settlement Report Types
export type SettlementReportType = 
  | 'UNDELI_COD' 
  | 'DELI_COD' 
  | 'DELI_ONLINE' 
  | 'PLATFORM_FEE_TO_COLLECT' 
  | 'TOTAL_COLLECTED';

export interface SettlementReportItem {
  itemId: string;
  storeOrderId: string;
  productName: string;
  quantity: number;
  lineTotal: number;
  shippingFeeEstimated: number;
  shippingFeeActual: number;
  shippingExtraForStore: number;
  platformFeePercentage: number;
  platformFeeAmount: number;
  netPayoutItem: number;
}

export interface SettlementReportEntry {
  storeOrderId: string;
  orderCode: string;
  storeId: string;
  paymentMethod: string;
  createdAt: string;
  deliveredAt: string | null;
  productsTotal: number;
  customerShippingFee: number;
  actualShippingFee: number;
  shippingExtraForStore: number;
  platformFeePercentage: number;
  platformFeeAmount: number;
  netPayoutToStore: number;
  items: SettlementReportItem[];
}

export interface SettlementReport {
  reportType: SettlementReportType;
  date: string | null;
  storeId: string | null;
  entries: SettlementReportEntry[];
  totalAmount: number;
}

export interface SettlementReportSummary {
  reportType: SettlementReportType;
  date: string | null;
  storeId: string | null;
  totalAmount: number;
}

export interface SettlementReportParams {
  type: SettlementReportType;
  date?: string; // ISO date format (yyyy-MM-dd)
  storeId?: string;
  page?: number;
  size?: number;
}

