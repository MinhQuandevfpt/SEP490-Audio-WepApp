// Import HttpClient from Authcustomer.ts since it's already defined there
// We'll create a simple HTTP client for this service
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://audioe-commerce-production.up.railway.app';

class SimpleHttpClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  async get<T>(endpoint: string): Promise<T> {
    // Check if endpoint is already a full URL
    const url = endpoint.startsWith('http://') || endpoint.startsWith('https://') 
      ? endpoint 
      : `${this.baseURL}${endpoint}`;
    const startTime = performance.now();
    
    // Get token from localStorage for authenticated requests
    const token = localStorage.getItem('CUSTOMER_token');
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

  async post<T>(endpoint: string, body: any): Promise<T> {
    // Check if endpoint is already a full URL
    const url = endpoint.startsWith('http://') || endpoint.startsWith('https://') 
      ? endpoint 
      : `${this.baseURL}${endpoint}`;
    const startTime = performance.now();
    
    // Get token from localStorage for authenticated requests
    const token = localStorage.getItem('CUSTOMER_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': '*/*',
    };
    
    // Add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    console.log(`🚀 API Call started: ${url}`, { body });
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
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
  categoryName?: string; // Keep for backward compatibility
  categoryId?: string; // New: use categoryId instead of categoryName
  storeId?: string;
  keyword?: string;
  status?: 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK' | 'DISCONTINUED' | 'UNLISTED' | 'SUSPENDED' | 'BANNED' | 'REJECT' | 'PENDING_APPROVAL';
  minPrice?: number;
  maxPrice?: number;
}

export interface ProductVariant {
  variantId?: string;
  optionName: string;
  optionValue: string;  
  variantPrice: number;
  variantStock: number;
  variantUrl: string;
  variantSku: string;
  // New fields from API response
  price?: number; // Direct price field
  stock?: number; // Direct stock field
  imageUrl?: string; // Direct imageUrl field
}

export interface BulkDiscount {
  fromQuantity: number;
  toQuantity: number;
  unitPrice: number;
}

export interface ProductStore {
  id: string;
  name: string;
  status: string;
  provinceCode: string;
  districtCode: string;
  wardCode: string;
}

export interface PlatformVoucher {
  platformVoucherId: string;
  campaignId: string;
  type: string;
  discountValue: number | null;
  discountPercent: number | null;
  maxDiscountValue: number | null;
  minOrderValue: number | null;
  totalVoucherIssued: number;
  totalUsageLimit: number;
  usagePerUser: number;
  status: string;
  startTime: string;
  endTime: string;
}

export interface PlatformVoucherCampaign {
  campaignId: string;
  code: string;
  name: string;
  description: string;
  campaignType: string;
  badgeLabel: string;
  badgeColor: string;
  badgeIconUrl: string;
  status: string;
  startTime: string;
  endTime: string;
  vouchers: PlatformVoucher[];
}

export interface ProductVouchers {
  platformVouchers?: PlatformVoucherCampaign[];
}

export interface Product {
  productId: string;
  storeId?: string;
  storeName?: string;
  categoryId?: string;
  categoryName?: string;
  category?: string; // New: direct category name from API
  categories?: { categoryId: string; categoryName: string }[]; // Support multiple categories
  brandName: string;
  name: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  model?: string;
  color?: string;
  material?: string;
  dimensions?: string;
  weight?: number;
  variants: ProductVariant[];
  images?: string[];
  thumbnailUrl?: string; // New: thumbnail URL from API
  videoUrl?: string | null;
  sku?: string;
  price: number | null;
  discountPrice: number | null;
  promotionPercent?: number | null;
  priceAfterPromotion?: number;
  priceBeforeVoucher?: number;
  voucherAmount?: number | null;
  finalPrice: number | null;
  platformFeePercent?: number | null;
  currency?: string;
  stockQuantity?: number;
  warehouseLocation?: string | null;
  provinceCode?: string | null;
  districtCode?: string | null;
  wardCode?: string | null;
  shippingAddress?: string | null;
  shippingFee?: number | null;
  supportedShippingMethodIds?: string[];
  bulkDiscounts?: BulkDiscount[];
  status?: string;
  isFeatured?: boolean;
  ratingAverage: number | null;
  reviewCount: number | null;
  viewCount?: number | null;
  createdAt?: string;
  updatedAt?: string;
  lastUpdatedAt?: string;
  lastUpdateIntervalDays?: number;
  createdBy?: string;
  updatedBy?: string;
  // New fields from API response
  store?: ProductStore;
  vouchers?: ProductVouchers;
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

  // Dynamic attribute values from backend
  attributeValues?: Array<{
    attributeId: string;
    attributeName: string;
    attributeLabel: string;
    dataType: 'STRING' | 'NUMBER' | 'BOOLEAN';
    value: string | number | boolean | null;
  }>;
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
    data: Product[]; // New API structure: data.data is array
    page: {
      totalElements: number;
      pageNumber: number;
      pageSize: number;
      totalPages: number;
    };
  } | {
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
  } | Product[]; // Support both new API structure, old pagination structure, and array response
}

export class ProductListService {
  private static get BASE_URL() {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://audioe-commerce-production.up.railway.app';
    return baseUrl.endsWith('/api') ? `${baseUrl}/products` : `${baseUrl}/api/products`;
  }

  /**
   * Lấy danh sách sản phẩm với các tham số lọc
   * New API: GET /api/products/view
   */
  static async getProducts(params: ProductListParams = {}): Promise<ProductListResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      // Thêm các tham số vào query string
      // Đảm bảo luôn có page và size để API trả về pagination
      queryParams.append('page', String(params.page ?? 0));
      queryParams.append('size', String(params.size ?? 20));
      
      // Use categoryId if provided, otherwise fallback to categoryName for backward compatibility
      if (params.categoryId) {
        queryParams.append('categoryId', params.categoryId);
      } else if (params.categoryName) {
        queryParams.append('categoryName', params.categoryName);
      }
      
      if (params.storeId) queryParams.append('storeId', params.storeId);
      if (params.keyword) queryParams.append('keyword', params.keyword);
      if (params.status) queryParams.append('status', params.status);
      if (params.minPrice !== undefined && params.minPrice >= 0) {
        queryParams.append('minPrice', String(params.minPrice));
      }
      if (params.maxPrice !== undefined && params.maxPrice >= 0) {
        queryParams.append('maxPrice', String(params.maxPrice));
      }

      // Use new endpoint /api/products/view
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://audioe-commerce-production.up.railway.app';
      const apiBase = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
      const url = `${apiBase}/products/view?${queryParams.toString()}`;
      const cacheKey = getCacheKey(url);
      
      console.log(`🔍 Fetching products: ${url}`);
      
      // Check cache first
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        console.log('📦 Using cached data');
        return cachedData;
      }
      
      const response = await httpClient.get<{
        status: number;
        message: string;
        data: {
          data: Product[];
          page: {
            totalElements: number;
            pageNumber: number;
            pageSize: number;
            totalPages: number;
          };
        };
      }>(url);
      
      console.log('📥 Raw API Response:', {
        status: response.status,
        message: response.message,
        dataType: response.data?.data ? 'New Structure' : 'Unknown',
        productsCount: response.data?.data?.length || 0,
        pageInfo: response.data?.page
      });
      
      // Normalize new API response structure to match expected format
      if (response.data && 'data' in response.data && 'page' in response.data) {
        const products = response.data.data;
        const pageInfo = response.data.page;
        
        const normalizedResponse: ProductListResponse = {
          status: response.status,
          message: response.message,
          data: {
            content: products,
            pageable: {
              pageNumber: pageInfo.pageNumber,
              pageSize: pageInfo.pageSize,
              sort: { empty: true, sorted: false, unsorted: true },
              offset: pageInfo.pageNumber * pageInfo.pageSize,
              unpaged: false,
              paged: true
            },
            totalPages: pageInfo.totalPages,
            totalElements: pageInfo.totalElements,
            last: pageInfo.pageNumber >= pageInfo.totalPages - 1,
            size: pageInfo.pageSize,
            number: pageInfo.pageNumber,
            sort: { empty: true, sorted: false, unsorted: true },
            numberOfElements: products.length,
            first: pageInfo.pageNumber === 0,
            empty: products.length === 0
          }
        };
        
        console.log('✅ Normalized response:', {
          receivedProducts: products.length,
          totalElements: pageInfo.totalElements,
          totalPages: pageInfo.totalPages,
          currentPage: pageInfo.pageNumber,
          pageSize: pageInfo.pageSize
        });
        
        // Cache the normalized response
        setCachedData(cacheKey, normalizedResponse);
        
        return normalizedResponse;
      }
      
      // Fallback: Handle old response structure or array response
      if (Array.isArray(response.data)) {
        console.log('⚠️ API returned array - normalizing...');
        const products = response.data as Product[];
        const page = params.page ?? 0;
        const size = params.size ?? 20;
        const isLikelyLastPage = products.length < size;
        const estimatedTotal = isLikelyLastPage ? (page * size + products.length) : (page + 1) * size + 1;
        
        const normalizedResponse: ProductListResponse = {
          status: response.status,
          message: response.message,
          data: {
            content: products,
            pageable: {
              pageNumber: page,
              pageSize: size,
              sort: { empty: true, sorted: false, unsorted: true },
              offset: page * size,
              unpaged: false,
              paged: true
            },
            totalPages: isLikelyLastPage ? page + 1 : page + 2,
            totalElements: estimatedTotal,
            last: isLikelyLastPage,
            size: size,
            number: page,
            sort: { empty: true, sorted: false, unsorted: true },
            numberOfElements: products.length,
            first: page === 0,
            empty: products.length === 0
          }
        };
        
        setCachedData(cacheKey, normalizedResponse);
        return normalizedResponse;
      }
      
      // Handle old pagination structure
      const paginatedData = (response as any).data;
      if (paginatedData && paginatedData.content) {
        console.log('✅ API returned old pagination structure');
        setCachedData(cacheKey, response as ProductListResponse);
        return response as ProductListResponse;
      }
      
      // If we get here, something unexpected happened
      console.warn('⚠️ Unexpected response structure:', response);
      throw new Error('Unexpected API response structure');
    } catch (error) {
      console.error('❌ Error fetching products:', error);
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

  /**
   * Lấy chi tiết sản phẩm theo ID
   * GET /api/products/{productId}
   */
  static async getProductById(productId: string): Promise<{
    status: number;
    message: string;
    data: Product;
  }> {
    try {
      const url = `${this.BASE_URL}/${productId}`;
      const cacheKey = getCacheKey(url);
      
      console.log(`🔍 Fetching product detail: ${url}`);
      
      // Check cache first
      const cachedData = getCachedData(cacheKey);
      if (cachedData) {
        console.log('📦 Using cached product detail');
        return cachedData;
      }
      
      const response = await httpClient.get<{
        status: number;
        message: string;
        data: Product;
      }>(url);
      
      console.log('✅ Product detail loaded:', {
        productId: response.data.productId,
        name: response.data.name,
        price: response.data.price
      });
      
      // Cache the response
      setCachedData(cacheKey, response);
      
      return response;
    } catch (error) {
      console.error('❌ Error fetching product detail:', error);
      throw error;
    }
  }

  /**
   * Lấy thông tin campaign preview cho sản phẩm
   * POST /api/products/{productId}/campaign-preview
   */
  static async getCampaignPreview(
    productId: string,
    params: {
      customerId: string;
      variantId?: string | null;
      quantity: number;
    }
  ): Promise<{
    productId: string;
    variantId?: string | null;
    quantity: number;
    baseUnitPrice: number;
    campaignUnitPrice: number | null;
    effectiveUnitPrice: number;
    lineTotal: number;
    inCampaign: boolean;
    campaignUsageExceeded: boolean;
    campaignRemaining: number | null;
    campaignName: string | null;
    campaignCode: string | null;
  }> {
    try {
      const url = `${this.BASE_URL}/${productId}/campaign-preview`;
      
      console.log(`🔍 Fetching campaign preview: ${url}`, params);
      
      const requestBody: any = {
        customerId: params.customerId,
        quantity: params.quantity,
      };
      
      // Only include variantId if it exists
      if (params.variantId) {
        requestBody.variantId = params.variantId;
      }
      
      const response = await httpClient.post<{
        productId: string;
        variantId?: string | null;
        quantity: number;
        baseUnitPrice: number;
        campaignUnitPrice: number | null;
        effectiveUnitPrice: number;
        lineTotal: number;
        inCampaign: boolean;
        campaignUsageExceeded: boolean;
        campaignRemaining: number | null;
        campaignName: string | null;
        campaignCode: string | null;
      }>(url, requestBody);
      
      console.log('✅ Campaign preview loaded:', response);
      
      return response;
    } catch (error) {
      console.error('❌ Error fetching campaign preview:', error);
      throw error;
    }
  }
}
