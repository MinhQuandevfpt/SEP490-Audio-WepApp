// Product Service for seller product management
export interface ProductVariant {
  optionName: string;
  optionValue: string;
}

export interface BulkDiscount {
  fromQuantity: number;
  toQuantity: number;
  unitPrice: number;
}

export interface CreateProductRequest {
  storeId?: string; // Sẽ được tự động thêm bởi ProductService
  categoryName: string;
  brandName: string;
  sku: string;
  name: string;
  shortDescription: string;
  description: string;
  model: string;
  color: string;
  material: string;
  dimensions: string;
  weight: number;
  images: string[];
  videoUrl?: string;
  price: number;
  currency: string;
  stockQuantity: number;
  warehouseLocation: string;
  provinceCode: string;
  districtCode: string;
  wardCode: string;
  shippingAddress: string;
  shippingFee: number;
  supportedShippingMethodIds: string[];
  variants: ProductVariant[];
  bulkDiscounts: BulkDiscount[];
  voltageInput?: string;
  warrantyPeriod?: string;
  warrantyType?: string;
  manufacturerName?: string;
  manufacturerAddress?: string;
  productCondition?: string;
  isCustomMade?: boolean;
  
  // Headphone specific
  headphoneType?: string;
  compatibleDevices?: string;
  isSportsModel?: boolean;
  headphoneFeatures?: string;
  batteryCapacity?: string;
  hasBuiltInBattery?: boolean;
  isGamingHeadset?: boolean;
  headphoneAccessoryType?: string;
  headphoneConnectionType?: string;
  plugType?: string;
  sirimApproved?: boolean;
  sirimCertified?: boolean;
  mcmcApproved?: boolean;
  
  // Speaker specific
  driverConfiguration?: string;
  driverSize?: string;
  frequencyResponse?: string;
  sensitivity?: string;
  impedance?: string;
  powerHandling?: string;
  enclosureType?: string;
  coveragePattern?: string;
  crossoverFrequency?: string;
  placementType?: string;
  connectionType?: string;
  amplifierType?: string;
  totalPowerOutput?: string;
  thd?: string;
  snr?: string;
  inputChannels?: number;
  outputChannels?: number;
  supportBluetooth?: boolean;
  supportWifi?: boolean;
  supportAirplay?: boolean;
  
  // Microphone specific
  micType?: string;
  polarPattern?: string;
  maxSPL?: string;
  micOutputImpedance?: string;
  micSensitivity?: string;
  
  // Turntable specific
  platterMaterial?: string;
  motorType?: string;
  tonearmType?: string;
  autoReturn?: boolean;
  
  // DAC/Mixer/Sound Card specific
  dacChipset?: string;
  sampleRate?: string;
  bitDepth?: string;
  balancedOutput?: boolean;
  inputInterface?: string;
  outputInterface?: string;
  channelCount?: number;
  hasPhantomPower?: boolean;
  eqBands?: string;
  faderType?: string;
  builtInEffects?: boolean;
  usbAudioInterface?: boolean;
  midiSupport?: boolean;
}

export interface CreateProductResponse {
  status: number;
  message: string;
  data: {
    productId: string;
    name: string;
    sku: string;
    status: string;
  };
}

export class ProductService {
  private static readonly API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
  private static readonly API_URL = `${this.API_BASE_URL}/api`;

  /**
   * Lấy storeId của seller hiện tại
   */
  static async getCurrentStoreId(): Promise<string> {
    try {
      // Thử lấy từ localStorage trước
      const cachedStoreId = localStorage.getItem('seller_store_id');
      if (cachedStoreId) {
        console.log('✅ Using cached store ID:', cachedStoreId);
        return cachedStoreId;
      }

      // Thử lấy từ StoreService nếu có
      try {
        const { StoreService } = await import('./StoreService');
        const storeInfo = await StoreService.getStoreInfo();
        console.log('📦 Store info from StoreService:', storeInfo);
        if (storeInfo.id) {
          localStorage.setItem('seller_store_id', storeInfo.id);
          console.log('✅ Store ID from StoreService:', storeInfo.id);
          return storeInfo.id;
        }
      } catch (storeError) {
        console.warn('Could not get store info from StoreService:', storeError);
      }

      // Thử các API endpoints khác nhau
      const possibleEndpoints = [
        `${this.API_URL}/seller/store`,
        `${this.API_URL}/seller/me`,
        `${this.API_URL}/seller/profile`,
        `${this.API_URL}/stores/me`
      ];

      for (const endpoint of possibleEndpoints) {
        try {
          console.log(`🔍 Trying endpoint: ${endpoint}`);
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Accept': '*/*',
              // TODO: Add authentication header
            },
          });

          if (response.ok) {
            const data = await response.json();
            console.log(`✅ Response from ${endpoint}:`, data);
            
            // Thử các field names khác nhau
            const storeId = data.data?.storeId || data.data?.id || data.storeId || data.id || data.store?.id || data.store?.storeId;
            
            if (storeId) {
              localStorage.setItem('seller_store_id', storeId);
              console.log('✅ Store ID found:', storeId);
              return storeId;
            }
          } else {
            console.log(`❌ ${endpoint} failed:`, response.status, response.statusText);
          }
        } catch (endpointError) {
          console.log(`❌ ${endpoint} error:`, endpointError);
        }
      }

      // Nếu tất cả đều thất bại, thử lấy từ environment variable hoặc tạo tạm thời
      const envStoreId = import.meta.env.VITE_DEFAULT_STORE_ID;
      if (envStoreId) {
        console.log('✅ Using store ID from environment:', envStoreId);
        localStorage.setItem('seller_store_id', envStoreId);
        return envStoreId;
      }

      // Hardcoded storeId cho testing (thay thế bằng storeId thật từ backend)
      const hardcodedStoreId = '550e8400-e29b-41d4-a716-446655440000'; // Thay bằng storeId thật
      console.warn('⚠️ Using hardcoded store ID for testing:', hardcodedStoreId);
      localStorage.setItem('seller_store_id', hardcodedStoreId);
      return hardcodedStoreId;

      // Tạo một storeId tạm thời cho testing (fallback)
      // console.warn('⚠️ Could not get store ID from any endpoint, using temporary ID for testing');
      // const tempStoreId = 'temp-store-' + Date.now();
      // localStorage.setItem('seller_store_id', tempStoreId);
      // return tempStoreId;

    } catch (error) {
      console.error('❌ Error getting store ID:', error);
      throw error;
    }
  }

  /**
   * Clear cache storeId (dùng khi cần refresh)
   */
  static clearStoreIdCache(): void {
    localStorage.removeItem('seller_store_id');
    console.log('🗑️ Store ID cache cleared');
  }

  /**
   * Test storeId và các API endpoints
   */
  static async testStoreEndpoints(): Promise<void> {
    console.log('🧪 Testing store endpoints...');
    
    const endpoints = [
      `${this.API_URL}/seller/store`,
      `${this.API_URL}/seller/me`,
      `${this.API_URL}/seller/profile`,
      `${this.API_URL}/stores/me`,
      `${this.API_URL}/stores`,
      `${this.API_URL}/seller/dashboard`
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 Testing: ${endpoint}`);
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: { 'Accept': '*/*' }
        });
        
        console.log(`📊 ${endpoint}: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${endpoint} response:`, data);
        } else {
          const errorText = await response.text();
          console.log(`❌ ${endpoint} error:`, errorText);
        }
      } catch (error) {
        console.log(`💥 ${endpoint} exception:`, error);
      }
    }
  }

  /**
   * Tạo sản phẩm mới
   */
  static async createProduct(productData: CreateProductRequest): Promise<CreateProductResponse> {
    try {
      // Lấy storeId trước khi tạo sản phẩm
      console.log('🔍 Getting store ID...');
      const storeId = await this.getCurrentStoreId();
      console.log('✅ Store ID obtained:', storeId);
      
      // Thêm storeId vào productData
      const productDataWithStore = {
        ...productData,
        storeId: storeId
      };

      console.log('📦 Creating product with data:', {
        ...productDataWithStore,
        images: productDataWithStore.images?.length || 0
      });

      const response = await fetch(`${this.API_URL}/products`, {
        method: 'POST',
        headers: {
          'Accept': '*/*',
          'Content-Type': 'application/json',
          // TODO: Add authentication header when available
          // 'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productDataWithStore),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API Error:', errorData);
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Product created successfully:', data);
      return data;
    } catch (error) {
      console.error('❌ Error creating product:', error);
      throw error;
    }
  }

  /**
   * Upload hình ảnh sản phẩm
   */
  static async uploadProductImages(files: File[]): Promise<string[]> {
    try {
      const uploadPromises = files.map(async (file) => {
        // TODO: Implement actual image upload to CDN/cloud storage
        // For now, return a mock URL
        return `https://cdn.example.com/products/${Date.now()}_${file.name}`;
      });

      const imageUrls = await Promise.all(uploadPromises);
      return imageUrls;
    } catch (error) {
      console.error('❌ Error uploading images:', error);
      throw error;
    }
  }

  /**
   * Lấy danh sách sản phẩm của seller
   */
  static async getSellerProducts(params?: {
    page?: number;
    limit?: number;
    status?: string;
    categoryId?: string;
  }): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.categoryId) queryParams.append('categoryId', params.categoryId);

      const response = await fetch(`${this.API_URL}/products/seller?${queryParams}`, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          // TODO: Add authentication header
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Error fetching seller products:', error);
      throw error;
    }
  }

  /**
   * Lấy danh sách sản phẩm của seller (alias for getSellerProducts)
   */
  static async getMyProducts(params?: {
    page?: number;
    size?: number;
    keyword?: string;
    status?: string;
    categoryName?: string;
  }): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page !== undefined) queryParams.append('page', params.page.toString());
      if (params?.size !== undefined) queryParams.append('size', params.size.toString());
      if (params?.keyword) queryParams.append('keyword', params.keyword);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.categoryName) queryParams.append('categoryName', params.categoryName);

      const response = await fetch(`${this.API_URL}/products?${queryParams}`, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          // TODO: Add authentication header
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Error fetching my products:', error);
      throw error;
    }
  }

  /**
   * Lấy chi tiết sản phẩm theo ID
   */
  static async getProductById(productId: string): Promise<any> {
    try {
      const response = await fetch(`${this.API_URL}/products/${productId}`, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          // TODO: Add authentication header
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('❌ Error fetching product by ID:', error);
      throw error;
    }
  }

  /**
   * Format currency
   */
  static formatCurrency(amount: number | string | null | undefined): string {
    if (amount === null || amount === undefined || amount === '') return '0 VND';
    
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount)) return '0 VND';
    
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(numAmount);
  }

  /**
   * Format date
   */
  static formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (error) {
      return 'N/A';
    }
  }

  /**
   * Get status color class
   */
  static getStatusColor(status: string): string {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-800';
      case 'OUT_OF_STOCK':
        return 'bg-red-100 text-red-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      case 'PENDING':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Get status label
   */
  static getStatusLabel(status: string): string {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'Hoạt động';
      case 'DRAFT':
        return 'Nháp';
      case 'OUT_OF_STOCK':
        return 'Hết hàng';
      case 'INACTIVE':
        return 'Không hoạt động';
      case 'PENDING':
        return 'Chờ duyệt';
      default:
        return status || 'Không xác định';
    }
  }
}