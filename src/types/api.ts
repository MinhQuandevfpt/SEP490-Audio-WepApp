import type { CheckoutPayOSItem, StoreVoucher, PlatformVoucher, ServiceTypeIds } from './cart';

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
  provinceCode: string;
  districtId: number;
  wardCode: string;
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
  provinceCode: string | null;
  districtId: number | null;
  wardCode: string | null;
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

// ==================== ORDER HISTORY TYPES ====================

// Order Status Enum (from backend + extended internal statuses)
export type OrderStatus = 
  | 'UNPAID'                 // Chờ thanh toán (online)
  | 'CONFIRMED'              // Đã xác nhận (đã thanh toán / COD)
  | 'AWAITING_SHIPMENT'      // Chờ lấy hàng (đã thanh toán / COD)
  | 'SHIPPING'               // Đang giao hàng
  | 'COMPLETED'              // Đã giao hàng / Hoàn tất
  | 'CANCELLED'              // Đã hủy
  | 'RETURN_REQUESTED'       // Yêu cầu trả hàng / hoàn tiền
  | 'RETURNED'               // Đã trả hàng / hoàn tiền xong
  | 'PENDING'                // Chờ xử lý
  // Extended internal statuses (mapping full backend list)
  | 'READY_FOR_PICKUP'       // Kho đang chuẩn bị
  | 'READY_FOR_DELIVERY'     // Chờ giao hàng
  | 'OUT_FOR_DELIVERY'       // Đang giao hàng
  | 'DELIVERED_WAITING_CONFIRM' // Chờ xác nhận giao hàng
  | 'DELIVERY_SUCCESS'       // Giao hàng thành công
  | 'DELIVERY_DENIED'        // Giao hàng bị từ chối
  | 'DELIVERY_FAIL'          // Giao hàng thất bại / không giao được
  | 'EXCEPTION';             // Lỗi xử lý đơn hàng

export type ReturnReasonType = 'CUSTOMER_FAULT' | 'SHOP_FAULT';

export interface CreateReturnRequest {
  orderItemId: string;
  productId: string;
  itemPrice: number;
  reasonType: ReturnReasonType;
  reason: string;
  customerVideoUrl?: string | null;
  customerImageUrls?: string[];
}

export interface ReturnRequestResponse {
  id: string;
  customerId: string;
  shopId: string;
  orderItemId: string;
  productId: string;
  productName: string;
  itemPrice: number;
  reasonType: ReturnReasonType;
  reason: string;
  customerImageUrls: string[];
  customerVideoUrl?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'AUTO_REFUNDED' | string;
  /**
   * Flag/metadata when system auto-approves after SLA (e.g., 48h no response)
   * Optional to keep backward compatibility with backend response
   */
  autoApproved?: boolean;
  autoApprovedAt?: string | null;
  /**
   * Flag/metadata when system auto-cancels because customer didn't ship on time
   */
  autoCancelled?: boolean;
  autoCancelledAt?: string | null;
  /**
   * Flag/metadata when system auto-refunds because shop didn't handle after receiving
   */
  autoRefunded?: boolean;
  autoRefundedAt?: string | null;
  faultType?: string | null;
  packageWeight?: number | null;
  packageLength?: number | null;
  packageWidth?: number | null;
  packageHeight?: number | null;
  shippingFee?: number | null;
  ghnOrderCode?: string | null;
  trackingStatus?: string | null;
  /**
   * Flag when shop refunds without requesting return shipment (refund-only)
   */
  refundWithoutReturn?: boolean;
  createdAt: string;
  updatedAt: string;
}

// Order Item (in store order)
export interface OrderItem {
  id: string;
  type: 'PRODUCT' | 'COMBO';
  refId: string;  // Product ID or Combo ID
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  image?: string | null;  // Base product image
  storeId?: string | null;
  storeOrderId?: string | null; // ID of the store order this item belongs to
  storeName?: string | null;
  variantId?: string | null;
  variantOptionName?: string | null;
  variantOptionValue?: string | null;
  variantUrl?: string | null; // Variant-specific image
}

// Store Order (sub-order within main order)
export interface StoreOrder {
  id: string;
  orderCode: string | null;
  storeId: string;
  storeName: string;
  status: OrderStatus;
  createdAt: string;
  totalAmount: number;
  discountTotal: number;
  shippingFee: number;
  grandTotal: number;
  items: OrderItem[];
}

// Main Customer Order
export interface CustomerOrder {
  id: string;
  orderCode: string | null;
  status: OrderStatus;
  message: string | null;
  createdAt: string;
  totalAmount: number;
  discountTotal: number;
  shippingFeeTotal: number;
  grandTotal: number;
  externalOrderCode: string | null;  // PayOS order code
  receiverName: string;
  phoneNumber: string;
  country: string;
  province: string;
  district: string;
  ward: string;
  street: string;
  addressLine: string;
  postalCode: string;
  note: string | null;
  storeOrders: StoreOrder[];
  items?: OrderItem[];
}

// ==================== REVIEW TYPES ====================
export type ReviewMediaType = 'image' | 'video';

export interface ReviewMediaPayload {
  type: ReviewMediaType;
  url: string;
}

export interface CreateReviewRequest {
  customerOrderItemId: string;
  rating: number;
  content: string;
  media?: ReviewMediaPayload[];
}

export interface ReviewResponse {
  id: string;
  rating: number;
  content: string;
  createdAt: string;
  customerId: string;
  customerName: string;
  customerAvatarUrl: string | null;
  productId: string;
  variantOptionName?: string | null;
  variantOptionValue?: string | null;
  media?: ReviewMediaPayload[];
  replies?: Array<{
    storeName: string;
    content: string;
    createdAt: string;
  }>;
  status?: 'VISIBLE' | 'HIDDEN' | 'DELETED';
}

export interface ProductReviewForCurrentUserResponse extends ReviewResponse {}

export interface StoreReviewListResponse {
  content: ReviewResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  pageable?: {
    pageNumber: number;
    pageSize: number;
  };
}

// ==================== WALLET TYPES ====================
export interface WalletTransaction {
  id: string;
  walletId: string;
  orderId: string | null;
  type: string;
  status: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string | null;
  createdAt: string;
}

export interface WalletTransactionPage {
  content: WalletTransaction[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first?: boolean;
  last?: boolean;
}

// Wallet Info (Overview)
export interface WalletInfo {
  id: string;
  customerId: string;
  balance: number;
  currency: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  lastTransactionAt: string | null;
}

// Order History Response (paginated)
export interface OrderHistoryResponse {
  items: CustomerOrder[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

// Order History Request Parameters
export interface OrderHistoryRequest {
  page?: number;
  size?: number;
  status?: OrderStatus;
  search?: string;  // Search by order ID or external order code
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

// ==================== CART TYPES ====================
// Cart types have been moved to src/types/cart.ts
// Please import from there: import { CartResponse, AddToCartRequest, etc } from './cart';

// ==================== PAYOS CHECKOUT TYPES ====================

export type PayOSItemType = 'PRODUCT' | 'COMBO';

export interface PayOSCheckoutItem extends CheckoutPayOSItem {}

export interface PayOSStoreVoucher extends StoreVoucher {}

export interface PayOSPlatformVoucher extends PlatformVoucher {}

export interface PayOSCheckoutRequestBody {
  addressId: string;
  message?: string | null;
  description?: string | null;
  items: PayOSCheckoutItem[];
  storeVouchers?: PayOSStoreVoucher[];
  platformVouchers?: PayOSPlatformVoucher[];
  serviceTypeIds?: ServiceTypeIds;
  returnUrl: string;
  cancelUrl: string;
}

export interface PayOSCheckoutData {
  customerOrderId: string;
  amount: number;
  payOSOrderCode: number;
  checkoutUrl: string;
  qrCode: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'FAILED' | string;
}

export interface PayOSCheckoutResponse extends ApiResponse<PayOSCheckoutData> {}

// ==================== STAFF AUTH TYPES ====================

export interface StaffLoginRequestBody {
  email: string;
  password: string;
}

export interface StaffLoginData {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  user: {
    email: string;
    fullName: string;
    role: string;
  };
  staff: {
    staffId: string;
    storeId: string;
    fullName: string;
    email: string;
    phone: string;
  };
}

export interface StaffLoginResponse extends ApiResponse<StaffLoginData> {}

// ==================== WARRANTY TYPES ====================

export type WarrantyStatus = 'ACTIVE' | 'EXPIRED' | 'VOID' | 'TRANSFERRED' | 'PENDING_ACTIVATION';

export interface Warranty {
  id: string | null;
  productId: string;
  productName: string;
  storeId: string;
  storeName: string;
  customerId: string;
  customerName: string;
  serialNumber: string | null;
  policyCode: string | null;
  durationMonths: number;
  purchaseDate: string;
  startDate: string | null;
  endDate: string | null;
  status: WarrantyStatus;
  covered: boolean;
  stillValid: boolean;
}

export interface WarrantyListResponse extends ApiResponse<Warranty[]> {}

// ==================== WARRANTY LOG TYPES ====================

export type WarrantyLogStatus = 'OPEN' | 'DIAGNOSING' | 'WAITING_PARTS' | 'REPAIRING' | 'READY_FOR_PICKUP' | 'SHIP_BACK' | 'COMPLETED' | 'CLOSED';

export interface WarrantyLog {
  id: string;
  warrantyId: string;
  status: WarrantyLogStatus;
  problemDescription: string;
  diagnosis: string | null;
  resolution: string | null;
  covered: boolean;
  costLabor: number | null;
  costParts: number | null;
  costTotal: number | null;
  attachmentUrls: string[];
  shipBackTracking: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WarrantyLogListResponse extends ApiResponse<WarrantyLog[]> {}

export interface UpdateWarrantyLogRequest {
  diagnosis?: string | null;
  resolution?: string | null;
  shipBackTracking?: string | null;
  attachmentUrls?: string[];
  costLabor?: number | null;
  costParts?: number | null;
}