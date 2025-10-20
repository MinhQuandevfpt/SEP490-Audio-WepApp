// Product List Service for Customer
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
  videoUrl: string;
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
  shippingFee: number;
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
  // Technical specs
  frequencyResponse: string;
  sensitivity: string;
  impedance: string;
  powerHandling: string;
  connectionType: string;
  voltageInput: string;
  warrantyPeriod: string;
  warrantyType: string;
  manufacturerName: string;
  manufacturerAddress: string;
  productCondition: string;
  isCustomMade: boolean;
  // Speaker specs
  driverConfiguration: string;
  driverSize: string;
  enclosureType: string;
  coveragePattern: string;
  crossoverFrequency: string;
  placementType: string;
  // Headphone specs
  headphoneType: string;
  compatibleDevices: string;
  isSportsModel: boolean;
  headphoneFeatures: string;
  batteryCapacity: string;
  hasBuiltInBattery: boolean;
  isGamingHeadset: boolean;
  headphoneAccessoryType: string;
  headphoneConnectionType: string;
  plugType: string;
  sirimApproved: boolean;
  sirimCertified: boolean;
  mcmcApproved: boolean;
  // Microphone specs
  micType: string;
  polarPattern: string;
  maxSPL: string;
  micOutputImpedance: string;
  micSensitivity: string;
  // Amplifier specs
  amplifierType: string;
  totalPowerOutput: string;
  thd: string;
  snr: string;
  inputChannels: number;
  outputChannels: number;
  supportBluetooth: boolean;
  supportWifi: boolean;
  supportAirplay: boolean;
  // Turntable specs
  platterMaterial: string;
  motorType: string;
  tonearmType: string;
  autoReturn: boolean;
  // DAC/Mixer specs
  dacChipset: string;
  sampleRate: string;
  bitDepth: string;
  balancedOutput: boolean;
  inputInterface: string;
  outputInterface: string;
  channelCount: number;
  hasPhantomPower: boolean;
  eqBands: string;
  faderType: string;
  builtInEffects: boolean;
  usbAudioInterface: boolean;
  midiSupport: boolean;
}

export interface ProductListResponse {
  status: number;
  message: string;
  data: Product[];
}

export interface ProductListParams {
  categoryName?: string;
  storeId?: string;
  keyword?: string;
  page?: number;
  size?: number;
  status?: string;
}

export class ProductListService {
  private static readonly API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
  private static readonly API_URL = `${this.API_BASE_URL}/api`;

  /**
   * Lấy danh sách sản phẩm
   */
  static async getProducts(params: ProductListParams = {}): Promise<ProductListResponse> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.categoryName) queryParams.append('categoryName', params.categoryName);
      if (params.storeId) queryParams.append('storeId', params.storeId);
      if (params.keyword) queryParams.append('keyword', params.keyword);
      if (params.page !== undefined) queryParams.append('page', params.page.toString());
      if (params.size !== undefined) queryParams.append('size', params.size.toString());
      if (params.status) queryParams.append('status', params.status);

      const url = `${this.API_URL}/products${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      console.log('🔍 Fetching products from URL:', url);
      console.log('📋 Query params:', Object.fromEntries(queryParams.entries()));
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          // TODO: Add authentication header when available
          // 'Authorization': `Bearer ${token}`
        },
      });

      console.log('📊 Response status:', response.status);
      console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Products fetched successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      throw error;
    }
  }

  /**
   * Lấy sản phẩm nổi bật (featured)
   */
  static async getFeaturedProducts(limit: number = 8): Promise<ProductListResponse> {
    return this.getProducts({ 
      size: limit,
      status: 'ACTIVE'
    });
  }

  /**
   * Lấy sản phẩm theo danh mục
   */
  static async getProductsByCategory(categoryName: string, limit: number = 12): Promise<ProductListResponse> {
    return this.getProducts({ 
      categoryName,
      size: limit,
      status: 'ACTIVE'
    });
  }

  /**
   * Tìm kiếm sản phẩm
   */
  static async searchProducts(keyword: string, limit: number = 20): Promise<ProductListResponse> {
    return this.getProducts({ 
      keyword,
      size: limit,
      status: 'ACTIVE'
    });
  }

  /**
   * Format giá tiền
   */
  static formatPrice(price: number, currency: string = 'VND'): string {
    if (currency === 'VND') {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(price);
    }
    return `${price.toLocaleString()} ${currency}`;
  }

  /**
   * Format ngày tháng
   */
  static formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Lấy màu sắc theo status
   */
  static getStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'text-green-600 bg-green-100';
      case 'DRAFT': return 'text-yellow-600 bg-yellow-100';
      case 'OUT_OF_STOCK': return 'text-red-600 bg-red-100';
      case 'DISCONTINUED': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  }

  /**
   * Lấy label theo status
   */
  static getStatusLabel(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'Đang bán';
      case 'DRAFT': return 'Bản nháp';
      case 'OUT_OF_STOCK': return 'Hết hàng';
      case 'DISCONTINUED': return 'Ngừng bán';
      default: return status;
    }
  }
}
