const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://audioe-commerce-production.up.railway.app';

class SimpleHttpClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  async get<T>(endpoint: string): Promise<T> {
    const url = endpoint.startsWith('http://') || endpoint.startsWith('https://') 
      ? endpoint 
      : `${this.baseURL}${endpoint}`;
    
    const token = localStorage.getItem('CUSTOMER_token');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': '*/*',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

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

export interface ProductVariant {
  variantId: string;
  optionName: string;
  optionValue: string;
  variantSku: string;
  price: number;
  stock: number;
  imageUrl: string | null;
}

export interface StoreInfo {
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

export interface Campaign {
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

export interface ProductThumbnail {
  productId: string;
  name: string;
  brandName: string;
  price: number | null;
  discountPrice: number | null;
  finalPrice: number | null;
  category: string;
  ratingAverage: number | null;
  reviewCount: number | null;
  thumbnailUrl: string;
  variants: ProductVariant[];
  store: StoreInfo;
  vouchers: {
    platformVouchers: Campaign[];
  };
}

export interface PageInfo {
  totalElements: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface SearchResponse {
  data: ProductThumbnail[];
  page: PageInfo;
}

export interface SearchFilters {
  status?: string;
  categoryId?: string;
  storeId?: string;
  keyword?: string;
  provinceCode?: string;
  districtCode?: string;
  wardCode?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  page?: number;
  size?: number;
}

export class SearchService {
  /**
   * Search products with filters
   * GET /api/products/view
   */
  static async searchProducts(filters: SearchFilters): Promise<SearchResponse> {
    try {
      const params = new URLSearchParams();
      
      if (filters.status) params.append('status', filters.status);
      if (filters.categoryId) params.append('categoryId', filters.categoryId);
      if (filters.storeId) params.append('storeId', filters.storeId);
      if (filters.keyword) params.append('keyword', filters.keyword);
      if (filters.provinceCode) params.append('provinceCode', filters.provinceCode);
      if (filters.districtCode) params.append('districtCode', filters.districtCode);
      if (filters.wardCode) params.append('wardCode', filters.wardCode);
      if (filters.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
      if (filters.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());
      if (filters.minRating !== undefined) params.append('minRating', filters.minRating.toString());
      if (filters.page !== undefined) params.append('page', filters.page.toString());
      if (filters.size !== undefined) params.append('size', filters.size.toString());

      const queryString = params.toString();
      const endpoint = `/api/products/view${queryString ? `?${queryString}` : ''}`;
      
      const response = await httpClient.get<{
        status: number;
        message: string;
        data: SearchResponse;
      }>(endpoint);

      return response.data;
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }

  /**
   * Extract unique stores from search results
   */
  static extractStoresFromResults(products: ProductThumbnail[]): StoreInfo[] {
    const storesMap = new Map<string, StoreInfo>();
    
    products.forEach(product => {
      if (product.store && !storesMap.has(product.store.id)) {
        storesMap.set(product.store.id, product.store);
      }
    });
    
    return Array.from(storesMap.values());
  }
}

export default SearchService;
