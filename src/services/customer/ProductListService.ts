// Import HttpClient from Authcustomer.ts since it's already defined there
// We'll create a simple HTTP client for this service
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

class SimpleHttpClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  async get<T>(endpoint: string): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const startTime = performance.now();
    
    // Get token from localStorage for authenticated requests
    const token = localStorage.getItem('customer_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': '*/*',
    };
    
    // Add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    console.log(`🚀 API Call started: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    console.log(`⏱️ API Call completed in ${duration.toFixed(2)}ms: ${url}`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw {
        status: response.status,
        statusText: response.statusText,
        message: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
        data: errorData,
      };
    }

    return await response.json();
  }
}

const httpClient = new SimpleHttpClient();

// Simple cache for API responses
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCacheKey = (url: string): string => {
  return url;
};

const getCachedData = (key: string): any | null => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`📦 Cache hit for: ${key}`);
    return cached.data;
  }
  if (cached) {
    cache.delete(key);
  }
  return null;
};

const setCachedData = (key: string, data: any): void => {
  cache.set(key, { data, timestamp: Date.now() });
  console.log(`💾 Cached data for: ${key}`);
};

export interface ProductListParams {
  page?: number;
  size?: number;
  categoryName?: string;
  storeId?: string;
  keyword?: string;
  status?: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK' | 'DISCONTINUED' | 'UNLISTED' | 'SUSPENDED' | 'BANNED';
}

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
  warehouseLocation: string | null;
  provinceCode: string | null;
  districtCode: string | null;
  wardCode: string | null;
  shippingAddress: string | null;
  shippingFee: number | null;
  supportedShippingMethodIds: string[];
  bulkDiscounts: BulkDiscount[];
  status: string;
  isFeatured: boolean;
  ratingAverage: number | null;
  reviewCount: number | null;
  viewCount: number | null;
  createdAt: string;
  updatedAt: string;
  lastUpdatedAt: string;
  lastUpdateIntervalDays: number;
  createdBy: string;
  updatedBy: string;
  // Audio specific fields
  frequencyResponse?: string | null;
  sensitivity?: string | null;
  impedance?: string | null;
  powerHandling?: string | null;
  connectionType?: string | null;
  voltageInput?: string | null;
  warrantyPeriod?: string | null;
  warrantyType?: string | null;
  manufacturerName?: string | null;
  manufacturerAddress?: string | null;
  productCondition?: string | null;
  isCustomMade?: boolean | null;
  // Headphone specific
  driverConfiguration?: string | null;
  driverSize?: string | null;
  enclosureType?: string | null;
  coveragePattern?: string | null;
  crossoverFrequency?: string | null;
  placementType?: string | null;
  headphoneType?: string | null;
  compatibleDevices?: string | null;
  isSportsModel?: boolean | null;
  headphoneFeatures?: string | null;
  batteryCapacity?: string | null;
  hasBuiltInBattery?: boolean | null;
  isGamingHeadset?: boolean | null;
  headphoneAccessoryType?: string | null;
  headphoneConnectionType?: string | null;
  plugType?: string | null;
  // Microphone specific
  sirimApproved?: boolean | null;
  sirimCertified?: boolean | null;
  mcmcApproved?: boolean | null;
  micType?: string | null;
  polarPattern?: string | null;
  maxSPL?: string | null;
  micOutputImpedance?: string | null;
  micSensitivity?: string | null;
  // Amplifier specific
  amplifierType?: string | null;
  totalPowerOutput?: string | null;
  thd?: string | null;
  snr?: string | null;
  inputChannels?: number | null;
  outputChannels?: number | null;
  supportBluetooth?: boolean | null;
  supportWifi?: boolean | null;
  supportAirplay?: boolean | null;
  // Turntable specific
  platterMaterial?: string | null;
  motorType?: string | null;
  tonearmType?: string | null;
  autoReturn?: boolean | null;
  // DAC specific
  dacChipset?: string | null;
  sampleRate?: string | null;
  bitDepth?: string | null;
  balancedOutput?: boolean | null;
  inputInterface?: string | null;
  outputInterface?: string | null;
  channelCount?: number | null;
  hasPhantomPower?: boolean | null;
  eqBands?: string | null;
  faderType?: string | null;
  builtInEffects?: boolean | null;
  usbAudioInterface?: boolean | null;
  midiSupport?: boolean | null;
}

export interface ProductListPageable {
  pageNumber: number;
  pageSize: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  offset: number;
  unpaged: boolean;
  paged: boolean;
}

export interface ProductListResponse {
  status: number;
  message: string;
  data: {
    content: Product[];
    pageable: ProductListPageable;
    totalPages: number;
    totalElements: number;
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
  };
}

export class ProductListService {
  private static readonly BASE_URL = '/api/products';

  /**
   * Lấy danh sách sản phẩm với các tham số lọc
   */
  static async getProducts(params: ProductListParams = {}): Promise<ProductListResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      // Thêm các tham số vào query string
      if (params.page !== undefined) queryParams.append('page', params.page.toString());
      if (params.size !== undefined) queryParams.append('size', params.size.toString());
      if (params.categoryName) queryParams.append('categoryName', params.categoryName);
      if (params.storeId) queryParams.append('storeId', params.storeId);
      if (params.keyword) queryParams.append('keyword', params.keyword);
      if (params.status) queryParams.append('status', params.status);

      const url = `${this.BASE_URL}?${queryParams.toString()}`;
      const cacheKey = getCacheKey(url);
      
      // Check cache first
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        return cachedData;
      }
      
      const response = await httpClient.get<ProductListResponse>(url);
      
      // Cache the response
      setCachedData(cacheKey, response);
      
      return response;
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  /**
   * Lấy danh sách sản phẩm theo category
   */
  static async getProductsByCategory(
    categoryName: string, 
    params: Omit<ProductListParams, 'categoryName'> = {}
  ): Promise<ProductListResponse> {
    return this.getProducts({ ...params, categoryName });
  }

  /**
   * Tìm kiếm sản phẩm theo keyword
   */
  static async searchProducts(
    keyword: string, 
    params: Omit<ProductListParams, 'keyword'> = {}
  ): Promise<ProductListResponse> {
    return this.getProducts({ ...params, keyword });
  }

  /**
   * Lấy sản phẩm theo store
   */
  static async getProductsByStore(
    storeId: string, 
    params: Omit<ProductListParams, 'storeId'> = {}
  ): Promise<ProductListResponse> {
    return this.getProducts({ ...params, storeId });
  }

  /**
   * Lấy sản phẩm theo status
   */
  static async getProductsByStatus(
    status: ProductListParams['status'], 
    params: Omit<ProductListParams, 'status'> = {}
  ): Promise<ProductListResponse> {
    return this.getProducts({ ...params, status });
  }
}
