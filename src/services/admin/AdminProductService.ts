// Admin Product Management Service
import { adminHttpClient } from './AdminStoreService';

export interface ProductFilters {
  categoryName?: string; // accept single or comma-separated for multi-filter UI
  storeId?: string;
  keyword?: string;
  page?: number;
  size?: number;
  status?: string; // accept single or comma-separated statuses
  minPrice?: number;
  maxPrice?: number;
}

export interface ProductResponse {
  productId: string;
  storeId: string;
  storeName: string;
  categoryId: string;
  categoryName: string;
  brandName: string | null;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string;
  model: string | null;
  color: string | null;
  material: string | null;
  dimensions: string | null;
  weight: number | null;
  variants: ProductVariant[];
  images: string[];
  videoUrl: string | null;
  sku: string;
  price: number | null;
  discountPrice: number | null;
  promotionPercent: number | null;
  priceAfterPromotion: number | null;
  priceBeforeVoucher: number | null;
  voucherAmount: number | null;
  finalPrice: number | null;
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
  bulkDiscounts: any[];
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
  // Additional fields...
  [key: string]: any;
}

export interface ProductVariant {
  variantId: string;
  optionName: string;
  optionValue: string;
  variantPrice: number;
  variantStock: number;
  variantUrl: string | null;
  variantSku: string;
}

export class AdminProductService {
  /**
   * Get all products with filters
   * GET /api/products
   */
  static async getAllProducts(filters?: ProductFilters): Promise<ProductResponse[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters?.categoryName) params.append('categoryName', filters.categoryName);
      if (filters?.storeId) params.append('storeId', filters.storeId);
      if (filters?.keyword) params.append('keyword', filters.keyword);
      if (filters?.page !== undefined) params.append('page', filters.page.toString());
      if (filters?.size !== undefined) params.append('size', filters.size.toString());
      if (filters?.status) params.append('status', filters.status);
      if (filters?.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
      if (filters?.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());

      const queryString = params.toString();
      const url = `/api/products${queryString ? `?${queryString}` : ''}`;
      
      const response: any = await adminHttpClient.get<any>(url);
      return response?.data || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  /**
   * Get product detail by ID
   * GET /api/products/{productId}
   */
  static async getProductById(productId: string): Promise<ProductResponse> {
    try {
      const response: any = await adminHttpClient.get<any>(`/api/products/${productId}`);
      return response?.data || null;
    } catch (error) {
      console.error('Error fetching product detail:', error);
      throw error;
    }
  }

  /**
   * Approve or reject a product
   * PUT /api/products/admin/approve/{productId}
   */
  static async approveProduct(productId: string, payload: { approved: boolean; reason?: string }) {
    try {
      const response: any = await adminHttpClient.put<any>(
        `/api/products/admin/approve/${productId}`,
        payload,
        {
          'Content-Type': 'application/json',
        }
      );
      return response?.data || null;
    } catch (error) {
      console.error('Error approving product:', error);
      throw error;
    }
  }
}
