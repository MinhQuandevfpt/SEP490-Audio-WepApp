import type { ApiResponse } from './api';

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
    refreshToken?: string;  // Added refresh token support
    user: {
      email: string;
      fullName: string;
      role: string;
      storeId?: string;  // Added store ID support
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

// Store Status Types
export type StoreStatus = 'INACTIVE' | 'PENDING' | 'REJECTED' | 'ACTIVE';

export interface StoreInfo {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  status: StoreStatus;
  description?: string;
  logoUrl?: string;
  bannerUrl?: string;
  address?: string;
  kycInfo?: KycResponse;
  createdAt: string;
  updatedAt: string;
}

export interface StoreStatusResponse {
  status: StoreStatus;
  message: string;
  canAccessDashboard: boolean;
}

// Store Detail Types (for Store Profile)
export interface StoreDetail {
  storeId: string;
  storeName: string;
  description: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  address: string | null;
  phoneNumber: string | null;
  email: string | null;
  rating: number | null;
  status: StoreStatus;
  accountId: string;
  storeAddresses: Array<{
    addressId: string;
    defaultAddress: boolean;
    provinceCode: string;
    districtCode: string;
    wardCode: string;
    address: string;
    addressLocation: string | null;
  }>;
}

export interface StoreDetailResponse extends ApiResponse<StoreDetail> {}

// Update Store Types
export interface UpdateStoreRequest {
  storeName?: string;
  description?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  storeAddresses?: Array<{
    addressId?: string;
    defaultAddress: boolean;
    provinceCode: string;
    districtCode: string;
    wardCode: string;
    address: string;
    addressLocation?: string;
  }>;
}

export interface UpdateStoreResponse extends ApiResponse<StoreDetail> {}

// Dashboard Statistics Types
export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  pendingOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  revenueGrowth?: number;
  ordersGrowth?: number;
}

// Shop Stats Types (Range Statistics)
export interface TopProduct {
  productId: string;
  name: string;
  totalSoldQuantity: number;
  totalRevenue: number;
}

export interface TopReturnProduct {
  productId: string;
  productName: string;
  returnCount: number;
}

export interface ShopStatsRangeResponse {
  totalDeliveredOrders: number;
  totalRevenue: number;
  totalPlatformFee: number;
  totalNetRevenue: number;
  totalReturnRequests: number;
  returnRate: number;
  top10Products: TopProduct[];
  topReturnProduct: TopReturnProduct | null;
  totalShippingDifferenceFee: number;
  totalReturnShippingFee: number;
}

// Product Types for Seller - Full Product Details from API
export interface ProductVariant {
  variantId?: string; // Từ API response
  optionName: string;
  optionValue: string;
  variantPrice: number;
  variantStock: number;
  variantUrl: string;
  variantSku: string;
}

export interface BulkDiscount {
  fromQuantity: number;
  toQuantity: number;
  unitPrice: number;
}

export interface ProductVariantPayload extends ProductVariant {}

type ImmutableProductFields =
  | 'productId'
  | 'storeId'
  | 'storeName'
  | 'createdAt'
  | 'updatedAt'
  | 'lastUpdatedAt'
  | 'lastUpdateIntervalDays'
  | 'createdBy'
  | 'updatedBy'
  | 'ratingAverage'
  | 'reviewCount'
  | 'viewCount'
  | 'promotionPercent'
  | 'priceAfterPromotion'
  | 'priceBeforeVoucher'
  | 'voucherAmount'
  | 'finalPrice'
  | 'platformFeePercent';

export type ProductUpdateRequest = Partial<Omit<Product, ImmutableProductFields>>;

export interface ProductUpdateResponse extends ApiResponse<Product> {}

export interface Product {
  productId: string;
  storeId: string;
  storeName: string;
  categoryId: string;
  categoryName: string;
  brandName: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  model: string;
  color: string;
  material: string;
  dimensions: string;
  weight: number;
  variants: ProductVariant[];
  images: string[];
  videoUrl: string | null;
  sku: string;
  price: number;
  discountPrice: number | null;
  promotionPercent: number | null;
  priceAfterPromotion: number;
  priceBeforeVoucher: number;
  voucherAmount: number | null;
  finalPrice: number;
  platformFeePercent: number | null;
  currency: string;
  stockQuantity: number;
  warehouseLocation: string;
  provinceCode: string | null;
  districtCode: string | null;
  wardCode: string | null;
  shippingAddress: string;
  shippingFee: number | null;
  supportedShippingMethodIds: string[];
  bulkDiscounts: BulkDiscount[];
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK' | 'PENDING' | 'REJECTED';
  isFeatured: boolean;
  ratingAverage: number | null;
  reviewCount: number | null;
  viewCount: number | null;
  createdAt: string;
  updatedAt: string | null;
  lastUpdatedAt: string | null;
  lastUpdateIntervalDays: number | null;
  createdBy: string;
  updatedBy: string | null;
  
  // Audio Equipment Specifications
  frequencyResponse: string | null;
  sensitivity: string | null;
  impedance: string | null;
  powerHandling: string | null;
  connectionType: string | null;
  voltageInput: string | null;
  warrantyPeriod: string | null;
  warrantyType: string | null;
  manufacturerName: string | null;
  manufacturerAddress: string | null;
  productCondition: string | null;
  isCustomMade: boolean;
  
  // Speaker specific
  driverConfiguration: string | null;
  driverSize: string | null;
  enclosureType: string | null;
  coveragePattern: string | null;
  crossoverFrequency: string | null;
  placementType: string | null;
  
  // Headphone specific
  headphoneType: string | null;
  compatibleDevices: string | null;
  isSportsModel: boolean;
  headphoneFeatures: string | null;
  batteryCapacity: string | null;
  hasBuiltInBattery: boolean;
  isGamingHeadset: boolean;
  headphoneAccessoryType: string | null;
  headphoneConnectionType: string | null;
  plugType: string | null;
  sirimApproved: boolean;
  sirimCertified: boolean;
  mcmcApproved: boolean;
  
  // Microphone specific
  micType: string | null;
  polarPattern: string | null;
  maxSPL: string | null;
  micOutputImpedance: string | null;
  micSensitivity: string | null;
  
  // Amplifier specific
  amplifierType: string | null;
  totalPowerOutput: string | null;
  thd: string | null;
  snr: string | null;
  inputChannels: number | null;
  outputChannels: number | null;
  supportBluetooth: boolean;
  supportWifi: boolean;
  supportAirplay: boolean;
  
  // Turntable specific
  platterMaterial: string | null;
  motorType: string | null;
  tonearmType: string | null;
  autoReturn: boolean;
  
  // DAC specific
  dacChipset: string | null;
  sampleRate: string | null;
  bitDepth: string | null;
  balancedOutput: boolean;
  inputInterface: string | null;
  outputInterface: string | null;
  
  // Mixer specific
  channelCount: number | null;
  hasPhantomPower: boolean;
  eqBands: string | null;
  faderType: string | null;
  builtInEffects: boolean;
  usbAudioInterface: boolean;
  midiSupport: boolean;
}

// Legacy alias for backward compatibility
export interface SellerProduct extends Product {}

// Category Types
export interface Category {
  categoryId: string;
  name: string;
  slug: string;
  description: string;
  iconUrl: string | null;
  sortOrder: number;
}

export interface CategoryListResponse {
  status: number;
  message: string;
  data: Category[];
}

export interface ShippingMethod {
  shippingMethodId: string;
  name: string;
  code: string;
  logoUrl: string;
  baseFee: number;
  feePerKg: number;
  estimatedDeliveryDays: number;
  supportCOD: boolean;
  supportInsurance: boolean;
  isActive: boolean;
  description: string;
  contactPhone: string;
  websiteUrl: string;
}

export interface ShippingMethodListResponse {
  status: number;
  message: string;
  data: ShippingMethod[];
}

// Product Query Parameters
export interface ProductQueryParams {
  categoryName?: string;
  storeId?: string;
  keyword?: string;
  status?: string;
  page?: number;
  size?: number;
  minPrice?: number;
  maxPrice?: number;
}

// Product List Response
export interface ProductListResponse {
  status: number;
  message: string;
  data: {
    content: Product[];
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
    totalPages: number;
    totalElements: number;
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
  };
}

// Order Types for Seller (high-level, may be mapped from store order statuses)
export type OrderStatus =
  | 'UNPAID'          // Chờ thanh toán
  | 'PENDING'         // Chờ xử lý
  | 'CONFIRMED'       // Đã xác nhận
  | 'PROCESSING'      // Đang xử lý / chuẩn bị
  | 'SHIPPING'        // Đang giao hàng
  | 'DELIVERED'       // Đã giao hàng
  | 'COMPLETED'       // Hoàn tất
  | 'CANCELLED'       // Đã hủy
  | 'RETURN_REQUESTED'// Yêu cầu trả hàng
  | 'RETURNED'        // Đã trả hàng
  | 'REFUNDED'        // Đã hoàn tiền
  | 'DELIVERY_FAIL'   // Giao hàng thất bại
  | 'DELIVERY_DENIED' // Giao hàng bị từ chối
  | 'DELIVERY_SUCCESS'// Giao hàng thành công
  | 'EXCEPTION';      // Lỗi xử lý đơn hàng

// Store Order Status (matches backend enum, extended to cover all backend statuses)
export type StoreOrderStatus = 
  | 'UNPAID'                   // Chờ thanh toán
  | 'PENDING'                  // Chờ xử lý
  | 'CONFIRMED'                // Đã xác nhận
  | 'AWAITING_SHIPMENT'        // Chờ lấy hàng
  | 'SHIPPING'                 // Đang giao hàng
  | 'READY_FOR_PICKUP'         // Kho đang chuẩn bị
  | 'READY_FOR_DELIVERY'       // Chờ giao hàng
  | 'OUT_FOR_DELIVERY'         // Đang giao hàng
  | 'DELIVERED_WAITING_CONFIRM'// Chờ xác nhận giao hàng
  | 'DELIVERY_SUCCESS'         // Giao hàng thành công
  | 'DELIVERY_DENIED'          // Giao hàng bị từ chối
  | 'DELIVERY_FAIL'            // Giao hàng thất bại / không giao được
  | 'EXCEPTION'                // Lỗi xử lý đơn hàng
  | 'COMPLETED'                // Đã giao hàng
  | 'CANCELLED'                // Đã hủy
  | 'RETURN_REQUESTED'         // Yêu cầu trả hàng
  | 'RETURNED';                // Đã trả hàng

// Store Order Item
export interface StoreOrderItem {
  id: string;
  type: 'PRODUCT' | 'COMBO';
  refId: string;  // Product ID or Combo ID
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

// Store Order (from API response)
export interface StoreOrder {
  id: string;
  orderCode: string;
  storeId: string;
  storeName: string;
  status: StoreOrderStatus;
  createdAt: string;
  totalAmount: number;
  discountTotal: number;
  shippingFee: number;
  grandTotal: number;
  customerOrderId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerMessage: string | null;
  shipReceiverName: string;
  shipPhoneNumber: string;
  shipCountry: string;
  shipProvince: string;
  shipDistrict: string;
  shipWard: string;
  shipStreet: string;
  shipAddressLine: string;
  shipPostalCode: string;
  shipNote: string | null;
  items: StoreOrderItem[];
}

// Store Orders List Response
export interface StoreOrdersResponse {
  items: StoreOrder[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

// Store Orders Request Parameters
export interface StoreOrdersRequest {
  page?: number;
  size?: number;
  status?: StoreOrderStatus;
  search?: string;
  orderCodeKeyword?: string;
}

// Assign Delivery Staff Request
export interface AssignDeliveryStaffRequest {
  deliveryStaffId: string; // Bắt buộc
  preparedByStaffId?: string | null; // Tùy chọn
  note?: string | null; // Ghi chú giao hàng
}

// Assign Delivery Staff Response
export interface AssignDeliveryStaffResponse {
  status: number;
  message: string;
  data: StoreOrder; // Updated order data
}

// Legacy OrderItem interface (keep for backward compatibility)
export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  total: number;
}

// Legacy SellerOrder interface (keep for backward compatibility)
export interface SellerOrder {
  id: string;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED';
  note?: string;
  createdAt: string;
  updatedAt: string;
}

// GHN Province Types
export interface Province {
  ProvinceID: number;
  ProvinceName: string;
  CountryID: number;
  Code: string;
  NameExtension: string[];
  IsEnable: number;
  RegionID: number;
  RegionCPN: number;
  UpdatedBy: number;
  CreatedAt: string;
  UpdatedAt: string;
  AreaID: number;
  CanUpdateCOD: boolean;
  Status: number;
  UpdatedEmployee: number;
  UpdatedSource: string;
  UpdatedDate: string;
}

export interface ProvinceListResponse {
  code: number;
  message: string;
  data: Province[];
}

// GHN District Types
export interface District {
  DistrictID: number;
  ProvinceID: number;
  DistrictName: string;
  Code: string;
  Type: number;
  SupportType: number;
  NameExtension: string[];
  IsEnable: number;
  UpdatedBy?: number;
  CreatedAt?: string;
  UpdatedAt?: string;
  CanUpdateCOD: boolean;
  Status: number;
  PickType: number;
  DeliverType: number;
  WhiteListClient: {
    From: any[];
    To: any[];
    Return: any[];
  };
  WhiteListDistrict: {
    From: any;
    To: any;
  };
  GovernmentCode: string;
  ReasonCode: string;
  ReasonMessage: string;
  OnDates: any;
  CreatedIP?: string;
  CreatedEmployee?: number;
  CreatedSource?: string;
  CreatedDate?: string;
  UpdatedEmployee: number;
  UpdatedSource: string;
  UpdatedDate: string;
}

export interface DistrictListResponse {
  code: number;
  message: string;
  data: District[];
}

export interface DistrictRequest {
  province_id: number;
}

// GHN Ward Types
export interface Ward {
  WardCode: string;
  DistrictID: number;
  WardName: string;
  NameExtension: string[];
  CanUpdateCOD: boolean;
  SupportType: number;
  PickType: number;
  DeliverType: number;
  WhiteListClient: {
    From: any[];
    To: any[];
    Return: any[];
  };
  WhiteListWard: {
    From: any;
    To: any;
  };
  GovernmentCode: string;
  Status: number;
  Config: {
    From: {
      LockType: string;
    };
    To: {
      LockType: string;
    };
    Return: {
      LockType: string;
    };
  };
  ReasonCode: string;
  ReasonMessage: string;
  OnDates: string[];
  CreatedIP: string;
  CreatedEmployee: number;
  CreatedSource: string;
  CreatedDate: string;
  UpdatedEmployee: number;
  UpdatedSource: string;
  UpdatedDate: string;
}

export interface WardListResponse {
  code: number;
  message: string;
  data: Ward[];
}

export interface WardRequest {
  district_id: number;
}

// ==================== STORE STAFF TYPES ====================

// Create Staff Request
export interface CreateStaffRequest {
  username: string;
  password: string;
  fullName: string;
  email: string;
  phone: string;
}

// Staff Response (from API)
export interface StaffResponse {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  storeId: string;
}

// Staff Info (for UI)
export interface StaffInfo {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  storeId: string;
  createdAt?: string;
  updatedAt?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

// Update Staff Request
export interface UpdateStaffRequest {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string; // Optional - only update if provided
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

// Staff List Data (actual API response data structure)
export interface StaffListData {
  total: number;
  page: number;
  content: StaffInfo[];
  size: number;
}

// Staff List Response (wrapped in ApiResponse)
export interface StaffListResponse extends ApiResponse<StaffListData> {}

// Legacy StaffListResponse (keep for backward compatibility if needed)
export interface StaffListResponseLegacy {
  content: StaffInfo[];
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

// Campaign Types for Seller
export interface CampaignForSeller {
  id: string;
  name: string;
  code: string;
  type: 'MEGA_SALE' | 'FAST_SALE';
  status: 'DRAFT' | 'ONOPEN' | 'ACTIVE' | 'APPROVE' | 'DISABLED' | 'EXPIRED';
  startTime: string;
  endTime: string;
  createdAt?: string;
  description?: string;
  allowRegistration?: boolean;
  badgeLabel?: string;
  badgeColor?: string;
  badgeIconUrl?: string;
  flashSlots?: FlashSlot[];
}

export interface FlashSlot {
  slotId: string;
  openTime: string;
  closeTime: string;
  status: string;
}

export type VoucherType = 'FIXED' | 'PERCENT';

export interface CampaignProductRequest {
  productId: string;
  slotId?: string; 
  type: VoucherType;
  discountValue?: number;
  discountPercent?: number;
  maxDiscountValue?: number;
  minOrderValue?: number;
  totalVoucherIssued?: number;
  totalUsageLimit?: number;
  usagePerUser?: number;
}

export interface JoinCampaignRequest {
  products: CampaignProductRequest[];
}

export interface JoinCampaignResponse {
  status: number;
  message: string;
  data: any;
}

// Campaign Product Detail Types
export type CampaignProductStatus = 'DRAFT' | 'ACTIVE' | 'APPROVE' | 'EXPIRED' | 'REJECTED' | 'DISABLED';

export interface CampaignProductSlot {
  slotId: string;
  openTime: string;
  closeTime: string;
  slotStatus: string;
}

export interface CampaignProductDetail {
  campaignProductId: string;
  campaignId: string;
  campaignName: string;
  campaignType: 'MEGA_SALE' | 'FAST_SALE';
  storeId: string;
  storeName: string;
  productId: string;
  productName: string;
  brandName: string;
  category: string;
  originalPrice: number;
  discountedPrice: number;
  discountType: VoucherType;
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
  status: CampaignProductStatus;
  reason: string | null;
  startTime: string;
  endTime: string;
  slot: CampaignProductSlot | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CampaignProductDetailsResponse {
  status: number;
  message: string;
  data: CampaignProductDetail[];
}

// ==================== FINANCE / WALLET TYPES ====================

export type TransactionType = 
  | 'DEPOSIT'           // Nạp tiền
  | 'PENDING_HOLD'      // Giữ tiền chờ
  | 'RELEASE_PENDING'   // Giải phóng tiền chờ
  | 'WITHDRAW'          // Rút tiền
  | 'REFUND'            // Hoàn tiền
  | 'ADJUSTMENT';       // Điều chỉnh thủ công

export interface WalletTransaction {
  transactionId: string;
  walletId: string;
  orderId: string | null;
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
  type: TransactionType;
  displayType: string; // Vietnamese display name
}

export interface WalletTransactionFilterParams {
  walletId?: string;
  from?: string; // ISO format date
  to?: string; // ISO format date
  type?: TransactionType;
  transactionId?: string;
  page?: number;
  size?: number;
  sort?: string; // Format: "field:direction" (e.g., "createdAt:desc")
}

export interface WalletTransactionPageable {
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
}

export interface WalletTransactionListData {
  content: WalletTransaction[];
  pageable: WalletTransactionPageable;
  totalElements: number;
  totalPages: number;
  last: boolean;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

export interface WalletTransactionListResponse extends ApiResponse<WalletTransactionListData> {}

// Wallet Information Types
export interface WalletInfo {
  storeId: string;
  storeName: string;
  walletId: string;
  depositBalance: number;
  availableBalance: number;
  pendingBalance: number;
  totalRevenue: number;
  createdAt: string;
  updatedAt: string;
}

export interface WalletInfoResponse extends ApiResponse<WalletInfo> {}

// Store Address Types
export interface StoreAddress {
  id: string;
  defaultAddress: boolean;
  provinceCode: string;
  districtCode: string;
  wardCode: string;
  address: string;
  addressLocation: string; // Format: "latitude,longitude"
}

export interface StoreAddressListResponse extends ApiResponse<StoreAddress[]> {}

export interface CreateStoreAddressRequest {
  defaultAddress: boolean;
  provinceCode: string;
  districtCode: string;
  wardCode: string;
  address: string;
  addressLocation?: string; // Format: "latitude,longitude" (optional)
}

export interface CreateStoreAddressResponse extends ApiResponse<StoreAddress[]> {}

// ==================== COMBO TYPES ====================

// Combo Item (product in combo)
export interface ComboItem {
  productId: string;
  variantId?: string; // Optional: for products with variants
  productName?: string; // From API response
  variantName?: string; // For display purposes
  optionName?: string; // e.g., "Màu sắc", "Kích thước"
  optionValue?: string; // e.g., "Đỏ", "XL"
  variantPrice?: number;
  variantStock?: number;
  variantUrl?: string;
  variantSku?: string;
  quantity: number;
}

// Create Combo Request
export interface CreateComboRequest {
  storeId: string;
  name: string;
  shortDescription: string;
  description: string;
  images: string[];
  videoUrl?: string;
  weight?: number;
  stockQuantity: number;
  shippingAddress: string;
  warehouseLocation: string;
  provinceCode: string;
  districtCode: string;
  wardCode: string;
  items: ComboItem[];
  createdBy: string;
}

// Combo Response (from API)
export interface Combo {
  comboId: string;
  categoryName: string; // Always "COMBO"
  name: string;
  shortDescription: string;
  description: string;
  images: string[];
  videoUrl: string | null;
  provinceCode: string;
  districtCode: string;
  wardCode: string;
  shippingAddress: string;
  warehouseLocation: string;
  stockQuantity: number;
  storeId: string;
  storeName: string;
  creatorType: string; // "SHOP_CREATE"
  creatorId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
  items: ComboItem[];
}

// Create Combo Response
export interface CreateComboResponse extends ApiResponse<Combo> {}

// Combo List Query Parameters
export interface ComboQueryParams {
  page?: number;
  size?: number;
  keyword?: string;
  isActive?: boolean;
}

// Combo List Response
export interface ComboListResponse extends ApiResponse<Combo[]> {}