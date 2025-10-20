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

// Product Types for Seller - Full Product Details from API
export interface ProductVariant {
  optionName: string;
  optionValue: string;
}

export interface BulkDiscount {
  fromQuantity: number;
  toQuantity: number;
  unitPrice: number;
}

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
  status: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK' | 'PENDING' | 'REJECTED';
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

// Product Query Parameters
export interface ProductQueryParams {
  categoryName?: string;
  storeId?: string;
  keyword?: string;
  status?: string;
  page?: number;
  size?: number;
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

// Order Types for Seller
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';

export interface OrderItem {
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  total: number;
}

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
